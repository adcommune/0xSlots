import { MetadataUpdated } from "../generated/MetadataModule/MetadataModule";
import { Slot, MetadataUpdatedEvent } from "../generated/schema";

export function handleMetadataUpdated(event: MetadataUpdated): void {
  let slotId = event.params.slot.toHexString();
  let slot = Slot.load(slotId);

  // Only index if slot exists (was created by our factory)
  if (slot == null) return;

  // Update current URI on slot
  slot.metadataURI = event.params.uri;
  slot.updatedAt = event.block.timestamp;
  slot.save();

  // Create history event
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
