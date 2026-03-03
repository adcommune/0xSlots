import { Address } from "@graphprotocol/graph-ts";
import { Account } from "../generated/schema";

export function getOrCreateAccount(address: Address): Account {
  let id = address.toHexString();
  let account = Account.load(id);
  if (!account) {
    account = new Account(id);
    account.slotCount = 0;
    account.occupiedCount = 0;
    account.save();
  }
  return account;
}
