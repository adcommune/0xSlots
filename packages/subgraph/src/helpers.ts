import { Address, ethereum } from "@graphprotocol/graph-ts";
import { Account, Currency, Module } from "../generated/schema";
import { ERC20 } from "../generated/SlotFactory/ERC20";
import { SplitV2 } from "../generated/SlotFactory/SplitV2";

/**
 * Detect account type using ethereum.hasCode() + 0xSplits interface check.
 * - EOA: no code at address
 * - DELEGATED: has code but is a transaction sender (ERC-7702)
 * - SPLIT: has code AND responds to splitHash()
 * - CONTRACT: has code but not a split or delegated
 */
function detectAccountType(address: Address, isTxSender: bool): string {
  let hasCode = ethereum.hasCode(address);
  if (!hasCode.inner) {
    return "EOA";
  }

  // Has code but is a tx sender → ERC-7702 delegated EOA
  // Real contracts can never be transaction.from
  if (isTxSender) {
    return "DELEGATED";
  }

  // Has code — check if it's a 0xSplits contract
  let split = SplitV2.bind(address);
  let splitResult = split.try_splitHash();
  if (!splitResult.reverted) {
    return "SPLIT";
  }

  return "CONTRACT";
}

export function getOrCreateAccount(address: Address, isTxSender: bool = false): Account {
  let id = address.toHexString();
  let account = Account.load(id);
  if (!account) {
    account = new Account(id);
    account.type = detectAccountType(address, isTxSender);
    account.slotCount = 0;
    account.occupiedCount = 0;
    account.save();
  } else if (account.type == "CONTRACT" && isTxSender) {
    // Upgrade: previously classified as CONTRACT but now seen as tx sender
    account.type = "DELEGATED";
    account.save();
  }
  return account;
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
