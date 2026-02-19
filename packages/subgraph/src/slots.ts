import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import { ERC20 } from "../generated/SlotsHub/ERC20";
import {
  SlotCreated,
  SlotPurchased,
  SlotReleased,
  SlotLiquidated,
  PriceUpdated,
  TaxRateUpdateProposed,
  TaxRateUpdateConfirmed,
  TaxRateUpdateCancelled,
  SlotDeactivated,
  SlotActivated,
  SlotSettingsUpdated,
  Deposited,
  Withdrawn,
  Settled,
  TaxCollected,
} from "../generated/templates/Slots/Slots";
import {
  Slot,
  SlotCreatedEvent,
  SlotPurchase,
  SlotReleasedEvent,
  SlotLiquidatedEvent,
  PriceUpdate,
  TaxRateChange,
  DepositEvent,
  WithdrawalEvent,
  SettlementEvent,
  TaxCollectedEvent,
  Currency,
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

  let currencyAddr = params.currency;
  let currencyId = currencyAddr.toHexString();
  let currency = Currency.load(currencyId);
  if (!currency) {
    currency = new Currency(currencyId);
    currency.hub = event.address.toHexString(); // will be linked properly via land→hub
    currency.allowed = false;
    let token = ERC20.bind(currencyAddr);
    let nameResult = token.try_name();
    if (!nameResult.reverted) currency.name = nameResult.value;
    let symbolResult = token.try_symbol();
    if (!symbolResult.reverted) currency.symbol = symbolResult.value;
    let decimalsResult = token.try_decimals();
    if (!decimalsResult.reverted) currency.decimals = decimalsResult.value;
    currency.save();
  }

  slot.land = event.address.toHexString();
  slot.slotId = event.params.slotId;
  slot.occupant = null;
  slot.currency = currencyId;
  slot.basePrice = params.basePrice;
  slot.price = params.basePrice; // v2: price starts at basePrice
  slot.taxPercentage = params.taxPercentage;
  slot.maxTaxPercentage = params.maxTaxPercentage;
  slot.minTaxUpdatePeriod = params.minTaxUpdatePeriod;
  slot.module = params.module;
  slot.active = true;
  slot.createdAt = event.block.timestamp;
  slot.updatedAt = event.block.timestamp;

  slot.save();

  let slotEvent = new SlotCreatedEvent(
    eventEntityId(event.transaction.hash, event.logIndex),
  );
  slotEvent.slot = id;
  slotEvent.land = event.address;
  slotEvent.slotId = event.params.slotId;
  slotEvent.currency = params.currency;
  slotEvent.basePrice = params.basePrice;
  slotEvent.taxPercentage = params.taxPercentage;
  slotEvent.timestamp = event.block.timestamp;
  slotEvent.blockNumber = event.block.number;
  slotEvent.tx = event.transaction.hash;
  slotEvent.save();
}

export function handleSlotPurchased(event: SlotPurchased): void {
  let id = slotEntityId(event.address, event.params.slotId);
  let slot = Slot.load(id);
  if (!slot) return;

  let previousOccupant = slot.occupant;
  slot.occupant = event.params.newOccupant;
  slot.updatedAt = event.block.timestamp;
  slot.save();

  let purchase = new SlotPurchase(
    eventEntityId(event.transaction.hash, event.logIndex),
  );
  purchase.slot = id;
  purchase.newOccupant = event.params.newOccupant;
  purchase.price = event.params.price;
  purchase.previousOccupant = previousOccupant;
  purchase.timestamp = event.block.timestamp;
  purchase.blockNumber = event.block.number;
  purchase.tx = event.transaction.hash;
  purchase.save();
}

export function handleSlotReleased(event: SlotReleased): void {
  let id = slotEntityId(event.address, event.params.slotId);
  let slot = Slot.load(id);
  if (!slot) return;

  let previousOccupant = slot.occupant;
  slot.occupant = null;
  slot.updatedAt = event.block.timestamp;
  slot.save();

  let releaseEvent = new SlotReleasedEvent(
    eventEntityId(event.transaction.hash, event.logIndex),
  );
  releaseEvent.slot = id;
  releaseEvent.land = event.address;
  releaseEvent.slotId = event.params.slotId;
  releaseEvent.previousOccupant = previousOccupant;
  releaseEvent.timestamp = event.block.timestamp;
  releaseEvent.blockNumber = event.block.number;
  releaseEvent.tx = event.transaction.hash;
  releaseEvent.save();
}

export function handleSlotLiquidated(event: SlotLiquidated): void {
  let id = slotEntityId(event.address, event.params.slotId);
  let slot = Slot.load(id);
  if (!slot) return;

  slot.occupant = null;
  slot.updatedAt = event.block.timestamp;
  slot.save();

  let liqEvent = new SlotLiquidatedEvent(
    eventEntityId(event.transaction.hash, event.logIndex),
  );
  liqEvent.slot = id;
  liqEvent.land = event.address;
  liqEvent.slotId = event.params.slotId;
  liqEvent.liquidator = event.params.liquidator;
  liqEvent.occupant = event.params.occupant;
  liqEvent.bounty = event.params.bounty;
  liqEvent.timestamp = event.block.timestamp;
  liqEvent.blockNumber = event.block.number;
  liqEvent.tx = event.transaction.hash;
  liqEvent.save();
}

