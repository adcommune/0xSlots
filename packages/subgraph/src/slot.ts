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
  LiquidationBountyUpdated,
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
} from "../generated/schema";
import { getOrCreateAccount, getOrCreateModule } from "./helpers";

function evtId(txHash: Bytes, logIndex: BigInt): string {
  return txHash.toHexString() + "-" + logIndex.toString();
}

function getSlot(address: Address): Slot {
  return Slot.load(address.toHexString()) as Slot;
}

export function handleBought(event: Bought): void {
  let slot = getSlot(event.address);

  // Decrement previous occupant count
  let zeroAddr = Address.zero();
  if (slot.occupant !== null && Address.fromBytes(slot.occupant as Bytes) != zeroAddr) {
    let prevAccount = getOrCreateAccount(Address.fromBytes(slot.occupant as Bytes));
    prevAccount.occupiedCount -= 1;
    prevAccount.save();
  }

  // Set new occupant
  let buyerAccount = getOrCreateAccount(event.params.buyer);
  buyerAccount.occupiedCount += 1;
  buyerAccount.save();

  slot.occupant = event.params.buyer;
  slot.occupantAccount = buyerAccount.id;
  slot.price = event.params.selfAssessedPrice;
  slot.deposit = event.params.deposit;
  slot.updatedAt = event.block.timestamp;
  slot.save();

  let ev = new BoughtEvent(evtId(event.transaction.hash, event.logIndex));
  ev.slot = slot.id;
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
    let prevAccount = getOrCreateAccount(Address.fromBytes(slot.occupant as Bytes));
    prevAccount.occupiedCount -= 1;
    prevAccount.save();
  }

  slot.occupant = null;
  slot.occupantAccount = null;
  slot.price = BigInt.zero();
  slot.deposit = BigInt.zero();
  slot.collectedTax = BigInt.zero();
  slot.updatedAt = event.block.timestamp;
  slot.save();

  let ev = new ReleasedEvent(evtId(event.transaction.hash, event.logIndex));
  ev.slot = slot.id;
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
    let prevAccount = getOrCreateAccount(Address.fromBytes(slot.occupant as Bytes));
    prevAccount.occupiedCount -= 1;
    prevAccount.save();
  }

  slot.occupant = null;
  slot.occupantAccount = null;
  slot.price = BigInt.zero();
  slot.deposit = BigInt.zero();
  slot.collectedTax = BigInt.zero();
  slot.updatedAt = event.block.timestamp;
  slot.save();

  let ev = new LiquidatedEvent(evtId(event.transaction.hash, event.logIndex));
  ev.slot = slot.id;
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

  let ev = new SettledEvent(evtId(event.transaction.hash, event.logIndex));
  ev.slot = slot.id;
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
  ev.recipient = event.params.recipient;
  ev.amount = event.params.amount;
  ev.timestamp = event.block.timestamp;
  ev.blockNumber = event.block.number;
  ev.tx = event.transaction.hash;
  ev.save();
}

export function handleTaxUpdateProposed(event: TaxUpdateProposed): void {}

export function handleModuleUpdateProposed(event: ModuleUpdateProposed): void {}

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
