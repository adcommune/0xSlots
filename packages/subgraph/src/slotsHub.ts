import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import { ERC20 } from "../generated/SlotsHub/ERC20";
import {
  HubSettingsUpdated,
  LandOpened,
  LandExpanded,
  ModuleAllowedStatusUpdated,
} from "../generated/SlotsHub/SlotsHub";
import { Slots as SlotsTemplate } from "../generated/templates";
import {
  Hub,
  Land,
  Module,
  Currency,
  LandOpenedEvent,
  LandExpandedEvent,
} from "../generated/schema";

function eventEntityId(txHash: Bytes, logIndex: BigInt): string {
  return txHash.toHexString() + "-" + logIndex.toString();
}

function getOrCreateHub(address: Bytes): Hub {
  let hub = Hub.load(address.toHexString());
  if (!hub) {
    hub = new Hub(address.toHexString());
    hub.protocolFeeBps = BigInt.zero();
    hub.protocolFeeRecipient = Bytes.empty();
    hub.landCreationFee = BigInt.zero();
    hub.slotExpansionFee = BigInt.zero();
    hub.defaultCurrency = null;
    hub.defaultSlotCount = BigInt.zero();
    hub.defaultPrice = BigInt.zero();
    hub.defaultTaxPercentage = BigInt.zero();
    hub.defaultMaxTaxPercentage = BigInt.zero();
    hub.defaultMinTaxUpdatePeriod = BigInt.zero();
    hub.defaultModule = Bytes.empty();
    hub.moduleCallGasLimit = BigInt.zero();
    hub.liquidationBountyBps = BigInt.zero();
    hub.minDepositSeconds = BigInt.zero();
  }
  return hub;
}

export function handleHubSettingsUpdated(event: HubSettingsUpdated): void {
  let hub = getOrCreateHub(event.address);
  let settings = event.params.newHubSettings;

  hub.protocolFeeBps = settings.protocolFeeBps;
  hub.protocolFeeRecipient = settings.protocolFeeRecipient;
  hub.landCreationFee = settings.landCreationFee;
  hub.slotExpansionFee = settings.slotExpansionFee;

  // Link defaultCurrency to Currency entity
  let currencyAddr = settings.newLandInitialCurrency;
  let currencyId = currencyAddr.toHexString();
  let currency = Currency.load(currencyId);
  if (!currency) {
    currency = new Currency(currencyId);
    currency.hub = hub.id;
    let token = ERC20.bind(currencyAddr);
    let nameResult = token.try_name();
    if (!nameResult.reverted) currency.name = nameResult.value;
    let symbolResult = token.try_symbol();
    if (!symbolResult.reverted) currency.symbol = symbolResult.value;
    let decimalsResult = token.try_decimals();
    if (!decimalsResult.reverted) currency.decimals = decimalsResult.value;

    currency.save();
  }
  hub.defaultCurrency = currencyId;
  hub.defaultSlotCount = settings.newLandInitialAmount;
  hub.defaultPrice = settings.newLandInitialPrice;
  hub.defaultTaxPercentage = settings.newLandInitialTaxPercentage;
  hub.defaultMaxTaxPercentage = settings.newLandInitialMaxTaxPercentage;
  hub.defaultMinTaxUpdatePeriod = settings.newLandInitialMinTaxUpdatePeriod;
  hub.defaultModule = settings.newLandInitialModule;
  hub.moduleCallGasLimit = settings.moduleCallGasLimit;
  hub.liquidationBountyBps = settings.liquidationBountyBps;
  hub.minDepositSeconds = settings.minDepositSeconds;

  hub.save();
}

export function handleLandOpened(event: LandOpened): void {
  let hub = getOrCreateHub(event.address);
  hub.save();

  let landId = event.params.land.toHexString();
  let land = new Land(landId);
  land.hub = hub.id;
  land.owner = event.params.account;
  land.createdAt = event.block.timestamp;
  land.createdTx = event.transaction.hash;
  land.save();

  let landEvent = new LandOpenedEvent(
    eventEntityId(event.transaction.hash, event.logIndex),
  );
  landEvent.land = landId;
  landEvent.account = event.params.account;
  landEvent.timestamp = event.block.timestamp;
  landEvent.blockNumber = event.block.number;
  landEvent.tx = event.transaction.hash;
  landEvent.save();

  // Start indexing this Slots contract
  SlotsTemplate.create(event.params.land);
}

export function handleLandExpanded(event: LandExpanded): void {
  let expandEvent = new LandExpandedEvent(
    eventEntityId(event.transaction.hash, event.logIndex),
  );
  expandEvent.land = event.params.land;
  expandEvent.newSlotCount = event.params.newSlotCount;
  expandEvent.timestamp = event.block.timestamp;
  expandEvent.blockNumber = event.block.number;
  expandEvent.tx = event.transaction.hash;
  expandEvent.save();
}

export function handleModuleAllowedStatusUpdated(
  event: ModuleAllowedStatusUpdated,
): void {
  let hub = getOrCreateHub(event.address);
  hub.save();

  let module = Module.load(event.params.module.toHexString());
  if (!module) {
    module = new Module(event.params.module.toHexString());
    module.hub = hub.id;
  }
  module.allowed = event.params.allowed;
  module.name = event.params.name;
  module.version = event.params.version;
  module.save();
}

// Currency allowlist removed — any ERC-20 is accepted
