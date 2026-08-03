import { BigInt } from "@graphprotocol/graph-ts";
import { NFTCollection, NFTToken } from "../generated/schema";
import { TokenMinted } from "../generated/templates/ERC721Slots/ERC721Slots";

export function handleTokenMinted(event: TokenMinted): void {
  const collectionId = event.address.toHexString();
  const collection = NFTCollection.load(collectionId);
  if (collection) {
    collection.totalSupply = collection.totalSupply.plus(BigInt.fromI32(1));
    collection.save();
  }

  const tokenId = event.params.tokenId;
  const id = collectionId + "-" + tokenId.toString();
  const token = new NFTToken(id);
  token.collection = collectionId;
  token.tokenId = tokenId;
  token.slot = event.params.slot.toHexString();
  token.uri = event.params.uri;
  token.mintedAt = event.block.timestamp;
  token.mintedTx = event.transaction.hash;
  token.save();
}
