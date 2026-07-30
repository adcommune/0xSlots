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
  type CreateSlotV3Params,
  type CreateSlotsParams,
  type BuyParams,
} from "./client";

// Modules
export { MetadataModuleClient } from "./modules/metadata";
export { FeedModuleClient } from "./modules/feed";

// Tokens
export {
  type TokenInfo,
  CHAIN_TOKENS,
  getChainTokens,
  getDefaultToken,
} from "./tokens";

// Occupancy resolution (v3 epochs)
//
// REQUIRED for any UI reading occupancy from the subgraph: between an epoch
// boundary and the transaction that materialises the transfer, indexed
// `occupant` names the OLD occupant while the chain already names the new one.
// resolveEffectiveOccupancy closes that gap; the subgraph cannot, because
// GraphQL has no "now" at query time.
export {
  resolveEffectiveOccupancy,
  nextBoundary,
  secondsUntilEffective,
  canAttemptBuy,
  type OccupancyFields,
  type EffectiveOccupancy,
} from "./occupancy";

// Errors
export { SlotsError } from "./errors";

// Re-export generated types and SDK
export * from "./generated/graphql";
