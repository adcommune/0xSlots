# @0xslots/contracts

## 0.14.0

### Minor Changes

- fb5b9db: Point Base Sepolia at the canonical SlotFactoryV3.

  `slotFactoryAddress[baseSepolia.id]` was `0xc44De86e2A5f0C47f1Ba87C36DaBf54275814DEb`, an address recorded in no deployment file and indexed by no subgraph datasource. It has been that value since v0.7.1 (2026-03-22).

  The consequence was silent: creating a slot on Base Sepolia through the SDK succeeded on-chain and emitted a valid `SlotDeployed` event, but the subgraph never saw it, so the slot was invisible to every consumer — no error, no failed transaction, just a slot that never appeared. Base was unaffected, since its address already matched its deployment record.

  It now points at `0x6D87C1647f228Baf8DE0374FCd7FdEBF6900fdFF`, matching `apps/contracts/deployments/84532/SlotFactoryV3.json` and the `factory2Address` datasource in `packages/subgraph/config/base-sepolia.json`.

  **Slots created on Base Sepolia since 2026-03-22 remain unindexed** and will not appear after this change; they were created through the orphaned factory. Recreate them to have them indexed.

## 0.13.4

### Patch Changes

- 2ffaa38: FeedHub is now a UUPS-upgradeable proxy with pricing: admin-set `feeRecipient` / `feedCreationPrice` / `slotPrice`, payable `createFeed` (first 10 slots included in the creation price, extras at slotPrice each), payable `addSlots` (feed owner, slotPrice/slot), and `withdraw()` to the fee recipient. `Feed` mints its initial tiers during `initialize`, and slot-minting is hub-gated. Repointed `feedHubAddress` (Base Sepolia) at the new UUPS proxy `0xE4c0c374E3233b5174a1600AF1321cDa9b6B5cF8`.

## 0.13.3

### Patch Changes

- e950731: `FeedHub.createFeed` is now permissionless — anyone can deploy a Feed and becomes its owner (the hub owner still controls only beacon upgrades). Added `Feed.removeSlot(address)` (owner-only, order-preserving delist; the Slot contract itself is untouched). Repointed `feedHubAddress` (Base Sepolia) at the redeployed hub `0xf732cc00640BC7fC7802DDf969c76BcAEaF51Af1` (Feed #0 = 41 slots).

## 0.13.2

### Patch Changes

- 9815e1c: FeedHub now deploys Feeds whose owner mints slots incrementally via `Feed.createSlots(SlotTier[])` — each minted slot carries the FeedPostModule (injected, immutable) and is module-verified; arbitrary addresses can never be added. Batched minting keeps each tx under RPC gas caps, so feeds can hold many slots. Point `feedHubAddress` (Base Sepolia) at the redeployed hub `0xC3bE9AB91A57Dc8eb640Eb27B40833A1a4dB5bf9`; Feed #0 ("The Testnet Feed") has 41 module-verified slots across a 6-tier tax ladder with per-tier liquidation bounty and min-deposit.

## 0.13.1

### Patch Changes

- 24fa98d: Point `feedHubAddress` (Base Sepolia) at the redeployed FeedHub (`0x36a5aedd3256CA750c44D71A0aFB663453Bb62B7`). The v2 FeedHub mints each feed's slots via the SlotFactory with the FeedPostModule attached and verifies the module on every slot, instead of accepting slot addresses. Feed #0 now has 10 module-verified slots across the tax-tier ladder.

## 0.13.0

### Minor Changes

- 95c954c: Add `feedHubAddress` export for the new FeedHub/Feed on-chain feed registry. FeedHub is deployed on Base Sepolia (`0x3B5eC015339b654F1220C32a5D29679C527Fb3B7`) with feed #0 ("The Testnet Feed") seeded from the curated 42-slot list. Base (mainnet) deploy is pending.
- bc91033: update

## 0.12.0

### Minor Changes

- 6156afc: feat: include slot managing methods to sdk for social groups in feed and isOccupied bool prop for slots

## 0.11.0

### Minor Changes

- a0a9e54: feat: add social group contracts & methods

## 0.10.0

### Minor Changes

- 5434154: add events & new router addresses

## 0.9.1

### Patch Changes

- bd5779e: add collectAll to factory

## 0.9.0

### Minor Changes

- 5ed4d22: include feed router & feed module functions to 0xSlots sdks

## 0.8.1

### Patch Changes

- ddc11a7: adding feeBps & feeRecipient to modules

## 0.8.0

### Minor Changes

- 2e92125: update buy function args

## 0.7.1

### Patch Changes

- 0d3484f: centralized packages

## 0.7.0

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
