# 0xSlots React Hooks — Abstraction Analysis

_Review of `apps/landing/src/hooks/` and patterns in the frontend, identifying what should move to `@0xslots/sdk/react` for external consumers._

---

## Current Hooks Inventory

| Hook | File | Purpose | SDK candidate? |
|------|------|---------|---------------|
| `useSlotsClient()` | `use-slots-client.ts` + `use-v3.ts` (duplicate!) | Create `SlotsClient` from wagmi providers | ✅ Already in SDK as `useSlotsClient` |
| `useSlotAction()` | `use-slot-action.ts` | Unified write executor with pending/toast/receipt tracking | ✅ Strong candidate |
| `useSlotOnChain()` | `use-slot-onchain.ts` | Single slot RPC read (getSlotInfo + currency metadata) | ✅ Strong candidate |
| `useSlotsOnChain()` | `use-slot-onchain.ts` | Multi-slot RPC read via multicall | ✅ Strong candidate |
| `useCurrencyBalance()` | `use-currency-balance.ts` | ERC-20 balance for connected wallet | ⚠️ Maybe (generic, but useful) |
| `useSlots()` | `use-v3.ts` | Subgraph: paginated slots with filters | ✅ Strong candidate |
| `useSlot()` | `use-v3.ts` | Subgraph: single slot by ID | ✅ Strong candidate |
| `useSlotsByRecipient()` | `use-v3.ts` | Subgraph: slots filtered by recipient | ✅ Strong candidate |
| `useSlotsByOccupant()` | `use-v3.ts` | Subgraph: slots filtered by occupant | ✅ Strong candidate |
| `useFactory()` | `use-v3.ts` | Subgraph: factory stats | ✅ |
| `useModules()` | `use-v3.ts` | Subgraph: registered modules | ✅ |
| `useSlotActivity()` | `use-v3.ts` | Subgraph: all event types for a slot | ✅ |
| `useRecentEvents()` | `use-v3.ts` | Subgraph: recent global events | ✅ |
| `useAccounts()` | `use-v3.ts` | Subgraph: top accounts by slot count | ✅ |
| `useSlotPurchases()` | `use-v3.ts` | Subgraph: buy events for a slot | ✅ |
| `useSlotsettlements()` | `use-v3.ts` | Subgraph: settled events for a slot | ✅ |
| `useSlotTaxCollections()` | `use-v3.ts` | Subgraph: tax collected events | ✅ |
| `useIPFSUpload()` | `use-upload.ts` | IPFS upload via API endpoint | ❌ App-specific (needs backend) |
| `useSplitClient()` | `use-split-client.ts` | 0xSplits SDK integration | ❌ External dependency |
| `slotQueryOptions()` | `slot-queries.ts` | TanStack Query options (server+client) | ✅ Strong candidate |

---

## Recommended `@0xslots/sdk/react` Entrypoint

### Tier 1 — Must Have (core abstractions any client needs)

#### 1. `useSlotsClient(chainId?)` — Already exists but duplicated
- SDK has `useSlotsClient` in `react.ts` already
- Landing app has TWO versions: `hooks/use-slots-client.ts` and inside `use-v3.ts`
- **Action:** Dedupe. Single source in SDK, app imports from `@0xslots/sdk/react`

#### 2. `useSlotAction()` — The big one
This is the most valuable abstraction. It wraps every write method with:
- Pending state tracking (`isPending`, `isConfirming`, `busy`)
- Active action label (`activeAction`) for UI feedback
- Toast notifications on success/error
- Transaction receipt tracking via `useWaitForTransactionReceipt`
- Generic `exec(label, fn)` pattern — extensible

**For SDK:** Make toast-agnostic (callback-based instead of hardcoded `sonner`):
```ts
useSlotAction({
  onSuccess?: (label: string, hash: Hash) => void,
  onError?: (label: string, error: string) => void,
})
```

#### 3. `useSlotOnChain(slotAddress)` — Real-time slot state
- Reads `getSlotInfo()` from RPC (not subgraph — no indexing lag)
- Auto-fetches currency metadata (name, symbol, decimals)
- Auto-invalidates on new blocks via `useInvalidateOnBlock()`
- Returns typed `SlotOnChain` object with computed fields (insolvent, secondsUntilLiquidation)

**For SDK:** This is essential for slot detail pages. Every client will need it.

#### 4. `useSlotsOnChain(slotAddresses[])` — Batch RPC read
- Multicall pattern for reading many slots at once
- Deduplicates currency metadata fetches
- Used for recipient pages (list all their slots with live data)

### Tier 2 — Should Have (subgraph query hooks)

All the `use-v3.ts` hooks are thin wrappers: `useSlotsClient()` → `client.getX()` → `useQuery()`.

**Pattern to extract:**
```ts
// Generic hook factory in SDK
function createSubgraphHook<TArgs, TData>(
  key: string,
  fetcher: (client: SlotsClient, args: TArgs) => Promise<TData>,
  options?: { staleTime?: number }
)
```

