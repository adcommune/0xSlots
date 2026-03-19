import { MetadataUpdated } from "../generated/MetadataModule/MetadataModule";
import { Slot, MetadataSlot, MetadataUpdatedEvent } from "../generated/schema";
import { BigInt, ipfs, json } from "@graphprotocol/graph-ts";
import { getOrCreateAccount } from "./helpers";

/**
 * Try to resolve a URI to raw JSON content.
 * - Inline JSON (starts with "{") → return as-is
 * - IPFS hash or ipfs:// URI → fetch via ipfs.cat
 * - Anything else → null (client-side fallback)
 */
function resolveContent(uri: string): string | null {
  if (uri.startsWith("{")) return uri;

  let hash: string | null = null;
  if (uri.startsWith("Qm") || uri.startsWith("bafy")) {
    hash = uri;
  } else if (uri.startsWith("ipfs://")) {
    hash = uri.slice(7);
  }

  if (hash) {
    let data = ipfs.cat(hash);
    if (data) return data.toString();
  }

  return null;
}

/**
 * Try to extract "type" from a JSON string.
 */
function extractAdType(rawJson: string): string | null {
  let result = json.try_fromString(rawJson);
  if (result.isError) return null;
  let obj = result.value.toObject();
  let t = obj.get("type");
  if (t && !t.isNull()) return t.toString();
  return null;
}

export function handleMetadataUpdated(event: MetadataUpdated): void {
  let slotId = event.params.slot.toHexString();
  let slot = Slot.load(slotId);
  if (slot == null) return;

  slot.updatedAt = event.block.timestamp;
  slot.save();

  // Resolve content once, reuse for both entities
  let content = resolveContent(event.params.uri);
  let adType: string | null = content ? extractAdType(content) : null;

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
  metadataSlot.rawJson = content;
  metadataSlot.adType = adType;
  metadataSlot.updatedBy = event.transaction.from;
  metadataSlot.updateCount = metadataSlot.updateCount.plus(BigInt.fromI32(1));
  metadataSlot.updatedAt = event.block.timestamp;
  metadataSlot.updatedTx = event.transaction.hash;
  metadataSlot.save();

  // Create immutable history event
  let author = getOrCreateAccount(event.transaction.from, true);
  let eventId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  let metadataEvent = new MetadataUpdatedEvent(eventId);
  metadataEvent.slot = slotId;
  metadataEvent.author = author.id;
  metadataEvent.uri = event.params.uri;
  metadataEvent.rawJson = content;
  metadataEvent.adType = adType;
  metadataEvent.timestamp = event.block.timestamp;
  metadataEvent.blockNumber = event.block.number;
  metadataEvent.tx = event.transaction.hash;
  metadataEvent.save();
}