export function handlePriceUpdated(event: PriceUpdated): void {
  let id = slotEntityId(event.address, event.params.slotId);
  let slot = Slot.load(id);
  if (!slot) return;

  slot.price = event.params.newPrice;
  slot.updatedAt = event.block.timestamp;
  slot.save();

  let priceUpdate = new PriceUpdate(
    eventEntityId(event.transaction.hash, event.logIndex),
  );
  priceUpdate.slot = id;
  priceUpdate.oldPrice = event.params.oldPrice;
  priceUpdate.newPrice = event.params.newPrice;
  priceUpdate.timestamp = event.block.timestamp;
  priceUpdate.blockNumber = event.block.number;
  priceUpdate.tx = event.transaction.hash;
  priceUpdate.save();
}

export function handleTaxRateUpdateProposed(
  event: TaxRateUpdateProposed,
): void {
  let id = slotEntityId(event.address, event.params.slotId);
  let slot = Slot.load(id);
  if (!slot) return;

  slot.updatedAt = event.block.timestamp;
  slot.save();

  let change = new TaxRateChange(
    eventEntityId(event.transaction.hash, event.logIndex),
  );
  change.slot = id;
  change.kind = "proposed";
  change.newPercentage = event.params.newPercentage;
  change.confirmableAt = event.params.confirmableAt;
  change.timestamp = event.block.timestamp;
  change.blockNumber = event.block.number;
  change.tx = event.transaction.hash;
  change.save();
}

export function handleTaxRateUpdateConfirmed(
  event: TaxRateUpdateConfirmed,
): void {
  let id = slotEntityId(event.address, event.params.slotId);
  let slot = Slot.load(id);
  if (!slot) return;

  slot.taxPercentage = event.params.newPercentage;
  slot.updatedAt = event.block.timestamp;
  slot.save();

  let change = new TaxRateChange(
    eventEntityId(event.transaction.hash, event.logIndex),
  );
  change.slot = id;
  change.kind = "confirmed";
  change.oldPercentage = event.params.oldPercentage;
  change.newPercentage = event.params.newPercentage;
  change.timestamp = event.block.timestamp;
  change.blockNumber = event.block.number;
  change.tx = event.transaction.hash;
  change.save();
}

export function handleTaxRateUpdateCancelled(
  event: TaxRateUpdateCancelled,
): void {
  let id = slotEntityId(event.address, event.params.slotId);

  let change = new TaxRateChange(
    eventEntityId(event.transaction.hash, event.logIndex),
  );
  change.slot = id;
  change.kind = "cancelled";
  change.timestamp = event.block.timestamp;
  change.blockNumber = event.block.number;
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

export function handleDeposited(event: Deposited): void {
  let id = slotEntityId(event.address, event.params.slotId);

  let dep = new DepositEvent(
    eventEntityId(event.transaction.hash, event.logIndex),
  );
  dep.slot = id;
  dep.depositor = event.params.depositor;
  dep.amount = event.params.amount;
  dep.timestamp = event.block.timestamp;
  dep.blockNumber = event.block.number;
  dep.tx = event.transaction.hash;
  dep.save();
}

export function handleWithdrawn(event: Withdrawn): void {
  let id = slotEntityId(event.address, event.params.slotId);

  let wd = new WithdrawalEvent(
    eventEntityId(event.transaction.hash, event.logIndex),
  );
  wd.slot = id;
  wd.occupant = event.params.occupant;
  wd.amount = event.params.amount;
  wd.timestamp = event.block.timestamp;
  wd.blockNumber = event.block.number;
  wd.tx = event.transaction.hash;
  wd.save();
}

export function handleSettled(event: Settled): void {
  let id = slotEntityId(event.address, event.params.slotId);

  let settle = new SettlementEvent(
    eventEntityId(event.transaction.hash, event.logIndex),
  );
  settle.slot = id;
  settle.taxOwed = event.params.taxOwed;
  settle.depositRemaining = event.params.depositRemaining;
  settle.timestamp = event.block.timestamp;
  settle.blockNumber = event.block.number;
  settle.tx = event.transaction.hash;
  settle.save();
}

export function handleTaxCollected(event: TaxCollected): void {
  let id = slotEntityId(event.address, event.params.slotId);

  let tc = new TaxCollectedEvent(
    eventEntityId(event.transaction.hash, event.logIndex),
  );
  tc.slot = id;
  tc.owner = event.params.owner;
  tc.amount = event.params.amount;
  tc.timestamp = event.block.timestamp;
  tc.blockNumber = event.block.number;
  tc.tx = event.transaction.hash;
  tc.save();
}

export function handleSlotSettingsUpdated(event: SlotSettingsUpdated): void {
  let id = slotEntityId(event.address, event.params.slotId);
  let slot = Slot.load(id);
  if (!slot) return;

  slot.basePrice = event.params.basePrice;
  slot.maxTaxPercentage = event.params.maxTaxPercentage;
  slot.module = event.params.module;

  // Update currency
  let currencyAddr = event.params.currency;
  slot.currency = currencyAddr.toHexString();

  // Update price to basePrice if vacant (occupant == land owner)
  if (slot.occupant === null) {
    slot.price = event.params.basePrice;
  }

  slot.updatedAt = event.block.timestamp;
  slot.save();
}
