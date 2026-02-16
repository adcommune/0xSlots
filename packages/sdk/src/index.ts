// Main client
export {
  SlotsClient,
  createSlotsClient,
  SlotsChain,
  SUBGRAPH_URLS,
  type SlotsClientConfig,
} from "./client";

// Re-export generated types and SDK
export * from "./generated/graphql";
