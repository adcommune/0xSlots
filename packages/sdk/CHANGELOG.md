# @0xslots/sdk

## 0.10.1

### Patch Changes

- 0d3484f: centralized packages
- Updated dependencies [0d3484f]
  - @0xslots/contracts@0.7.1

## 0.10.0

### Minor Changes

- Add Base mainnet support and export React hooks from SDK

  **@0xslots/contracts:**
  - Add Base mainnet factory address (`0xbf2F890E8F5CCCB3A1D7c5030dBC1843B9E36B0e`)
  - Add Base chain to CHAINS array

  **@0xslots/sdk:**
  - Add `SlotsChain.BASE` (8453) with subgraph URL
  - New `@0xslots/sdk/react` entrypoint with wagmi-wired hooks:
    - `useSlotAction(callbacks?)` — unified write executor with pending/confirming/success state tracking
    - `useSlotOnChain(address, chainId)` — real-time RPC slot reads with auto block invalidation
    - `useSlotsOnChain(addresses[], chainId)` — batch multicall variant
    - `useSlotsClient(chainId?)` — memoized SlotsClient from wagmi providers
  - Export `SlotOnChain` and `SlotActionCallbacks` types

### Patch Changes

- Updated dependencies
  - @0xslots/contracts@0.7.0

## 0.9.2

### Patch Changes

- 894c0ee: include metadata module address in module methods

## 0.9.1

### Patch Changes

- 8659e51: fresh deploy on testnets
- Updated dependencies [8659e51]
  - @0xslots/contracts@0.6.1

## 0.9.0

### Minor Changes

- 64d821b: Fresh testnet deployment

### Patch Changes

- Updated dependencies [64d821b]
  - @0xslots/contracts@0.6.0

## 0.8.3

### Patch Changes

- 5d86bd9: Add `subgraphApiKey` option to SDK config. When provided, sends `Authorization: Bearer <key>` header on all subgraph queries. Update Base Sepolia subgraph URL to decentralized gateway.

## 0.8.2

### Patch Changes

- 34c4ec8: Add `client.modules.metadata` namespace to SDK for MetadataModule read/write operations. Includes subgraph queries for MetadataSlot entities, RPC `getURI()`, and `updateMetadata()` write. Export `metadataModuleAddress` and `getMetadataModuleAddress()` from contracts package.
- Updated dependencies [34c4ec8]
  - @0xslots/contracts@0.5.1

## 0.8.1

### Patch Changes

- ef795a9: add deployement events to sdk

## 0.8.0

### Minor Changes

- 5c27235: upgrade sdk

## 0.7.0

### Minor Changes

- c453c38: add write methods to sdk

### Patch Changes

- Updated dependencies [c453c38]
  - @0xslots/contracts@0.5.0

## 0.5.0

### Minor Changes

- 037b454: v3 update

## 0.4.0

### Minor Changes

- e30c844: add arb
- 56f8181: Add arbitrum

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
