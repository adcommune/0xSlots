import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Feed as FeedContract } from "../generated/FeedHub/Feed";
import { FeedCreated } from "../generated/FeedHub/FeedHub";
import { Feed, FeedCreatedEvent, FeedHub } from "../generated/schema";
import { Feed as FeedTemplate } from "../generated/templates";
import { applyFeedMetadata } from "./feed";

function getOrCreateFeedHub(address: string): FeedHub {
  let hub = FeedHub.load(address);
  if (!hub) {
    hub = new FeedHub(address);
    hub.feedCount = BigInt.zero();
    hub.save();
  }
  return hub;
}

export function handleFeedCreated(event: FeedCreated): void {
  const hub = getOrCreateFeedHub(event.address.toHexString());
  hub.feedCount = hub.feedCount.plus(BigInt.fromI32(1));
  hub.save();

  const feedAddress = event.params.feed;
  const feed = new Feed(feedAddress.toHexString());
  feed.hub = hub.id;
  feed.index = event.params.index;
  feed.owner = event.params.owner;

  const contract = FeedContract.bind(feedAddress);

  const nameResult = contract.try_name();
  feed.onchainName = nameResult.reverted ? "" : nameResult.value;

  const metadataURIResult = contract.try_metadataURI();
  const metadataURI = metadataURIResult.reverted ? "" : metadataURIResult.value;
  feed.metadataURI = metadataURI;

  const recipientResult = contract.try_feedRecipient();
  feed.recipient = recipientResult.reverted
    ? Address.zero()
    : recipientResult.value;

  // slotCount is driven solely by SlotAdded events (each +1). Do NOT seed it
  // from contract.slotCount() here: createFeed + createSlots land in the same
  // block, so an eth_call returns the end-of-block value (all slots already
  // minted) and the subsequent SlotAdded events would double-count it.
  feed.slotCount = BigInt.zero();

  feed.createdAt = event.block.timestamp;
  feed.createdTx = event.transaction.hash;
  feed.updatedAt = event.block.timestamp;

  applyFeedMetadata(feed, metadataURI);

  feed.save();

  const evId =
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  const ev = new FeedCreatedEvent(evId);
  ev.feed = feed.id;
  ev.hub = event.address;
  ev.owner = event.params.owner;
  ev.index = event.params.index;
  ev.blockNumber = event.block.number;
  ev.blockTimestamp = event.block.timestamp;
  ev.transactionHash = event.transaction.hash;
  ev.save();

  FeedTemplate.create(feedAddress);
}
