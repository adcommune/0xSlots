# FeedHub / Feed — on-chain feeds for 0xSlots (Phase 1)

Date: 2026-07-12
Status: Draft for review
Repo: 0xSlots (contracts + SDK), consumed by thefeed web app

## 1. Problem & goal

Today "the feed" is a hardcoded list of slot addresses in the web app
(`thefeed/apps/web/src/lib/feed.ts`: `feedSlots[chainId]` = 42 addresses, plus
`feedRecipients[chainId]`). This was fine for a demo but we want the feed itself
to be an **on-chain object**: the app should read which slots are in a feed (and
the feed's treasury recipient + metadata) from a contract.

We also want this to be **multi-tenant and deployable**: eventually anyone can
deploy their own feed. So we build a factory now (`FeedHub`) that mints
**beacon-upgradeable** `Feed` contracts, and the app defaults to **feed #0**.

### Goals
- A `Feed` contract: owner-curated ordered slot list + on-chain `name` +
  updateable `metadataURI` + a declared, updateable `feedRecipient()`.
- A `FeedHub` factory/registry that deploys beacon-proxy `Feed`s and enumerates
  them (`feeds(index)`, `feedCount()`), owning the upgrade beacon.
- SDK read methods + `feedHubAddress` in `packages/contracts/addresses.ts`.
- Migrate thefeed to read feed #0 instead of the hardcoded list.

### Non-goals (deferred)
- Permissionless `createFeed` (Phase 1 = hub-owner only). — Phase 2
- Per-feed slot **management** / the group-owned-slot ownership model. — Phase 2
- Subgraph indexing of feeds; deploy-your-own-feed UI. — Phase 2/3
- Any change to `Slot.sol`, `SlotFactory`, `FeedSocialGroup`, `FeedRouter`, or
  the existing 0xSlots UI. **This design is strictly additive.**

## 2. Key decisions (locked)

1. **Feed never custodies funds.** Per review feedback, the Feed is *not* the tax
   recipient. It exposes `feedRecipient()` — an access-controlled, updateable
   address it merely *declares*. Slots are created pointing their `recipient` at
   that address (a treasury/EOA/multisig). This removes the fund-handling risk.
2. **Recipient is snapshotted at slot creation.** Because we do not touch
   `Slot.sol`, a slot stores its `recipient` at creation time. Reading
   `feedRecipient()` at creation and setting `slot.recipient` to it means
   updating `feedRecipient()` later affects *new* slots only, not existing ones.
3. **Membership is explicit.** A slot joins a feed when the feed owner calls
   `addSlot(slot)`. The Feed does not deploy slots; slots are created via the
   existing `SlotFactory`. `addSlot` validates via `SlotFactory.isSlot(slot)`.
4. **Two distinct authorities:**
   - **FeedHub owner** — controls the beacon (implementation upgrades for all
     feeds) and (Phase 1) who may `createFeed`.
   - **Feed owner** — the deployer of a feed; curates *its* slots and sets *its*
     name / URI / recipient. Cannot touch other feeds or the implementation.
5. **Beacon (not UUPS) for `Feed`.** All `Feed` proxies share one implementation
   via an `UpgradeableBeacon`; one upgrade updates every feed. (FeedSocialGroup
   uses UUPS; feeds are many instances, so a beacon fits better.)
6. **App default = feed #0.** thefeed reads `FeedHub.feeds(0)`.

## 3. Architecture

```
FeedHub (Ownable)                      packages/contracts/addresses.ts -> feedHubAddress
 ├─ owns UpgradeableBeacon ── impl ──> Feed (implementation, Initializable + Ownable)
 ├─ feeds: address[]  (enumerable: feeds(i), feedCount())
 └─ createFeed(owner,name,uri,recipient) -> BeaconProxy(beacon) -> Feed.initialize(...)

Feed (BeaconProxy)  implements IFeed
 ├─ owner (feed deployer)
 ├─ name, metadataURI            (owner-updateable)
 ├─ feedRecipient()              (owner-updateable declared address; NOT custody)
 └─ slots: address[]             (owner: addSlot/removeSlot/reorder; getSlots view)

App read path:  FeedHub.feeds(0) -> Feed.getSlots() / feedRecipient() / name() / metadataURI()
```

### 3.1 `IFeed` (the enforced interface)
```solidity
interface IFeed {
    function name() external view returns (string memory);
    function metadataURI() external view returns (string memory);
    function feedRecipient() external view returns (address);
    function getSlots() external view returns (address[] memory);
    function slotCount() external view returns (uint256);
    function containsSlot(address slot) external view returns (bool);
}
```

### 3.2 `Feed` (implementation behind a beacon proxy)
- Inherits OZ `Initializable`, `OwnableUpgradeable`.
- `initialize(address owner_, string name_, string metadataURI_, address recipient_)`
  — sets owner, name, URI, recipient; called by FeedHub via the proxy.
- Owner-only mutators: `setName`, `setMetadataURI`, `setFeedRecipient`,
  `addSlot(address)`, `addSlots(address[])`, `removeSlot(address)`,
  `setSlots(address[])` (reorder/replace).
- `addSlot` validates `ISlotFactory(factory).isSlot(slot)` and rejects
  duplicates. Storage: `address[] slots` + `mapping(address => uint256) index1`
  (1-based) for O(1) contains/remove (swap-and-pop).
- Views per `IFeed`. Emits `SlotAdded`, `SlotRemoved`, `NameUpdated`,
  `MetadataURIUpdated`, `RecipientUpdated`.
- Holds the `SlotFactory` address (passed at init or read from FeedHub) for
  `isSlot` validation.

### 3.3 `FeedHub` (factory + registry)
- Inherits OZ `Ownable`.
- Constructor deploys the `Feed` implementation + an `UpgradeableBeacon` it owns
  (or takes a pre-deployed impl/beacon — decide at build).
- `createFeed(address owner_, string name_, string uri_, address recipient_)
  returns (address feed, uint256 index)` — deploys `BeaconProxy`, calls
  `Feed.initialize`, pushes to `feeds`, emits `FeedCreated(index, feed, owner_)`.
  Phase 1: `onlyOwner`. (Phase 2: gate becomes a `permissionless` toggle.)
- Enumeration: `feeds(uint256) view`, `feedCount() view`, `beacon() view`,
  `implementation() view`.
- Upgrade: `upgradeFeedImplementation(address newImpl) onlyOwner` -> beacon.
- Owner set at deploy: testnet/develop = `0x4D5BA70D2f7bD991BF09A5979e5F5e7dCAD04679`
  (apps/contracts/.env `PK`); mainnet later = `ASTROBLOCK_ADMIN`
  (`0xe7e37649f37Ed6665260316413fdfe89f8edadb6`; recommend a multisig eventually).

## 4. Deployment & migration

Foundry script `script/DeployFeedHub.s.sol` per chain (base, baseSepolia):
1. Deploy `Feed` implementation.
2. Deploy `UpgradeableBeacon(impl)` owned by FeedHub (or hub owner).
3. Deploy `FeedHub(beacon, owner=PK/ASTROBLOCK_ADMIN)`.
4. `createFeed(owner, name, metadataURI, recipient)` for **feed #0**, seeded with:
   - name: "The Open Feed" (mainnet) / "The Testnet Feed" (baseSepolia)
   - metadataURI: `""` (empty string for now; set later)
   - recipient: current `feedRecipients[chainId]`
     (baseSepolia `0xfafad841f9323295aad9d2de785bb5aecaeb70d3`,
      base `0x54d023fde5173bec84d59affb0eec5a711ec6630`)
   - slots: the current 42 addresses from `feed.ts` `feedSlots[chainId]`, in order.

Record deployed `feedHubAddress` per chain in `packages/contracts/addresses.ts`.

## 5. SDK changes (`@0xslots/*`)

- `packages/contracts/addresses.ts`: add `feedHubAddress` (base + baseSepolia).
- `packages/contracts/src/abis`: add `feedHubAbi`, `feedAbi`; export `IFeed` type.
- `packages/sdk`: read methods (direct RPC via viem multicall in Phase 1; no
  subgraph dependency):
  - `getFeedHub()` -> { address, owner, feedCount }
  - `listFeeds()` -> Array<{ index, address }>
  - `getFeed(indexOrAddress)` -> { address, owner, name, metadataURI, recipient, slots: address[] }
  - convenience `getDefaultFeed()` = `getFeed(0)`.
  - (Optional) write helpers `createFeed`, `feed.addSlot`, `feed.setMetadataURI`, etc.

## 6. thefeed app migration

The single seam is `apps/web/src/lib/feed.ts`. `activeFeedSlots` / `feedRecipients`
are currently synchronous module constants used both server-side (API routes,
`lib/slots`) and in client components. Source of truth becomes the contract,
resolved at **build time**, with a clean path to runtime-dynamic later.

**Build-time codegen (Phase 1).**
- A prebuild script (e.g. `scripts/gen-feed.ts`, wired to `prebuild`) reads
  `FeedHub.feeds(0)` -> `Feed.getSlots()` + `feedRecipient()` + `name` /
  `metadataURI` for the active chain, and writes
  `apps/web/src/lib/feed.generated.ts` (an ordered `Address[]` + recipient +
  name/uri).
- `feed.ts` re-exports from the generated file where it exports `activeFeedSlots`
  / `activeFeedRecipient` today, keyed by `activeChainId`. **The 13 consumers
  stay synchronous** — the only real change is the *source* of the constant. No
  slot addresses are hand-written anymore; they come from the contract.
- **Ordering preserved:** `getSlots()` array order = the slot numbering
  (`ModeSelect` / `PostfillModeSelect` compute slot # via `findIndex`).
- **Ordering of operations:** contracts deployed + feed #0 seeded BEFORE the app
  build (deploy -> codegen -> build). A failed contract read fails the build
  loudly — better than a silent blank feed at runtime.
- The generated file is git-ignored (or committed as a snapshot — decide at
  build); regenerated each build so it always reflects on-chain state.

**Future dynamic (Phase 2, drop-in).** Replace the generated-constant import
with a runtime read behind the same seam: server `unstable_cache(getDefaultFeed,
{ revalidate })` (ISR) and/or a `useDefaultFeed()` client hook. Because the
consumer interface is unchanged, this is a later swap, not a rewrite.

13 direct consumers (unchanged by Phase 1 beyond the constant's origin, from the
app audit): API routes `feed`, `feed/updates`, `explorer`, `treasury`,
`cheapest-slot`; hooks/components `use-slot-rows`, `use-slot-actions`,
`SlotStep`, `ModeSelect`, `PostfillModeSelect`, `create/loaders`,
`ProfileContent`, `TreasuryTab`.

## 7. Security considerations
- **No fund custody in Feed** (recipient is a declared address only).
- **Beacon upgrade authority** is the single most powerful key (can change all
  feeds' logic). Testnet: PK. Mainnet: ASTROBLOCK_ADMIN now; move to a multisig.
- `addSlot` validates `SlotFactory.isSlot` to prevent junk/hostile entries.
- Bound slot-list gas (swap-and-pop remove; consider a max slot count).
- Use OZ audited `UpgradeableBeacon` / `BeaconProxy` / `OwnableUpgradeable`.
- Run the security/audit skills on the new contracts before mainnet.
- Additive only: existing contracts/UI untouched -> no regression surface.

## 8. Testing (Foundry)
- FeedHub: createFeed (owner-only), enumeration correctness, beacon upgrade
  changes all proxies, access-control negatives.
- Feed: initialize once, owner-gated setters, addSlot isSlot-validation +
  dedupe, remove (swap-and-pop) preserves invariants, getSlots ordering,
  recipient/name/URI updates emit + read back.
- Integration: deploy hub -> createFeed #0 seeded -> read slots/recipient match
  the seed.

## 9. Decisions (resolved)
1. **metadataURI for feed #0** — `""` (empty) for now; set later. ✓
2. **SlotFactory reference in Feed** — FeedHub injects the chain's
   `slotFactoryAddress` at `createFeed`. ✓
3. **createFeed permissioning** — Phase 1 is hub-owner-only; permissionless
   deferred to Phase 2. ✓
4. **App list source** — build-time codegen from `FeedHub.feeds(0)` into
   `feed.generated.ts` (see §6); no hand-written addresses. Runtime-dynamic is a
   Phase 2 drop-in. ✓

## 10. Phasing
- **Phase 1 (this spec):** FeedHub + Beacon + Feed + IFeed, deploy script, seed
  feed #0 both chains, SDK reads + address, thefeed migration to feed #0.
- **Phase 2:** permissionless createFeed; per-feed slot management (resolves the
  group-owned-slot ownership model in multi-tenant form); subgraph indexing.
- **Phase 3:** deploy-your-own-feed UI.
- **Independent quick win (any time):** fix thefeed so group-owned-slot actions
  (self-assess/release/withdraw) route through the group's forwarders instead of
  calling the slot directly as the connected wallet (which reverts `NotOccupant`).
