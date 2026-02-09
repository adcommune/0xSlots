import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  SlotCreated,
  SlotPurchased,
  SlotReleased,
  PriceUpdated,
  TaxRateUpdateProposed,
  TaxRateUpdateConfirmed,
  TaxRateUpdateCancelled,
  SlotDeactivated,
  SlotActivated,
  FlowOperation,
} from "../generated/templates/Slots/Slots";
import {
  Slot,
  SlotPurchase,
  PriceUpdate,
  TaxRateChange,
  FlowChange,
} from "../generated/schema";

function slotEntityId(land: Bytes, slotId: BigInt): string {
  return land.toHexString() + "-" + slotId.toString();
}

function eventEntityId(txHash: Bytes, logIndex: BigInt): string {
  return txHash.toHexString() + "-" + logIndex.toString();
}

export function handleSlotCreated(event: SlotCreated): void {
  let id = slotEntityId(event.address, event.params.slotId);
  let slot = new Slot(id);
  let params = event.params.params;

  slot.land = event.address.toHexString();
  slot.slotId = event.params.slotId;
  slot.occupant = null;
  slot.currency = params.currency;
  slot.basePrice = params.basePrice;
  slot.price = params.price;
  slot.taxPercentage = params.taxPercentage;
  slot.maxTaxPercentage = params.maxTaxPercentage;
  slot.minTaxUpdatePeriod = params.minTaxUpdatePeriod;
  slot.module = params.module;
  slot.active = true;
  slot.createdAt = event.block.timestamp;
  slot.updatedAt = event.block.timestamp;

  slot.save();
}

export function handleSlotPurchased(event: SlotPurchased): void {
  let id = slotEntityId(event.address, event.params.slotId);
  let slot = Slot.load(id);
  if (!slot) return;

  slot.occupant = event.params.newOccupant;
  slot.updatedAt = event.block.timestamp;
  slot.save();

  let purchase = new SlotPurchase(
    eventEntityId(event.transaction.hash, event.logIndex)
  );
  purchase.slot = id;
  purchase.newOccupant = event.params.newOccupant;
  purchase.timestamp = event.block.timestamp;
  purchase.tx = event.transaction.hash;
  purchase.save();
}

export function handleSlotReleased(event: SlotReleased): void {
  let id = slotEntityId(event.address, event.params.slotId);
  let slot = Slot.load(id);
  if (!slot) return;

  slot.occupant = null;
  slot.updatedAt = event.block.timestamp;
  slot.save();
}

export function handlePriceUpdated(event: PriceUpdated): void {
  let id = slotEntityId(event.address, event.params.slotId);
  let slot = Slot.load(id);
  if (!slot) return;

  slot.price = event.params.newPrice;
  slot.updatedAt = event.block.timestamp;
  slot.save();

  let priceUpdate = new PriceUpdate(
    eventEntityId(event.transaction.hash, event.logIndex)
  );
  priceUpdate.slot = id;
  priceUpdate.oldPrice = event.params.oldPrice;
  priceUpdate.newPrice = event.params.newPrice;
  priceUpdate.timestamp = event.block.timestamp;
  priceUpdate.tx = event.transaction.hash;
  priceUpdate.save();
}

export function handleTaxRateUpdateProposed(
  event: TaxRateUpdateProposed
): void {
  let id = slotEntityId(event.address, event.params.slotId);
  let slot = Slot.load(id);
  if (!slot) return;

  slot.updatedAt = event.block.timestamp;
  slot.save();

  let change = new TaxRateChange(
    eventEntityId(event.transaction.hash, event.logIndex)
  );
  change.slot = id;
  change.kind = "proposed";
  change.newPercentage = event.params.newPercentage;
  change.confirmableAt = event.params.confirmableAt;
  change.timestamp = event.block.timestamp;
  change.tx = event.transaction.hash;
  change.save();
}

export function handleTaxRateUpdateConfirmed(
  event: TaxRateUpdateConfirmed
): void {
  let id = slotEntityId(event.address, event.params.slotId);
  let slot = Slot.load(id);
  if (!slot) return;

  slot.taxPercentage = event.params.newPercentage;
  slot.updatedAt = event.block.timestamp;
  slot.save();

  let change = new TaxRateChange(
    eventEntityId(event.transaction.hash, event.logIndex)
  );
  change.slot = id;
  change.kind = "confirmed";
  change.oldPercentage = event.params.oldPercentage;
  change.newPercentage = event.params.newPercentage;
  change.timestamp = event.block.timestamp;
  change.tx = event.transaction.hash;
  change.save();
}

export function handleTaxRateUpdateCancelled(
  event: TaxRateUpdateCancelled
): void {
  let id = slotEntityId(event.address, event.params.slotId);

  let change = new TaxRateChange(
    eventEntityId(event.transaction.hash, event.logIndex)
  );
  change.slot = id;
  change.kind = "cancelled";
  change.timestamp = event.block.timestamp;
  change.tx = event.transaction.hash;
  change.save();
}

export function handleSlotDeactivated(event: SlotDeactivated): void {
  let id = slotEntityId(event.address, event.params.slotId);
  let slot = Slot.load(id);
  if (!slot) return;

  slot.active = false;
  slot.updatedAt = event.block.timestamp;
  slot.save();
}

export function handleSlotActivated(event: SlotActivated): void {
  let id = slotEntityId(event.address, event.params.slotId);
  let slot = Slot.load(id);
  if (!slot) return;

  slot.active = true;
  slot.updatedAt = event.block.timestamp;
  slot.save();
}

export function handleFlowOperation(event: FlowOperation): void {
  let flow = new FlowChange(
    eventEntityId(event.transaction.hash, event.logIndex)
  );
  flow.from = event.params.from;
  flow.to = event.params.to;
  flow.oldRate = event.params.oldRate;
  flow.newRate = event.params.newRate;
  flow.operation = event.params.operation;
  flow.timestamp = event.block.timestamp;
  flow.tx = event.transaction.hash;
  flow.save();
}
