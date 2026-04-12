import { parseAbiItem } from "viem";

// ═══════════════════════════════════════════════════════════
// Feed Event (emitted by FeedRouter)
// ═══════════════════════════════════════════════════════════

export const feedEvent = parseAbiItem(
  "event FeedEvent(address indexed slot, uint8 indexed eventType, bytes data)",
);

// ═══════════════════════════════════════════════════════════
// Event type constants (mirror Solidity constants in FeedRouter.sol)
// ═══════════════════════════════════════════���═══════════════

export enum FeedEventType {
  POSTED = 1,
  METADATA_UPDATED = 2,
  METADATA_CLEARED = 3,
}

// ═══════════════════════════════════════════════════════════
// Event data format registry
// ═════════════════════════════════════════════════════��═════

export const FEED_EVENT_TYPES: Record<
  FeedEventType,
  { name: string; params: { name: string; type: string }[] }
> = {
  [FeedEventType.POSTED]: {
    name: "Posted",
    params: [
      { name: "account", type: "address" },
      { name: "uri", type: "string" },
    ],
  },
  [FeedEventType.METADATA_UPDATED]: {
    name: "MetadataUpdated",
    params: [
      { name: "account", type: "address" },
      { name: "uri", type: "string" },
    ],
  },
  [FeedEventType.METADATA_CLEARED]: {
    name: "MetadataCleared",
    params: [{ name: "slot", type: "address" }],
  },
};
