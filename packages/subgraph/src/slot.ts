import { BigInt, Bytes, Address, dataSource } from "@graphprotocol/graph-ts";
import {
  Bought,
  Released,
  Liquidated,
  PriceUpdated,
  Deposited,
  Withdrawn,
  Settled,
  TaxCollected,
  TaxUpdateProposed,
  ModuleUpdateProposed,
  PendingUpdateApplied,
  PendingUpdateCancelled,
  LiquidationBountyUpdated,
  ModuleFeePaid,
  TransferScheduled,
  SlotConfiguredV3,
  OperatorSet,
  PolicyUpdateProposed,
  PolicyUpdateApplied,
  RefundCredited,
  RefundClaimed,
} from "../generated/templates/Slot/Slot";
import {
  Slot,
  BoughtEvent,
  ReleasedEvent,
  LiquidatedEvent,
  PriceUpdatedEvent,
  DepositedEvent,
  WithdrawnEvent,
  SettledEvent,
  TaxCollectedEvent,
  TaxUpdateProposedEvent,
  ModuleUpdateProposedEvent,
  PendingUpdateCancelledEvent,
  ModuleFeePaidEvent,
  Module,
  TransferScheduledEvent,
  OperatorSetEvent,
  SlotOperator,
  PolicyUpdateProposedEvent,
  PolicyUpdateAppliedEvent,
  RefundCreditedEvent,
  RefundClaimedEvent,
  SlotRefund,
} from "../generated/schema";
import { getOrCreateAccount, getOrCreateAccountSlot, getOrCreateModule } from "./helpers";

function evtId(txHash: Bytes, logIndex: BigInt): string {
  return txHash.toHexString() + "-" + logIndex.toString();
}

function getSlot(address: Address): Slot {
  return Slot.load(address.toHexString()) as Slot;
}

export function handleBought(event: Bought): void {
  let slot = getSlot(event.address);

  // Decrement previous occupant count & finalize hold time
  let zeroAddr = Address.zero();
  if (slot.occupant !== null && Address.fromBytes(slot.occupant as Bytes) != zeroAddr) {
    let prevAddr = Address.fromBytes(slot.occupant as Bytes);
    let prevAccount = getOrCreateAccount(prevAddr);
    prevAccount.occupiedCount -= 1;

    let prevAS = getOrCreateAccountSlot(prevAddr, event.address, event.block.timestamp);
    if (prevAS.lastOccupiedAt !== null) {
      let held = event.block.timestamp.minus(prevAS.lastOccupiedAt as BigInt);
      prevAS.holdTime = prevAS.holdTime.plus(held);
      prevAccount.totalHoldTime = prevAccount.totalHoldTime.plus(held);
    }
    prevAS.lastOccupiedAt = null;
    prevAS.lastInteractedAt = event.block.timestamp;
    prevAS.save();
    prevAccount.save();
  }

  // Set new occupant. NOTE: `buyer` is the `account` argument to buy(), not
  // necessarily the tx sender — buy(account, ...) lets one address pay while
  // another occupies, which is how SlotQueue fills on a bidder's behalf. On an
  // epoch slot this event also fires in a LATER transaction than the buy, sent
  // by whoever happened to materialise the transfer. Never read tx.from here.
  let buyerAccount = getOrCreateAccount(event.params.buyer, true);
  buyerAccount.occupiedCount += 1;
  buyerAccount.save();

  let buyerAS = getOrCreateAccountSlot(event.params.buyer, event.address, event.block.timestamp);
  buyerAS.lastOccupiedAt = event.block.timestamp;
  buyerAS.lastInteractedAt = event.block.timestamp;
  buyerAS.save();

  slot.occupant = event.params.buyer;
  slot.occupantAccount = buyerAccount.id;
  slot.isOccupied = true;
  slot.price = event.params.selfAssessedPrice;
  slot.deposit = event.params.deposit;

  // On an epoch slot the tenure began at the BOUNDARY, not at the transaction
  // that happened to materialise it — `_materialize` sets
  // `occupiedSince = p.effectiveAt`, and MinimumTenurePolicy measures from
  // exactly that. Using the block timestamp here would overstate protection by
  // however long the slot sat unpoked.
  if (slot.pendingEffectiveAt !== null) {
    slot.occupiedSince = slot.pendingEffectiveAt as BigInt;
  } else {
    slot.occupiedSince = event.block.timestamp;
  }

  // This event IS the materialisation, so the scheduled transfer is now spent.
  // Leaving it set would make clients keep resolving to a "pending" buyer who
  // has already become the occupant.
  slot.pendingBuyer = null;
  slot.pendingEffectiveAt = null;
  slot.pendingPrice = null;
  slot.pendingDeposit = null;

  slot.updatedAt = event.block.timestamp;
  slot.save();

  let ev = new BoughtEvent(evtId(event.transaction.hash, event.logIndex));
  ev.slot = slot.id;
  ev.currency = slot.currency;
  ev.buyer = event.params.buyer;
  ev.previousOccupant = event.params.previousOccupant;
  ev.price = event.params.price;
  ev.deposit = event.params.deposit;
  ev.selfAssessedPrice = event.params.selfAssessedPrice;
  ev.timestamp = event.block.timestamp;
  ev.blockNumber = event.block.number;
  ev.tx = event.transaction.hash;
  ev.save();
}

