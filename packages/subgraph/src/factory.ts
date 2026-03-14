import { BigInt, Address, DataSourceContext } from "@graphprotocol/graph-ts";
import {
  SlotDeployed,
  ModuleVerified,
  AdminTransferred,
} from "../generated/SlotFactory/SlotFactory";
import { Slot as SlotTemplate } from "../generated/templates";
import { Factory, Slot, Module } from "../generated/schema";
import { getOrCreateAccount, getOrCreateCurrency, getOrCreateModule, markAccountAsContract } from "./helpers";

function getOrCreateFactory(address: string): Factory {
  let factory = Factory.load(address);
  if (!factory) {
    factory = new Factory(address);
    factory.slotCount = BigInt.zero();
    factory.save();
  }
  return factory;
}

export function handleSlotDeployed(event: SlotDeployed): void {
  let factory = getOrCreateFactory(event.address.toHexString());
  factory.slotCount = factory.slotCount.plus(BigInt.fromI32(1));
  factory.save();

  let slotAddress = event.params.slot.toHexString();
  let slot = new Slot(slotAddress);

  let recipientAccount = getOrCreateAccount(event.params.recipient);
  recipientAccount.slotCount += 1;
  recipientAccount.save();

  slot.recipient = event.params.recipient;
  slot.recipientAccount = recipientAccount.id;
  slot.occupantAccount = null;
  let currency = getOrCreateCurrency(event.params.currency);
  slot.currency = currency.id;

  // Config
  slot.mutableTax = event.params.config.mutableTax;
  slot.mutableModule = event.params.config.mutableModule;
  slot.manager = event.params.config.manager;

  // Init params
  slot.taxPercentage = event.params.initParams.taxPercentage;
  const moduleAddr = event.params.initParams.module;
  if (!moduleAddr.equals(Address.zero())) {
    const mod = getOrCreateModule(moduleAddr, event.address.toHexString());
    slot.module = mod.id;
  }
  slot.liquidationBountyBps = event.params.initParams.liquidationBountyBps;
  slot.minDepositSeconds = event.params.initParams.minDepositSeconds;

  // State defaults
  slot.occupant = null;
  slot.price = BigInt.zero();
  slot.deposit = BigInt.zero();
  slot.collectedTax = BigInt.zero();
  slot.totalCollected = BigInt.zero();

  slot.createdAt = event.block.timestamp;
  slot.createdTx = event.transaction.hash;
  slot.updatedAt = event.block.timestamp;

  slot.save();

  // Mark the slot address as a contract account
  markAccountAsContract(event.params.slot);

  // Start indexing events on this slot contract
  let context = new DataSourceContext();
  context.setString("factory", event.address.toHexString());
  SlotTemplate.createWithContext(event.params.slot, context);
}

export function handleModuleVerified(event: ModuleVerified): void {
  let id = event.params.module.toHexString();
  let module = Module.load(id);
  if (!module) {
    module = new Module(id);
    module.factory = event.address.toHexString();
  }
  module.verified = event.params.verified;
  module.name = event.params.name;
  module.version = event.params.version;
  module.save();
}

export function handleAdminTransferred(event: AdminTransferred): void {
  // No-op — admin not stored in schema
}
