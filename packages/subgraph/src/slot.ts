import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  Bought,
  Released,
  Liquidated,
  PriceUpdated,
  Deposited,
  Withdrawn,
  TaxCollected,
  Settled,
  TaxUpdateProposed,
  ModuleUpdateProposed,
  PendingUpdateCancelled,
  PendingUpdateApplied,
  LiquidationBountyUpdated,
} from "../generated/templates/Slot/Slot";
import { Slot, SlotEvent } from "../generated/schema";

function eid(txHash: Bytes, logIndex: BigInt): string {
  return txHash.toHexString() + "-" + logIndex.toString();
}

export function handleBought(event: Bought): void {
  let id = event.address.toHexString();
  let slot = Slot.load(id);
  if (!slot) return;

  slot.occupant = event.params.buyer;
  slot.price = event.params.selfAssessedPrice;
  slot.deposit = event.params.deposit;
  slot.isVacant = false;
  slot.save();

  let ev = new SlotEvent(eid(event.transaction.hash, event.logIndex));
  ev.slot = id;
  ev.type = "Buy";
  ev.actor = event.params.buyer;
  ev.timestamp = event.block.timestamp;
  ev.txHash = event.transaction.hash;
  ev.amount = event.params.deposit;
  ev.newPrice = event.params.selfAssessedPrice;
  ev.save();
}

export function handleReleased(event: Released): void {
  let id = event.address.toHexString();
  let slot = Slot.load(id);
  if (!slot) return;

  slot.occupant = null;
  slot.price = BigInt.zero();
  slot.deposit = BigInt.zero();
  slot.isVacant = true;
  // Clear pending updates on release
  slot.hasPendingTaxUpdate = false;
  slot.hasPendingModuleUpdate = false;
  slot.pendingTaxPercentage = null;
  slot.pendingModule = null;
  slot.save();

  let ev = new SlotEvent(eid(event.transaction.hash, event.logIndex));
  ev.slot = id;
  ev.type = "Release";
  ev.actor = event.params.occupant;
  ev.timestamp = event.block.timestamp;
  ev.txHash = event.transaction.hash;
  ev.amount = event.params.refund;
  ev.save();
}

export function handleLiquidated(event: Liquidated): void {
  let id = event.address.toHexString();
  let slot = Slot.load(id);
  if (!slot) return;

  slot.occupant = null;
  slot.price = BigInt.zero();
  slot.deposit = BigInt.zero();
  slot.isVacant = true;
  slot.hasPendingTaxUpdate = false;
  slot.hasPendingModuleUpdate = false;
  slot.pendingTaxPercentage = null;
  slot.pendingModule = null;
  slot.save();

  let ev = new SlotEvent(eid(event.transaction.hash, event.logIndex));
  ev.slot = id;
  ev.type = "Liquidate";
  ev.actor = event.params.liquidator;
  ev.timestamp = event.block.timestamp;
  ev.txHash = event.transaction.hash;
  ev.amount = event.params.bounty;
  ev.save();
}

export function handlePriceUpdated(event: PriceUpdated): void {
  let id = event.address.toHexString();
  let slot = Slot.load(id);
  if (!slot) return;

  slot.price = event.params.newPrice;
  slot.save();

  let ev = new SlotEvent(eid(event.transaction.hash, event.logIndex));
  ev.slot = id;
  ev.type = "PriceUpdate";
  ev.actor = slot.occupant ? slot.occupant! : Bytes.fromHexString("0x0000000000000000000000000000000000000000");
  ev.timestamp = event.block.timestamp;
  ev.txHash = event.transaction.hash;
  ev.newPrice = event.params.newPrice;
  ev.save();
}

export function handleDeposited(event: Deposited): void {
  let id = event.address.toHexString();
  let slot = Slot.load(id);
  if (!slot) return;

  slot.deposit = slot.deposit.plus(event.params.amount);
  slot.save();

  let ev = new SlotEvent(eid(event.transaction.hash, event.logIndex));
  ev.slot = id;
  ev.type = "Deposit";
  ev.actor = event.params.depositor;
  ev.timestamp = event.block.timestamp;
  ev.txHash = event.transaction.hash;
  ev.amount = event.params.amount;
  ev.save();
}

export function handleWithdrawn(event: Withdrawn): void {
  let id = event.address.toHexString();
  let slot = Slot.load(id);
  if (!slot) return;

  slot.deposit = slot.deposit.gt(event.params.amount) ? slot.deposit.minus(event.params.amount) : BigInt.zero();
  slot.save();

  let ev = new SlotEvent(eid(event.transaction.hash, event.logIndex));
  ev.slot = id;
  ev.type = "Withdraw";
  ev.actor = event.params.occupant;
  ev.timestamp = event.block.timestamp;
  ev.txHash = event.transaction.hash;
  ev.amount = event.params.amount;
  ev.save();
}

