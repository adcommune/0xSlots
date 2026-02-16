# @0xslots/sdk

## 0.3.0

### Minor Changes

- c66f1a8: Add flexible event queries and price update events
  - Make `getSlotCreatedEvents` accept optional parameters instead of requiring `landId`
  - Add `getPriceUpdates` query to fetch price update events
  - Update all event queries to support flexible filtering with optional `where`, `orderBy`, and `orderDirection` parameters

## 0.2.0

### Minor Changes

- 950fbc7: Initial release of @0xslots/sdk package
  - Type-safe GraphQL client for querying 0xSlots subgraph data
  - Generated from GraphQL schema with complete TypeScript support
  - Chain selection support (Base Sepolia)
  - Query methods for hub, lands, slots, and events
  - Built on graphql-request with GraphQL Code Generator
  - Full ESM support with tree-shaking
