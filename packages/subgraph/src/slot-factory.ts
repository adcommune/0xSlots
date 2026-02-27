import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import { SlotDeployed } from "../generated/SlotFactory/SlotFactory";
import { Slot as SlotTemplate } from "../generated/templates";
import { Factory, Slot } from "../generated/schema";

const FACTORY_ID = "0xe8fd4df6f1d1914062a2a55ad6dee2a506bbbaa0";
const ZERO_ADDRESS = Bytes.fromHexString("0x0000000000000000000000000000000000000000");

function getOrCreateFactory(): Factory {
  let factory = Factory.load(FACTORY_ID);
  if (!factory) {
    factory = new Factory(FACTORY_ID);
    factory.address = Bytes.fromHexString(FACTORY_ID);
    factory.slotCount = 0;
    factory.admin = ZERO_ADDRESS;
  }
  return factory;
}

export function handleSlotDeployed(event: SlotDeployed): void {
  let factory = getOrCreateFactory();
  factory.slotCount += 1;
  factory.save();

  let slotAddr = event.params.slot.toHexString();
  let slot = new Slot(slotAddr);
  slot.factory = FACTORY_ID;
  slot.recipient = event.params.recipient;
  slot.currency = event.params.currency;
  slot.manager = event.params.config.manager;
  slot.mutableTax = event.params.config.mutableTax;
  slot.mutableModule = event.params.config.mutableModule;
  slot.taxPercentage = event.params.initParams.taxPercentage;
  slot.module = event.params.initParams.module;
  slot.occupant = null;
  slot.price = BigInt.zero();
  slot.deposit = BigInt.zero();
  slot.collectedTax = BigInt.zero();
  slot.liquidationBountyBps = event.params.initParams.liquidationBountyBps;
  slot.isVacant = true;
  slot.hasPendingTaxUpdate = false;
  slot.hasPendingModuleUpdate = false;
  slot.pendingTaxPercentage = null;
  slot.pendingModule = null;
  slot.createdAt = event.block.timestamp;
  slot.createdTx = event.transaction.hash;
  slot.save();

  SlotTemplate.create(event.params.slot);
}
