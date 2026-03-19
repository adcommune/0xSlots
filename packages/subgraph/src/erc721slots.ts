import { BigInt } from "@graphprotocol/graph-ts";
import { TokenMinted } from "../generated/templates/ERC721Slots/ERC721Slots";
import { NFTCollection, NFTToken } from "../generated/schema";

export function handleTokenMinted(event: TokenMinted): void {
  let collectionId = event.address.toHexString();
  let collection = NFTCollection.load(collectionId);
  if (collection) {
    collection.totalSupply = collection.totalSupply.plus(BigInt.fromI32(1));
    collection.save();
  }

  let tokenId = event.params.tokenId;
  let id = collectionId + "-" + tokenId.toString();
  let token = new NFTToken(id);
  token.collection = collectionId;
  token.tokenId = tokenId;
  token.slot = event.params.slot.toHexString();
  token.uri = event.params.uri;
  token.mintedAt = event.block.timestamp;
  token.mintedTx = event.transaction.hash;
  token.save();
}
