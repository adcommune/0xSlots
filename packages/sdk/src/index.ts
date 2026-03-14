// Unified client (read + write)
export {
  SlotsClient,
  createSlotsClient,
  SlotsChain,
  SUBGRAPH_URLS,
  type SlotsClientConfig,
  type SubgraphMeta,
  type SlotConfig,
  type SlotInitParams,
  type CreateSlotParams,
  type CreateSlotsParams,
  type BuyParams,
} from "./client";

// Errors
export { SlotsError } from "./errors";

// Re-export generated types and SDK
export * from "./generated/graphql";
