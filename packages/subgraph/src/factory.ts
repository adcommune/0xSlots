import {
  Address,
  BigInt,
  DataSourceContext,
  ipfs,
  json,
  log,
} from "@graphprotocol/graph-ts";
import type {
  AdminTransferred,
  ModuleVerified,
  SlotDeployed,
} from "../generated/SlotFactory/SlotFactory";
import { Factory, Module, Slot, SlotDeployedEvent } from "../generated/schema";
import {
  FeedPostModule as FeedPostModuleTemplate,
  MetadataModule as MetadataModuleTemplate,
  Slot as SlotTemplate,
} from "../generated/templates";
import {
  getOrCreateAccount,
  getOrCreateCurrency,
  getOrCreateModule,
} from "./helpers";

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
  const factory = getOrCreateFactory(event.address.toHexString());
  factory.slotCount = factory.slotCount.plus(BigInt.fromI32(1));
  factory.save();

  const slotAddress = event.params.slot.toHexString();
  const slot = new Slot(slotAddress);

  const recipientAccount = getOrCreateAccount(event.params.recipient);
  recipientAccount.slotCount += 1;
  recipientAccount.save();

  slot.recipient = event.params.recipient;
  slot.recipientAccount = recipientAccount.id;
  slot.occupantAccount = null;
  const currency = getOrCreateCurrency(event.params.currency);
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
  slot.isOccupied = false;
  slot.price = BigInt.zero();
  slot.deposit = BigInt.zero();
  slot.collectedTax = BigInt.zero();
  slot.totalCollected = BigInt.zero();

  // v3 occupancy defaults. SlotDeployed carries neither epochSeconds nor
  // occupancyPolicy — SlotInitParams was deliberately not extended, to keep the
  // factory's ABI and selector stable. A slot created via createSlotV3 emits
  // SlotConfiguredV3 immediately after this, which overwrites these; one
  // created via the legacy createSlot keeps them, and they are the correct
  // values for it (instant buy, no policy).
  slot.epochSeconds = BigInt.zero();
  slot.occupancyPolicy = null;
  slot.occupiedSince = BigInt.zero();
  slot.pendingBuyer = null;
  slot.pendingEffectiveAt = null;
  slot.pendingPrice = null;
  slot.pendingDeposit = null;
  slot.pendingPolicy = null;
  slot.hasPendingPolicy = false;

  slot.createdAt = event.block.timestamp;
  slot.createdTx = event.transaction.hash;
  slot.updatedAt = event.block.timestamp;

  slot.save();

  // Record deploy event
  const evId =
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  const ev = new SlotDeployedEvent(evId);
  ev.slot = slot.id;
  ev.recipient = event.params.recipient;
  ev.currency = currency.id;
  ev.manager = event.params.config.manager;
  ev.mutableTax = event.params.config.mutableTax;
  ev.mutableModule = event.params.config.mutableModule;
  ev.taxPercentage = event.params.initParams.taxPercentage;
  ev.module = event.params.initParams.module;
  ev.liquidationBountyBps = event.params.initParams.liquidationBountyBps;
  ev.minDepositSeconds = event.params.initParams.minDepositSeconds;
  ev.deployer = event.transaction.from;
  ev.timestamp = event.block.timestamp;
  ev.blockNumber = event.block.number;
  ev.tx = event.transaction.hash;
  ev.save();

  // Start indexing events on this slot contract
  const context = new DataSourceContext();
  context.setString("factory", event.address.toHexString());
  SlotTemplate.createWithContext(event.params.slot, context);

  // If the slot uses a module, start indexing MetadataUpdated events from it
  if (!moduleAddr.equals(Address.zero())) {
    MetadataModuleTemplate.create(moduleAddr);
    FeedPostModuleTemplate.create(moduleAddr);
  }
}

export function handleModuleVerified(event: ModuleVerified): void {
  const id = event.params.module.toHexString();
  let module = Module.load(id);
  const wasVerified = module ? module.verified : false;
  if (!module) {
    module = new Module(id);
    module.factory = event.address.toHexString();
    module.totalFeesCollected = BigInt.zero();
  }
  module.verified = event.params.verified;
  module.name = event.params.name;
  module.version = event.params.version;
  module.feeBps = event.params.feeBps;

  const uri = event.params.moduleURI;
  module.moduleURI = uri;
  if (uri.length > 0) {
    let hash: string | null = null;
    if (uri.startsWith("ipfs://")) {
      hash = uri.slice(7);
    } else if (uri.startsWith("Qm") || uri.startsWith("bafy")) {
      hash = uri;
    }
    if (hash) {
      const data = ipfs.cat(hash);
      if (data) {
        const result = json.try_fromString(data.toString());
        if (!result.isError) {
          const obj = result.value.toObject();
          const img = obj.get("image");
          if (img && !img.isNull()) module.image = img.toString();
          const desc = obj.get("description");
          if (desc && !desc.isNull()) module.description = desc.toString();
        }
      }
    }
  }

  module.save();

  // Start indexing MetadataUpdated events from newly verified MetadataModules
  if (
    event.params.verified &&
    !wasVerified &&
    (event.params.name == "MetadataModule" ||
      event.params.name == "AdLandModule")
  ) {
    log.info("Creating template for module {} at address {}", [
      event.params.name,
      event.params.module.toHexString(),
    ]);
    MetadataModuleTemplate.create(event.params.module);
  }

  // Also start indexing FeedPostModule instances
  if (
    event.params.verified &&
    !wasVerified &&
    event.params.name == "FeedPostModule"
  ) {
    log.info("Creating FeedPostModule template at address {}", [
      event.params.module.toHexString(),
    ]);
    FeedPostModuleTemplate.create(event.params.module);
  }
}

export function handleAdminTransferred(event: AdminTransferred): void {
  // No-op — admin not stored in schema
}
