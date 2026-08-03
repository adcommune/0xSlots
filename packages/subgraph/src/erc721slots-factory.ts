import { BigInt } from "@graphprotocol/graph-ts";
import { CollectionDeployed } from "../generated/ERC721SlotsFactory/ERC721SlotsFactory";
import { NFTCollection } from "../generated/schema";
import { ERC721Slots as ERC721SlotsTemplate } from "../generated/templates";
import { getOrCreateCurrency } from "./helpers";

export function handleCollectionDeployed(event: CollectionDeployed): void {
  const id = event.params.collection.toHexString();
  const collection = new NFTCollection(id);

  const currency = getOrCreateCurrency(event.params.currency);

  collection.name = event.params.name;
  collection.symbol = event.params.symbol;
  collection.creator = event.params.creator;
  collection.factory = event.params.slotFactory;
  collection.currency = currency.id;
  collection.taxPercentage = BigInt.zero(); // set from init params, not in event
  collection.totalSupply = BigInt.zero();
  collection.createdAt = event.block.timestamp;
  collection.createdTx = event.transaction.hash;
  collection.save();

  // Start indexing TokenMinted events on this collection
  ERC721SlotsTemplate.create(event.params.collection);
}