export function handleReleased(event: Released): void {
  let slot = getSlot(event.address);

  if (slot.occupant !== null) {
    let prevAddr = Address.fromBytes(slot.occupant as Bytes);
    let prevAccount = getOrCreateAccount(prevAddr);
    prevAccount.occupiedCount -= 1;

    let prevAS = getOrCreateAccountSlot(prevAddr, event.address, event.block.timestamp);
    if (prevAS.lastOccupiedAt !== null) {
      let held = event.block.timestamp.minus(prevAS.lastOccupiedAt as BigInt);
      prevAS.holdTime = prevAS.holdTime.plus(held);
      prevAccount.totalHoldTime = prevAccount.totalHoldTime.plus(held);
    }
    prevAS.lastOccupiedAt = null;
    prevAS.lastInteractedAt = event.block.timestamp;
    prevAS.save();
    prevAccount.save();
  }

  slot.occupant = null;
  slot.occupantAccount = null;
  slot.isOccupied = false;
  slot.price = BigInt.zero();
  slot.deposit = BigInt.zero();
  slot.collectedTax = BigInt.zero();
  slot.occupiedSince = BigInt.zero();
  // A scheduled transfer deliberately SURVIVES vacancy: release/liquidate
  // before the boundary leave the slot empty, and the transfer still lands at
  // its boundary (the buyer's purchase price is refunded then). Do not clear
  // pendingBuyer here.
  slot.updatedAt = event.block.timestamp;
  slot.save();

  let ev = new ReleasedEvent(evtId(event.transaction.hash, event.logIndex));
  ev.slot = slot.id;
  ev.currency = slot.currency;
  ev.occupant = event.params.occupant;
  ev.refund = event.params.refund;
  ev.timestamp = event.block.timestamp;
  ev.blockNumber = event.block.number;
  ev.tx = event.transaction.hash;
  ev.save();
}

export function handleLiquidated(event: Liquidated): void {
  let slot = getSlot(event.address);

  if (slot.occupant !== null) {
    let prevAddr = Address.fromBytes(slot.occupant as Bytes);
    let prevAccount = getOrCreateAccount(prevAddr);
    prevAccount.occupiedCount -= 1;

    let prevAS = getOrCreateAccountSlot(prevAddr, event.address, event.block.timestamp);
    if (prevAS.lastOccupiedAt !== null) {
      let held = event.block.timestamp.minus(prevAS.lastOccupiedAt as BigInt);
      prevAS.holdTime = prevAS.holdTime.plus(held);
      prevAccount.totalHoldTime = prevAccount.totalHoldTime.plus(held);
    }
    prevAS.lastOccupiedAt = null;
    prevAS.lastInteractedAt = event.block.timestamp;
    prevAS.save();
    prevAccount.save();
  }

  slot.occupant = null;
  slot.occupantAccount = null;
  slot.isOccupied = false;
  slot.price = BigInt.zero();
  slot.deposit = BigInt.zero();
  slot.collectedTax = BigInt.zero();
  slot.occupiedSince = BigInt.zero();
  // A scheduled transfer deliberately SURVIVES vacancy: release/liquidate
  // before the boundary leave the slot empty, and the transfer still lands at
  // its boundary (the buyer's purchase price is refunded then). Do not clear
  // pendingBuyer here.
  slot.updatedAt = event.block.timestamp;
  slot.save();

  let ev = new LiquidatedEvent(evtId(event.transaction.hash, event.logIndex));
  ev.slot = slot.id;
  ev.currency = slot.currency;
  ev.liquidator = event.params.liquidator;
  ev.occupant = event.params.occupant;
  ev.bounty = event.params.bounty;
  ev.timestamp = event.block.timestamp;
  ev.blockNumber = event.block.number;
  ev.tx = event.transaction.hash;
  ev.save();
}

