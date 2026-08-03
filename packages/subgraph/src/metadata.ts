import { type Address, BigInt, ipfs, json } from "@graphprotocol/graph-ts";
import type { MetadataUpdated } from "../generated/MetadataModule/MetadataModule";
import { MetadataSlot, MetadataUpdatedEvent, Slot } from "../generated/schema";
import type { MetadataUpdated as MetadataUpdatedV2 } from "../generated/templates/FeedPostModule/FeedPostModuleV2";
import { getOrCreateAccount, getOrCreateAccountSlot } from "./helpers";

/**
 * Try to resolve a URI to raw JSON content.
 * - Inline JSON (starts with "{") → return as-is
 * - IPFS hash or ipfs:// URI → fetch via ipfs.cat
 * - Anything else → null (client-side fallback)
 */
export function resolveContent(uri: string): string | null {
  if (uri.startsWith("{")) return uri;

  let hash: string | null = null;
  if (uri.startsWith("Qm") || uri.startsWith("bafy")) {
    hash = uri;
  } else if (uri.startsWith("ipfs://")) {
    hash = uri.slice(7);
  }

  if (hash) {
    const data = ipfs.cat(hash);
    if (data) return data.toString();
  }

  return null;
}

/**
 * Extract the IPFS CID from a URI string.
 * Returns null for inline JSON or non-IPFS URIs.
 */
export function extractCid(uri: string): string | null {
  if (uri.startsWith("Qm") || uri.startsWith("bafy")) return uri;
  if (uri.startsWith("ipfs://")) return uri.slice(7);
  return null;
}

/**
 * Try to extract "type" from a JSON string.
 */
function extractAdType(rawJson: string): string | null {
  const result = json.try_fromString(rawJson);
  if (result.isError) return null;
  const obj = result.value.toObject();
  const t = obj.get("type");
  if (t && !t.isNull()) return t.toString();
  return null;
}

export function handleMetadataUpdated(event: MetadataUpdated): void {
  const slotId = event.params.slot.toHexString();
  const slot = Slot.load(slotId);
  if (slot == null) return;

  slot.updatedAt = event.block.timestamp;
  slot.save();

  // Resolve content once, reuse for both entities
  const content = resolveContent(event.params.uri);
  const adType: string | null = content ? extractAdType(content) : null;
  const cid = extractCid(event.params.uri);

  // Upsert MetadataSlot (mutable — latest state)
  let metadataSlot = MetadataSlot.load(slotId);
  if (metadataSlot == null) {
    metadataSlot = new MetadataSlot(slotId);
    metadataSlot.slot = slotId;
    metadataSlot.updateCount = BigInt.fromI32(0);
    metadataSlot.createdAt = event.block.timestamp;
    metadataSlot.createdTx = event.transaction.hash;
  }
  metadataSlot.uri = event.params.uri;
  metadataSlot.cid = cid;
  metadataSlot.rawJson = content;
  metadataSlot.adType = adType;
  metadataSlot.updatedBy = event.transaction.from;
  metadataSlot.updateCount = metadataSlot.updateCount.plus(BigInt.fromI32(1));
  metadataSlot.updatedAt = event.block.timestamp;
  metadataSlot.updatedTx = event.transaction.hash;
  metadataSlot.save();

  // Track metadata update counts on Account & AccountSlot
  const author = getOrCreateAccount(event.transaction.from, true);
  author.metadataUpdateCount = author.metadataUpdateCount.plus(
    BigInt.fromI32(1),
  );
  author.save();

  const authorAS = getOrCreateAccountSlot(
    event.transaction.from,
    event.params.slot,
    event.block.timestamp,
  );
  authorAS.metadataUpdateCount = authorAS.metadataUpdateCount.plus(
    BigInt.fromI32(1),
  );
  authorAS.lastInteractedAt = event.block.timestamp;
  authorAS.save();

  // Create immutable history event
  const eventId =
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  const metadataEvent = new MetadataUpdatedEvent(eventId);
  metadataEvent.slot = slotId;
  metadataEvent.author = author.id;
  metadataEvent.updatedBy = event.transaction.from;
  metadataEvent.uri = event.params.uri;
  metadataEvent.cid = cid;
  metadataEvent.rawJson = content;
  metadataEvent.adType = adType;
  metadataEvent.timestamp = event.block.timestamp;
  metadataEvent.blockNumber = event.block.number;
  metadataEvent.tx = event.transaction.hash;
  metadataEvent.save();
}

/**
 * V2 handler: MetadataUpdated(indexed address slot, indexed address updatedBy, string uri)
 * Uses event.params.updatedBy instead of event.transaction.from for attribution.
 */
export function handleMetadataUpdatedV2(event: MetadataUpdatedV2): void {
  const slotId = event.params.slot.toHexString();
  const slot = Slot.load(slotId);
  if (slot == null) return;

  slot.updatedAt = event.block.timestamp;
  slot.save();

  const authorAddress: Address = event.params.updatedBy;
  const content = resolveContent(event.params.uri);
  const adType: string | null = content ? extractAdType(content) : null;
  const cid = extractCid(event.params.uri);

  // Upsert MetadataSlot (mutable — latest state)
  let metadataSlot = MetadataSlot.load(slotId);
  if (metadataSlot == null) {
    metadataSlot = new MetadataSlot(slotId);
    metadataSlot.slot = slotId;
    metadataSlot.updateCount = BigInt.fromI32(0);
    metadataSlot.createdAt = event.block.timestamp;
    metadataSlot.createdTx = event.transaction.hash;
  }
  metadataSlot.uri = event.params.uri;
  metadataSlot.cid = cid;
  metadataSlot.rawJson = content;
  metadataSlot.adType = adType;
  metadataSlot.updatedBy = authorAddress;
  metadataSlot.updateCount = metadataSlot.updateCount.plus(BigInt.fromI32(1));
  metadataSlot.updatedAt = event.block.timestamp;
  metadataSlot.updatedTx = event.transaction.hash;
  metadataSlot.save();

  // Track metadata update counts on Account & AccountSlot
  const author = getOrCreateAccount(authorAddress, true);
  author.metadataUpdateCount = author.metadataUpdateCount.plus(
    BigInt.fromI32(1),
  );
  author.save();

  const authorAS = getOrCreateAccountSlot(
    authorAddress,
    event.params.slot,
    event.block.timestamp,
  );
  authorAS.metadataUpdateCount = authorAS.metadataUpdateCount.plus(
    BigInt.fromI32(1),
  );
  authorAS.lastInteractedAt = event.block.timestamp;
  authorAS.save();

  // Create immutable history event
  const eventId =
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  const metadataEvent = new MetadataUpdatedEvent(eventId);
  metadataEvent.slot = slotId;
  metadataEvent.author = author.id;
  metadataEvent.updatedBy = authorAddress;
  metadataEvent.uri = event.params.uri;
  metadataEvent.cid = cid;
  metadataEvent.rawJson = content;
  metadataEvent.adType = adType;
  metadataEvent.timestamp = event.block.timestamp;
  metadataEvent.blockNumber = event.block.number;
  metadataEvent.tx = event.transaction.hash;
  metadataEvent.save();
}
