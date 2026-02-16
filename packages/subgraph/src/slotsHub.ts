import { BigInt, Bytes, Address, ethereum } from "@graphprotocol/graph-ts";
import { ERC20 } from "../generated/SlotsHub/ERC20";
import { SuperToken } from "../generated/SlotsHub/SuperToken";
import {
  HubSettingsUpdated,
  LandOpened,
  ModuleAllowedStatusUpdated,
  CurrencyAllowedStatusUpdated,
} from "../generated/SlotsHub/SlotsHub";
import { Slots as SlotsTemplate } from "../generated/templates";
import {
  Hub,
  Land,
  Module,
  Currency,
  LandOpenedEvent,
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
    hub.slotPrice = BigInt.zero();
    hub.defaultCurrency = null;
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
  // Link defaultCurrency to Currency entity (create if needed)
  let currencyAddr = settings.newLandInitialCurrency;
  let currencyId = currencyAddr.toHexString();
  let currency = Currency.load(currencyId);
  if (!currency) {
    currency = new Currency(currencyId);
    currency.hub = hub.id;
    currency.allowed = false;

    let token = ERC20.bind(currencyAddr);
    let nameResult = token.try_name();
    if (!nameResult.reverted) currency.name = nameResult.value;
    let symbolResult = token.try_symbol();
    if (!symbolResult.reverted) currency.symbol = symbolResult.value;
    let decimalsResult = token.try_decimals();
    if (!decimalsResult.reverted) currency.decimals = decimalsResult.value;

    let superToken = SuperToken.bind(currencyAddr);
    let underlyingResult = superToken.try_getUnderlyingToken();
    if (!underlyingResult.reverted) {
      currency.underlyingToken = underlyingResult.value;
      if (
        underlyingResult.value.toHexString() !=
        "0x0000000000000000000000000000000000000000"
      ) {
        let underlying = ERC20.bind(underlyingResult.value);
        let uNameResult = underlying.try_name();
        if (!uNameResult.reverted) currency.underlyingName = uNameResult.value;
        let uSymbolResult = underlying.try_symbol();
        if (!uSymbolResult.reverted)
          currency.underlyingSymbol = uSymbolResult.value;
        let uDecimalsResult = underlying.try_decimals();
        if (!uDecimalsResult.reverted)
          currency.underlyingDecimals = uDecimalsResult.value;
      }
    }

    currency.save();
  }
  hub.defaultCurrency = currencyId;
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

  let landId = event.params.land.toHexString();
  let land = new Land(landId);
  land.hub = hub.id;
  land.owner = event.params.account;
  land.createdAt = event.block.timestamp;
  land.createdTx = event.transaction.hash;
  land.save();

  // Create event entity
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

export function handleCurrencyAllowedStatusUpdated(
  event: CurrencyAllowedStatusUpdated,
): void {
  let hub = getOrCreateHub(event.address);
  hub.save();

  let currency = Currency.load(event.params.currency.toHexString());
  if (!currency) {
    currency = new Currency(event.params.currency.toHexString());
    currency.hub = hub.id;
  }
  currency.allowed = event.params.allowed;

  // Fetch token metadata if not already set
  if (!currency.name) {
    let token = ERC20.bind(event.params.currency);

    let nameResult = token.try_name();
    if (!nameResult.reverted) {
      currency.name = nameResult.value;
    }

    let symbolResult = token.try_symbol();
    if (!symbolResult.reverted) {
      currency.symbol = symbolResult.value;
    }

    let decimalsResult = token.try_decimals();
    if (!decimalsResult.reverted) {
      currency.decimals = decimalsResult.value;
    }

    // Fetch underlying token
    let superToken = SuperToken.bind(event.params.currency);
    let underlyingResult = superToken.try_getUnderlyingToken();
    if (!underlyingResult.reverted) {
      currency.underlyingToken = underlyingResult.value;

      // If underlying is not zero address, fetch its metadata
      if (
        underlyingResult.value.toHexString() !=
        "0x0000000000000000000000000000000000000000"
      ) {
        let underlying = ERC20.bind(underlyingResult.value);

        let uNameResult = underlying.try_name();
        if (!uNameResult.reverted) {
          currency.underlyingName = uNameResult.value;
        }

        let uSymbolResult = underlying.try_symbol();
        if (!uSymbolResult.reverted) {
          currency.underlyingSymbol = uSymbolResult.value;
        }

        let uDecimalsResult = underlying.try_decimals();
        if (!uDecimalsResult.reverted) {
          currency.underlyingDecimals = uDecimalsResult.value;
        }
      }
    }
  }

  currency.save();
}