export function handlePriceUpdated(event: PriceUpdated): void {
  let slot = getSlot(event.address);
  slot.price = event.params.newPrice;
  slot.updatedAt = event.block.timestamp;
  slot.save();

  let ev = new PriceUpdatedEvent(evtId(event.transaction.hash, event.logIndex));
  ev.slot = slot.id;
  ev.currency = slot.currency;
  ev.oldPrice = event.params.oldPrice;
  ev.newPrice = event.params.newPrice;
  ev.timestamp = event.block.timestamp;
  ev.blockNumber = event.block.number;
  ev.tx = event.transaction.hash;
  ev.save();
}

export function handleDeposited(event: Deposited): void {
  let slot = getSlot(event.address);
  slot.deposit = slot.deposit.plus(event.params.amount);
  slot.updatedAt = event.block.timestamp;
  slot.save();

  let ev = new DepositedEvent(evtId(event.transaction.hash, event.logIndex));
  ev.slot = slot.id;
  ev.currency = slot.currency;
  ev.depositor = event.params.depositor;
  ev.amount = event.params.amount;
  ev.timestamp = event.block.timestamp;
  ev.blockNumber = event.block.number;
  ev.tx = event.transaction.hash;
  ev.save();
}

export function handleWithdrawn(event: Withdrawn): void {
  let slot = getSlot(event.address);
  slot.deposit = slot.deposit.minus(event.params.amount);
  slot.updatedAt = event.block.timestamp;
  slot.save();

  let ev = new WithdrawnEvent(evtId(event.transaction.hash, event.logIndex));
  ev.slot = slot.id;
  ev.currency = slot.currency;
  ev.occupant = event.params.occupant;
  ev.amount = event.params.amount;
  ev.timestamp = event.block.timestamp;
  ev.blockNumber = event.block.number;
  ev.tx = event.transaction.hash;
  ev.save();
}

export function handleSettled(event: Settled): void {
  let slot = getSlot(event.address);
  slot.deposit = event.params.depositRemaining;
  slot.updatedAt = event.block.timestamp;
  slot.save();

  // Track tax paid on the current occupant (per-slot, since currency is immutable per slot)
  if (slot.occupant !== null) {
    let occAddr = Address.fromBytes(slot.occupant as Bytes);
    let occAS = getOrCreateAccountSlot(occAddr, event.address, event.block.timestamp);
    occAS.taxPaid = occAS.taxPaid.plus(event.params.taxPaid);
    occAS.lastInteractedAt = event.block.timestamp;
    occAS.save();
  }

  let ev = new SettledEvent(evtId(event.transaction.hash, event.logIndex));
  ev.slot = slot.id;
  ev.currency = slot.currency;
  ev.taxOwed = event.params.taxOwed;
  ev.taxPaid = event.params.taxPaid;
  ev.depositRemaining = event.params.depositRemaining;
  ev.timestamp = event.block.timestamp;
  ev.blockNumber = event.block.number;
  ev.tx = event.transaction.hash;
  ev.save();
}

export function handleTaxCollected(event: TaxCollected): void {
  let slot = getSlot(event.address);
  slot.collectedTax = BigInt.zero();
  slot.totalCollected = slot.totalCollected.plus(event.params.amount);
  slot.updatedAt = event.block.timestamp;
  slot.save();

  let ev = new TaxCollectedEvent(evtId(event.transaction.hash, event.logIndex));
  ev.slot = slot.id;
  ev.currency = slot.currency;
  ev.recipient = event.params.recipient;
  ev.amount = event.params.amount;
  ev.timestamp = event.block.timestamp;
  ev.blockNumber = event.block.number;
  ev.tx = event.transaction.hash;
  ev.save();
}

export function handleTaxUpdateProposed(event: TaxUpdateProposed): void {
  let ev = new TaxUpdateProposedEvent(evtId(event.transaction.hash, event.logIndex));
  ev.slot = event.address.toHexString();
  ev.newPercentage = event.params.newPercentage;
  ev.timestamp = event.block.timestamp;
  ev.blockNumber = event.block.number;
  ev.tx = event.transaction.hash;
  ev.save();
}

export function handleModuleUpdateProposed(event: ModuleUpdateProposed): void {
  let ev = new ModuleUpdateProposedEvent(evtId(event.transaction.hash, event.logIndex));
  ev.slot = event.address.toHexString();
  ev.newModule = event.params.newModule;
  ev.timestamp = event.block.timestamp;
  ev.blockNumber = event.block.number;
  ev.tx = event.transaction.hash;
  ev.save();
}

