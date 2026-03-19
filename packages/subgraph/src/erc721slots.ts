import { BigInt, Address } from "@graphprotocol/graph-ts";
import { TokenMinted } from "../generated/ERC721Slots/ERC721Slots";
import { NFTCollection, NFTToken } from "../generated/schema";

function getOrCreateCollection(
  address: Address,
  timestamp: BigInt,
  txHash: string
): NFTCollection {
  let id = address.toHexString();
  let collection = NFTCollection.load(id);
  if (collection == null) {
    collection = new NFTCollection(id);
    collection.name = "";
    collection.symbol = "";
    collection.creator = address; // will be updated
    collection.factory = address; // will be updated
    collection.currency = "0x0000000000000000000000000000000000000000";
    collection.taxPercentage = BigInt.zero();
    collection.totalSupply = BigInt.zero();
    collection.createdAt = timestamp;
    collection.createdTx = Address.fromHexString(txHash);
  }
  return collection;
}

export function handleTokenMinted(event: TokenMinted): void {
  let collectionAddress = event.address;
  let collection = getOrCreateCollection(
    collectionAddress,
    event.block.timestamp,
    event.transaction.hash.toHexString()
  );
  collection.totalSupply = collection.totalSupply.plus(BigInt.fromI32(1));
  collection.save();

  let tokenId = event.params.tokenId;
  let id = collectionAddress.toHexString() + "-" + tokenId.toString();
  let token = new NFTToken(id);
  token.collection = collectionAddress.toHexString();
  token.tokenId = tokenId;
  token.slot = event.params.slot.toHexString();
  token.uri = event.params.uri;
  token.mintedAt = event.block.timestamp;
  token.mintedTx = event.transaction.hash;
  token.save();
}
