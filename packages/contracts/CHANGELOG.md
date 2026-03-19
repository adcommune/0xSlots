# @0xslots/contracts

## 0.6.1

### Patch Changes

- 8659e51: fresh deploy on testnets

## 0.6.0

### Minor Changes

- 64d821b: Fresh testnet deployment

## 0.5.1

### Patch Changes

- 34c4ec8: Add `client.modules.metadata` namespace to SDK for MetadataModule read/write operations. Includes subgraph queries for MetadataSlot entities, RPC `getURI()`, and `updateMetadata()` write. Export `metadataModuleAddress` and `getMetadataModuleAddress()` from contracts package.

## 0.5.0

### Minor Changes

- c453c38: add write methods to sdk

## 0.4.0

### Minor Changes

- 037b454: v3 update

## 0.3.0

### Minor Changes

- e30c844: add arb
- 56f8181: Add arbitrum

## 0.2.0

### Minor Changes

- 34542fa: Initial release of @0xslots/contracts package
  - Export slotsAbi and slotsHubAbi for use with viem
  - Export slotsHubAddress with helper functions (getSlotsHubAddress, isSlotsHubDeployed)
  - Support for Base Sepolia (chain ID 84532)
  - TypeScript support with full type definitions
  - ESM module format with tree-shaking support