export function handleTaxCollected(event: TaxCollected): void {
  let id = event.address.toHexString();
  let slot = Slot.load(id);
  if (!slot) return;

  slot.collectedTax = slot.collectedTax.plus(event.params.amount);
  slot.save();

  let ev = new SlotEvent(eid(event.transaction.hash, event.logIndex));
  ev.slot = id;
  ev.type = "TaxCollect";
  ev.actor = event.params.recipient;
  ev.timestamp = event.block.timestamp;
  ev.txHash = event.transaction.hash;
  ev.amount = event.params.amount;
  ev.save();
}

export function handleSettled(event: Settled): void {
  let id = event.address.toHexString();
  let slot = Slot.load(id);
  if (!slot) return;

  slot.deposit = event.params.depositRemaining;
  slot.save();

  let ev = new SlotEvent(eid(event.transaction.hash, event.logIndex));
  ev.slot = id;
  ev.type = "Settle";
  ev.actor = slot.occupant ? slot.occupant! : Bytes.fromHexString("0x0000000000000000000000000000000000000000");
  ev.timestamp = event.block.timestamp;
  ev.txHash = event.transaction.hash;
  ev.amount = event.params.taxOwed;
  ev.save();
}

export function handleTaxUpdateProposed(event: TaxUpdateProposed): void {
  let id = event.address.toHexString();
  let slot = Slot.load(id);
  if (!slot) return;

  slot.hasPendingTaxUpdate = true;
  slot.pendingTaxPercentage = event.params.newPercentage;
  slot.save();

  let ev = new SlotEvent(eid(event.transaction.hash, event.logIndex));
  ev.slot = id;
  ev.type = "TaxProposed";
  ev.actor = slot.manager;
  ev.timestamp = event.block.timestamp;
  ev.txHash = event.transaction.hash;
  ev.newTax = event.params.newPercentage;
  ev.save();
}

export function handleModuleUpdateProposed(event: ModuleUpdateProposed): void {
  let id = event.address.toHexString();
  let slot = Slot.load(id);
  if (!slot) return;

  slot.hasPendingModuleUpdate = true;
  slot.pendingModule = event.params.newModule;
  slot.save();

  let ev = new SlotEvent(eid(event.transaction.hash, event.logIndex));
  ev.slot = id;
  ev.type = "ModuleProposed";
  ev.actor = slot.manager;
  ev.timestamp = event.block.timestamp;
  ev.txHash = event.transaction.hash;
  ev.save();
}

export function handlePendingUpdateCancelled(event: PendingUpdateCancelled): void {
  let id = event.address.toHexString();
  let slot = Slot.load(id);
  if (!slot) return;

  slot.hasPendingTaxUpdate = false;
  slot.hasPendingModuleUpdate = false;
  slot.pendingTaxPercentage = null;
  slot.pendingModule = null;
  slot.save();

  let ev = new SlotEvent(eid(event.transaction.hash, event.logIndex));
  ev.slot = id;
  ev.type = "UpdateCancelled";
  ev.actor = slot.manager;
  ev.timestamp = event.block.timestamp;
  ev.txHash = event.transaction.hash;
  ev.save();
}

export function handlePendingUpdateApplied(event: PendingUpdateApplied): void {
  let id = event.address.toHexString();
  let slot = Slot.load(id);
  if (!slot) return;

  if (slot.hasPendingTaxUpdate) {
    slot.taxPercentage = event.params.newTaxPercentage;
  }
  if (slot.hasPendingModuleUpdate) {
    slot.module = event.params.newModule;
  }
  slot.hasPendingTaxUpdate = false;
  slot.hasPendingModuleUpdate = false;
  slot.pendingTaxPercentage = null;
  slot.pendingModule = null;
  slot.save();

  let ev = new SlotEvent(eid(event.transaction.hash, event.logIndex));
  ev.slot = id;
  ev.type = "UpdateApplied";
  ev.actor = slot.occupant ? slot.occupant! : Bytes.fromHexString("0x0000000000000000000000000000000000000000");
  ev.timestamp = event.block.timestamp;
  ev.txHash = event.transaction.hash;
  ev.newTax = event.params.newTaxPercentage;
  ev.save();
}

export function handleLiquidationBountyUpdated(event: LiquidationBountyUpdated): void {
  let id = event.address.toHexString();
  let slot = Slot.load(id);
  if (!slot) return;

  slot.liquidationBountyBps = event.params.newBps;
  slot.save();

  let ev = new SlotEvent(eid(event.transaction.hash, event.logIndex));
  ev.slot = id;
  ev.type = "LiquidationBountyUpdated";
  ev.actor = slot.recipient;
  ev.timestamp = event.block.timestamp;
  ev.txHash = event.transaction.hash;
  ev.amount = event.params.newBps;
  ev.save();
}