export function handlePendingUpdateCancelled(event: PendingUpdateCancelled): void {
  let ev = new PendingUpdateCancelledEvent(evtId(event.transaction.hash, event.logIndex));
  ev.slot = event.address.toHexString();
  ev.timestamp = event.block.timestamp;
  ev.blockNumber = event.block.number;
  ev.tx = event.transaction.hash;
  ev.save();
}

export function handlePendingUpdateApplied(event: PendingUpdateApplied): void {
  let slot = getSlot(event.address);
  slot.taxPercentage = event.params.newTaxPercentage;
  const moduleAddr = event.params.newModule;
  if (moduleAddr.equals(Address.zero())) {
    slot.module = null;
  } else {
    const factoryId = dataSource.context().getString("factory");
    const mod = getOrCreateModule(moduleAddr, factoryId);
    slot.module = mod.id;
  }
  slot.updatedAt = event.block.timestamp;
  slot.save();
}

export function handleLiquidationBountyUpdated(event: LiquidationBountyUpdated): void {
  let slot = getSlot(event.address);
  slot.liquidationBountyBps = event.params.newBps;
  slot.updatedAt = event.block.timestamp;
  slot.save();
}

export function handleModuleFeePaid(event: ModuleFeePaid): void {
  let slot = getSlot(event.address);
  let moduleId = event.params.module.toHexString();
  let mod = Module.load(moduleId);
  if (mod) {
    mod.totalFeesCollected = mod.totalFeesCollected.plus(event.params.amount);
    mod.save();
  }

  let ev = new ModuleFeePaidEvent(evtId(event.transaction.hash, event.logIndex));
  ev.slot = slot.id;
  ev.currency = slot.currency;
  ev.module = moduleId;
  ev.amount = event.params.amount;
  ev.feeBps = event.params.feeBps;
  ev.timestamp = event.block.timestamp;
  ev.blockNumber = event.block.number;
  ev.tx = event.transaction.hash;
  ev.save();
}

// ═══════════════════════════════════════════════════════════════════════════
// v3 OCCUPANCY LAYER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * A slot's epoch length and occupancy policy, emitted by initializeV3 and
 * migrateSlotsV3. This is the ONLY on-chain source for either field —
 * SlotDeployed predates both and carries neither — so without this handler the
 * subgraph can never tell an hourly slot from an instant-buy one.
 */
export function handleSlotConfiguredV3(event: SlotConfiguredV3): void {
  let slot = getSlot(event.address);
  slot.epochSeconds = event.params.epochSeconds;
  if (event.params.occupancyPolicy.equals(Address.zero())) {
    slot.occupancyPolicy = null;
  } else {
    slot.occupancyPolicy = event.params.occupancyPolicy;
  }
  slot.updatedAt = event.block.timestamp;
  slot.save();
}

/**
 * A committed-but-not-yet-effective transfer.
 *
 * The occupant does NOT change here — the outgoing occupant keeps occupying and
 * keeps paying tax until the boundary. The matching Bought fires later, in
 * whatever transaction happens to materialise the transfer.
 *
 * Between `effectiveAt` and that transaction, the chain already treats
 * `buyer` as the occupant while `slot.occupant` still names the old one. The
 * subgraph cannot close that gap on its own (no "now" at query time), which is
 * exactly why these fields are exposed for clients to resolve against.
 */
export function handleTransferScheduled(event: TransferScheduled): void {
  let slot = getSlot(event.address);
  slot.pendingBuyer = event.params.buyer;
  slot.pendingEffectiveAt = event.params.effectiveAt;
  slot.pendingPrice = event.params.price;
  slot.pendingDeposit = event.params.deposit;
  slot.updatedAt = event.block.timestamp;
  slot.save();

  let ev = new TransferScheduledEvent(
    evtId(event.transaction.hash, event.logIndex)
  );
  ev.slot = slot.id;
  ev.currency = slot.currency;
  ev.buyer = event.params.buyer;
  ev.effectiveAt = event.params.effectiveAt;
  ev.price = event.params.price;
  ev.deposit = event.params.deposit;
  ev.timestamp = event.block.timestamp;
  ev.blockNumber = event.block.number;
  ev.tx = event.transaction.hash;
  ev.save();
}

