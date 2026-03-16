import { MetadataUpdated } from "../generated/MetadataModule/MetadataModule";
import { Slot, MetadataSlot, MetadataUpdatedEvent } from "../generated/schema";
import { BigInt } from "@graphprotocol/graph-ts";

export function handleMetadataUpdated(event: MetadataUpdated): void {
  let slotId = event.params.slot.toHexString();
  let slot = Slot.load(slotId);

  // Only index if slot exists (was created by our factory)
  if (slot == null) return;

  slot.updatedAt = event.block.timestamp;
  slot.save();

  // Upsert MetadataSlot
  let metadataSlot = MetadataSlot.load(slotId);
  if (metadataSlot == null) {
    metadataSlot = new MetadataSlot(slotId);
    metadataSlot.slot = slotId;
    metadataSlot.updateCount = BigInt.fromI32(0);
    metadataSlot.createdAt = event.block.timestamp;
    metadataSlot.createdTx = event.transaction.hash;
  }
  metadataSlot.uri = event.params.uri;
  metadataSlot.updatedBy = event.transaction.from;
  metadataSlot.updateCount = metadataSlot.updateCount.plus(BigInt.fromI32(1));
  metadataSlot.updatedAt = event.block.timestamp;
  metadataSlot.updatedTx = event.transaction.hash;
  metadataSlot.save();

  // Create immutable history event
  let eventId =
    event.transaction.hash.toHexString() +
    "-" +
    event.logIndex.toString();

  let metadataEvent = new MetadataUpdatedEvent(eventId);
  metadataEvent.slot = slotId;
  metadataEvent.uri = event.params.uri;
  metadataEvent.timestamp = event.block.timestamp;
  metadataEvent.blockNumber = event.block.number;
  metadataEvent.tx = event.transaction.hash;
  metadataEvent.save();
}