Or simpler — just export the hooks directly:
- `useSlots(filters?)` — with module/recipient/occupant filtering
- `useSlot(id)` 
- `useSlotsByRecipient(address)`
- `useSlotsByOccupant(address)`
- `useFactory()`
- `useModules()`
- `useSlotActivity(slotId)`
- `useRecentEvents()`
- `useAccounts()`

**Also export `slotQueryOptions()`** for SSR/RSC prefetching patterns.

### Tier 3 — Nice to Have

- `useCurrencyBalance(currency)` — Simple but saves boilerplate
- `useMetadataModule()` — Read/write metadata (from `modules/metadata.ts`)
- `useChain()` context + `ChainProvider` — Multi-chain selector pattern

---

## Key Patterns Worth Abstracting

### 1. Block-based Invalidation
```ts
// In use-slot-onchain.ts — invalidates all contract reads on every new block
function useInvalidateOnBlock() {
  const queryClient = useQueryClient();
  const { data: blockNumber } = useBlockNumber({ watch: true });
  useEffect(() => {
    if (blockNumber) {
      queryClient.invalidateQueries({ queryKey: ["readContract"] });
    }
  }, [blockNumber, queryClient]);
}
```
This is critical for real-time UX. Should be exported or built into the hooks.

### 2. Server/Client Query Options
```ts
// slot-queries.ts — works both SSR and client-side
export function slotQueryOptions(chainId, id) {
  return queryOptions({
    queryKey: ["slot", chainId, id],
    queryFn: async () => { /* ... */ },
    staleTime: 10_000,
  });
}
```
This pattern enables Next.js `prefetchQuery` on the server + `useSuspenseQuery` on the client. Very valuable for SSR apps.

### 3. Event Normalization
```ts
// lib/normalize-events.ts
normalizeEvents(data) → UnifiedEvent[]
```
Takes raw subgraph multi-event response → flat sorted array with human-readable labels. Every frontend needs this.

### 4. Price/Amount Formatting
```ts
// utils.ts
formatAmount(raw, decimals) → string  // "1.5" or "<0.0001"
toRawUnits(value, decimals) → bigint  // "1.5" → 1500000n
formatDuration(seconds) → string       // "2d 5h"
formatBps(bps) → string               // "5%"
```

---

## Duplications / Tech Debt

1. **`useSlotsClient` is defined THREE times:**
   - `packages/sdk/src/react.ts` (the SDK version)
   - `apps/landing/src/hooks/use-slots-client.ts`
   - `apps/landing/src/hooks/use-v3.ts` (inline)
   - **Fix:** Single export from SDK, app uses it

2. **ChainContext is app-specific but the pattern is universal.**
   SDK could export a `SlotsProvider` that wraps `ChainProvider` + wagmi config.

3. **`useIPFSUpload` calls a legacy adland API endpoint** — needs its own backend route or a Pinata/web3.storage integration.

---

## Proposed SDK React API Surface

```ts
// @0xslots/sdk/react

// Core
export { useSlotsClient } from "./hooks/use-slots-client";
export { useSlotAction } from "./hooks/use-slot-action";

// RPC reads (real-time)
export { useSlotOnChain } from "./hooks/use-slot-onchain";
export { useSlotsOnChain } from "./hooks/use-slots-onchain";
export { useCurrencyBalance } from "./hooks/use-currency-balance";

// Subgraph reads
export { useSlots, useSlot, useSlotsByRecipient, useSlotsByOccupant } from "./hooks/use-slots";
export { useFactory, useModules, useAccounts } from "./hooks/use-protocol";
export { useSlotActivity, useRecentEvents } from "./hooks/use-events";

// Query options (for SSR prefetching)
export { slotQueryOptions, slotsByRecipientQueryOptions, slotActivityQueryOptions } from "./queries";

// Utilities
export { normalizeEvents, type UnifiedEvent } from "./lib/normalize-events";
export { formatAmount, formatDuration, formatBps, toRawUnits, truncateAddress } from "./utils";

// Types
export type { SlotOnChain } from "./hooks/use-slot-onchain";
export type { SlotFilters } from "./hooks/use-slots";
```

### Peer Dependencies for React Entrypoint
```json
{
  "react": ">=18",
  "wagmi": ">=2",
  "@tanstack/react-query": ">=5",
  "viem": ">=2"
}
```

---

## Implementation Priority

1. **Dedupe `useSlotsClient`** — immediate win, remove the 2 app copies
2. **Extract `useSlotAction`** — highest value, most boilerplate saved for clients
3. **Extract `useSlotOnChain` / `useSlotsOnChain`** — essential for any detail page
4. **Move subgraph query hooks** — straightforward, just needs ChainContext abstraction
5. **Export utilities** — `normalizeEvents`, formatters, `slotQueryOptions`
6. **`SlotsProvider`** — ChainContext + wagmi config wrapper (optional convenience)
