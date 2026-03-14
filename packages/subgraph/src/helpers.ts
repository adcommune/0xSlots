import { Address } from "@graphprotocol/graph-ts";
import { Account, Currency, Module, Slot } from "../generated/schema";
import { ERC20 } from "../generated/SlotFactory/ERC20";

export function getOrCreateAccount(address: Address): Account {
  let id = address.toHexString();
  let account = Account.load(id);
  if (!account) {
    account = new Account(id);
    account.type = "EOA"; // default — upgraded by markAccountAsContract/markAccountAsSplit
    account.slotCount = 0;
    account.occupiedCount = 0;
    account.save();
  }
  return account;
}

/**
 * Mark an account as a contract. Called when we know the address is a contract
 * (e.g., it's a slot address created by our factory).
 */
export function markAccountAsContract(address: Address): void {
  let account = getOrCreateAccount(address);
  if (account.type == "EOA") {
    account.type = "CONTRACT";
    account.save();
  }
}

/**
 * Mark an account as a 0xSplits split. Call from frontend or admin tool
 * by triggering a specific event, or detect via factory creation events.
 */
export function markAccountAsSplit(address: Address): void {
  let account = getOrCreateAccount(address);
  account.type = "SPLIT";
  account.save();
}

export function getOrCreateCurrency(address: Address): Currency {
  let id = address.toHexString();
  let currency = Currency.load(id);
  if (!currency) {
    let erc20 = ERC20.bind(address);
    let nameResult = erc20.try_name();
    let symbolResult = erc20.try_symbol();
    let decimalsResult = erc20.try_decimals();

    currency = new Currency(id);
    currency.name = nameResult.reverted ? null : nameResult.value;
    currency.symbol = symbolResult.reverted ? null : symbolResult.value;
    currency.decimals = decimalsResult.reverted ? 18 : decimalsResult.value;
    currency.save();
  }
  return currency;
}

export function getOrCreateModule(address: Address, factoryId: string): Module {
  let id = address.toHexString();
  let module = Module.load(id);
  if (!module) {
    module = new Module(id);
    module.factory = factoryId;
    module.verified = false;
    module.name = "";
    module.version = "";
    module.save();
  }
  return module;
}