export function handleOperatorSet(event: OperatorSet): void {
  let slot = getSlot(event.address);

  let id =
    slot.id +
    "-" +
    event.params.occupant.toHexString() +
    "-" +
    event.params.operator.toHexString();

  let op = SlotOperator.load(id);
  if (op == null) {
    op = new SlotOperator(id);
    op.slot = slot.id;
    op.occupant = event.params.occupant;
    op.operator = event.params.operator;
  }
  op.approved = event.params.approved;
  op.updatedAt = event.block.timestamp;
  op.save();

  let ev = new OperatorSetEvent(evtId(event.transaction.hash, event.logIndex));
  ev.slot = slot.id;
  ev.occupant = event.params.occupant;
  ev.operator = event.params.operator;
  ev.approved = event.params.approved;
  ev.timestamp = event.block.timestamp;
  ev.blockNumber = event.block.number;
  ev.tx = event.transaction.hash;
  ev.save();
}

export function handlePolicyUpdateProposed(
  event: PolicyUpdateProposed
): void {
  let slot = getSlot(event.address);
  slot.pendingPolicy = event.params.newPolicy;
  slot.hasPendingPolicy = true;
  slot.updatedAt = event.block.timestamp;
  slot.save();

  let ev = new PolicyUpdateProposedEvent(
    evtId(event.transaction.hash, event.logIndex)
  );
  ev.slot = slot.id;
  ev.newPolicy = event.params.newPolicy;
  ev.timestamp = event.block.timestamp;
  ev.blockNumber = event.block.number;
  ev.tx = event.transaction.hash;
  ev.save();
}

export function handlePolicyUpdateApplied(event: PolicyUpdateApplied): void {
  let slot = getSlot(event.address);
  if (event.params.newPolicy.equals(Address.zero())) {
    slot.occupancyPolicy = null;
  } else {
    slot.occupancyPolicy = event.params.newPolicy;
  }
  slot.pendingPolicy = null;
  slot.hasPendingPolicy = false;
  slot.updatedAt = event.block.timestamp;
  slot.save();

  let ev = new PolicyUpdateAppliedEvent(
    evtId(event.transaction.hash, event.logIndex)
  );
  ev.slot = slot.id;
  ev.newPolicy = event.params.newPolicy;
  ev.timestamp = event.block.timestamp;
  ev.blockNumber = event.block.number;
  ev.tx = event.transaction.hash;
  ev.save();
}

function getSlotRefund(
  slotId: string,
  account: Bytes,
  timestamp: BigInt
): SlotRefund {
  let id = slotId + "-" + account.toHexString();
  let r = SlotRefund.load(id);
  if (r == null) {
    r = new SlotRefund(id);
    r.slot = slotId;
    r.account = account;
    r.credited = BigInt.zero();
    r.claimed = BigInt.zero();
    r.outstanding = BigInt.zero();
  }
  r.updatedAt = timestamp;
  return r as SlotRefund;
}

/**
 * A refund the slot could not push (blocklisting currency, reverting receiver)
 * and credited for later claim. A non-zero `outstanding` means the slot owes
 * this account money — worth surfacing in the UI, since nothing will move it
 * until they call `claim`.
 */
export function handleRefundCredited(event: RefundCredited): void {
  let slot = getSlot(event.address);
  let r = getSlotRefund(slot.id, event.params.account, event.block.timestamp);
  r.credited = r.credited.plus(event.params.amount);
  r.outstanding = r.outstanding.plus(event.params.amount);
  r.save();

  let ev = new RefundCreditedEvent(
    evtId(event.transaction.hash, event.logIndex)
  );
  ev.slot = slot.id;
  ev.currency = slot.currency;
  ev.account = event.params.account;
  ev.amount = event.params.amount;
  ev.timestamp = event.block.timestamp;
  ev.blockNumber = event.block.number;
  ev.tx = event.transaction.hash;
  ev.save();
}

export function handleRefundClaimed(event: RefundClaimed): void {
  let slot = getSlot(event.address);
  let r = getSlotRefund(slot.id, event.params.account, event.block.timestamp);
  r.claimed = r.claimed.plus(event.params.amount);
  r.outstanding = r.outstanding.minus(event.params.amount);
  r.save();

  let ev = new RefundClaimedEvent(
    evtId(event.transaction.hash, event.logIndex)
  );
  ev.slot = slot.id;
  ev.currency = slot.currency;
  ev.account = event.params.account;
  ev.amount = event.params.amount;
  ev.timestamp = event.block.timestamp;
  ev.blockNumber = event.block.number;
  ev.tx = event.transaction.hash;
  ev.save();
}
