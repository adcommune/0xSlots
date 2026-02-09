import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  HubSettingsUpdated,
  LandOpened,
  ModuleAllowedStatusUpdated,
  CurrencyAllowedStatusUpdated,
} from "../generated/SlotsHub/SlotsHub";
import { Slots as SlotsTemplate } from "../generated/templates";
import { Hub, Land, Module, Currency } from "../generated/schema";

function getOrCreateHub(address: Bytes): Hub {
  let hub = Hub.load(address.toHexString());
  if (!hub) {
    hub = new Hub(address.toHexString());
    hub.protocolFeeBps = BigInt.zero();
    hub.protocolFeeRecipient = Bytes.empty();
    hub.slotPrice = BigInt.zero();
    hub.defaultCurrency = Bytes.empty();
    hub.defaultSlotCount = BigInt.zero();
    hub.defaultPrice = BigInt.zero();
    hub.defaultTaxPercentage = BigInt.zero();
    hub.defaultMaxTaxPercentage = BigInt.zero();
    hub.defaultMinTaxUpdatePeriod = BigInt.zero();
    hub.defaultModule = Bytes.empty();
  }
  return hub;
}

export function handleHubSettingsUpdated(event: HubSettingsUpdated): void {
  let hub = getOrCreateHub(event.address);
  let settings = event.params.newHubSettings;

  hub.protocolFeeBps = settings.protocolFeeBps;
  hub.protocolFeeRecipient = settings.protocolFeeRecipient;
  hub.slotPrice = settings.slotPrice;
  hub.defaultCurrency = settings.newLandInitialCurrency;
  hub.defaultSlotCount = settings.newLandInitialAmount;
  hub.defaultPrice = settings.newLandInitialPrice;
  hub.defaultTaxPercentage = settings.newLandInitialTaxPercentage;
  hub.defaultMaxTaxPercentage = settings.newLandInitialMaxTaxPercentage;
  hub.defaultMinTaxUpdatePeriod = settings.newLandInitialMinTaxUpdatePeriod;
  hub.defaultModule = settings.newLandInitialModule;

  hub.save();
}

export function handleLandOpened(event: LandOpened): void {
  let hub = getOrCreateHub(event.address);
  hub.save();

  let land = new Land(event.params.land.toHexString());
  land.hub = hub.id;
  land.owner = event.params.account;
  land.createdAt = event.block.timestamp;
  land.createdTx = event.transaction.hash;
  land.save();

  // Start indexing this Slots contract
  SlotsTemplate.create(event.params.land);
}

export function handleModuleAllowedStatusUpdated(
  event: ModuleAllowedStatusUpdated
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

export function handleCurrencyAllowedStatusUpdated(
  event: CurrencyAllowedStatusUpdated
): void {
  let hub = getOrCreateHub(event.address);
  hub.save();

  let currency = Currency.load(event.params.currency.toHexString());
  if (!currency) {
    currency = new Currency(event.params.currency.toHexString());
    currency.hub = hub.id;
  }
  currency.allowed = event.params.allowed;
  currency.save();
}
