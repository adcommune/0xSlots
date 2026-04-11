import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Account, AccountSlot, Currency, Module } from "../generated/schema";
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
    account.metadataUpdateCount = BigInt.zero();
    account.totalHoldTime = BigInt.zero();
    account.save();
  } else if (account.type == "CONTRACT" && isTxSender) {
    // Upgrade: previously classified as CONTRACT but now seen as tx sender
    account.type = "DELEGATED";
    account.save();
  }
  return account;
}

export function getOrCreateAccountSlot(
  accountAddress: Address,
  slotAddress: Address,
  timestamp: BigInt
): AccountSlot {
  let id = accountAddress.toHexString() + "-" + slotAddress.toHexString();
  let accountSlot = AccountSlot.load(id);
  if (!accountSlot) {
    accountSlot = new AccountSlot(id);
    accountSlot.account = accountAddress.toHexString();
    accountSlot.slot = slotAddress.toHexString();
    accountSlot.metadataUpdateCount = BigInt.zero();
    accountSlot.taxPaid = BigInt.zero();
    accountSlot.holdTime = BigInt.zero();
    accountSlot.lastOccupiedAt = null;
    accountSlot.firstInteractedAt = timestamp;
    accountSlot.lastInteractedAt = timestamp;
    accountSlot.save();
  }
  return accountSlot;
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
    module.feeBps = BigInt.zero();
    module.totalFeesCollected = BigInt.zero();
    module.save();
  }
  return module;
}
