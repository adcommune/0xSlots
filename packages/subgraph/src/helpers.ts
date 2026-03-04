import { Address } from "@graphprotocol/graph-ts";
import { Account, Module } from "../generated/schema";

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
