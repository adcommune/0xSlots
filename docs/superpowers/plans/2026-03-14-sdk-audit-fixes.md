# SDK Audit Fixes Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the SDK with proper JSDoc documentation, input validation, safe property access, and better error context — without changing runtime behavior for valid inputs.

**Architecture:** All changes are in `packages/sdk/src/client.ts` and `packages/sdk/src/react.ts`. We add a small `errors.ts` helper for consistent error wrapping, JSDoc on every public method, validation guards on write methods, and replace unsafe `!` assertions with the existing safe `account` getter. No new dependencies.

**Tech Stack:** TypeScript, viem, graphql-request

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `packages/sdk/src/errors.ts` | Create | Custom error class + query wrapper |
| `packages/sdk/src/client.ts` | Modify | JSDoc, validation, safe accessors, error wrapping |
| `packages/sdk/src/react.ts` | Modify | JSDoc, stable deps |
| `packages/sdk/src/index.ts` | Modify | Re-export error class |

---

## Task 1: Create error helper

**Files:**
- Create: `packages/sdk/src/errors.ts`

- [ ] **Step 1: Create `errors.ts`**

```ts
/** Error thrown by SlotsClient operations, wrapping the original cause with operation context. */
export class SlotsError extends Error {
  constructor(
    public readonly operation: string,
    cause: unknown,
  ) {
    const msg = cause instanceof Error ? cause.message : String(cause);
    super(`${operation}: ${msg}`);
    this.name = "SlotsError";
    this.cause = cause;
  }
}
```

- [ ] **Step 2: Re-export from `index.ts`**

Add to `packages/sdk/src/index.ts`:
```ts
export { SlotsError } from "./errors";
```

- [ ] **Step 3: Build and verify**

Run: `cd packages/sdk && pnpm build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add packages/sdk/src/errors.ts packages/sdk/src/index.ts
git commit -m "feat(sdk): add SlotsError class for operation context"
```

---

## Task 2: JSDoc on all public methods + accessors

**Files:**
- Modify: `packages/sdk/src/client.ts`

Add JSDoc to every public method. The query methods are pass-throughs to the generated SDK, so their docs should describe what they fetch. Write methods already have partial docs — expand with `@param`, `@returns`, and `@throws`.

- [ ] **Step 1: Add JSDoc to constructor and accessors**

```ts
/**
 * Client for reading and writing 0xSlots protocol data.
 *
 * Reads come from a Graph Protocol subgraph (via graphql-request).
 * Writes go through a viem WalletClient and handle ERC-20 approvals automatically.
 *
 * @example
 * ```ts
 * const client = new SlotsClient({
 *   chainId: SlotsChain.ARBITRUM,
 *   publicClient,
 *   walletClient,
 * });
 * const slots = await client.getSlots({ first: 10 });
 * ```
 */
```

On `getChainId`:
```ts
/** Returns the chain ID this client was configured for. */
```

On `getClient`:
```ts
/** Returns the underlying GraphQL client (for advanced usage). */
```

On `getSdk`:
```ts
/** Returns the generated GraphQL SDK (for queries not wrapped by this client). */
```

- [ ] **Step 2: Add JSDoc to all query methods**

Each query method gets a one-liner. Examples:

```ts
/** Fetch a paginated list of slots. */
getSlots(...)

/** Fetch a single slot by its address. */
getSlot(...)

/** Fetch all slots owned by a given recipient address. */
getSlotsByRecipient(...)

/** Fetch all slots currently occupied by a given address. */
getSlotsByOccupant(...)

/** Fetch factory configuration. */
getFactory()

/** Fetch registered modules. */
getModules(...)

/** Fetch bought events with optional filters. */
getBoughtEvents(...)

/** Fetch settled events with optional filters. */
getSettledEvents(...)

/** Fetch tax-collected events with optional filters. */
getTaxCollectedEvents(...)

/** Fetch all activity for a specific slot (all event types). */
getSlotActivity(...)

/** Fetch the most recent events across all slots. */
getRecentEvents(...)

/** Fetch a single account by address. */
getAccount(...)

/** Fetch a paginated list of accounts. */
getAccounts(...)

/** Fetch released events with optional filters. */
getReleasedEvents(...)

/** Fetch liquidated events with optional filters. */
getLiquidatedEvents(...)

/** Fetch deposited events with optional filters. */
getDepositedEvents(...)

/** Fetch withdrawn events with optional filters. */
getWithdrawnEvents(...)

/** Fetch price-updated events with optional filters. */
getPriceUpdatedEvents(...)

/** Fetch subgraph indexing metadata (latest block, indexing errors). */
getMeta()
```

- [ ] **Step 3: Expand JSDoc on write methods**

Replace existing one-liners with full JSDoc including `@param`, `@returns`, `@throws`:

```ts
/**
 * Create a new slot via the factory contract.
 * @param params - Slot creation parameters (recipient, currency, config, init params).
 * @returns Transaction hash.
 * @throws {SlotsError} If the transaction fails.
 */
createSlot(...)

/**
 * Create multiple slots in a single transaction via the factory.
 * @param params - Same as createSlot plus a `count` field.
 * @returns Transaction hash.
 * @throws {SlotsError} If the transaction fails.
 */
createSlots(...)

/**
 * Buy a slot (or force-buy an occupied one). Handles ERC-20 approval automatically.
 * If the wallet supports EIP-5792 atomic batching, approval and buy are sent as one call.
 * @param params - Slot address, deposit amount, and self-assessed price.
 * @returns Transaction hash.
 * @throws {SlotsError} If approval or buy fails.
 */
buy(...)

/**
 * Set a new self-assessed price (occupant only).
 * @param slot - Slot contract address.
 * @param newPrice - New price in currency wei.
 * @returns Transaction hash.
 */
selfAssess(...)

/**
 * Top up deposit on a slot (occupant only). Handles ERC-20 approval automatically.
 * @param slot - Slot contract address.
 * @param amount - Amount to add to deposit in currency wei.
 * @returns Transaction hash.
 */
topUp(...)

/**
 * Withdraw from deposit (occupant only). Cannot withdraw below minimum deposit.
 * @param slot - Slot contract address.
 * @param amount - Amount to withdraw in currency wei.
 * @returns Transaction hash.
 */
withdraw(...)

/**
 * Release a slot, returning the remaining deposit to the occupant.
 * @param slot - Slot contract address.
 * @returns Transaction hash.
 */
release(...)

/**
 * Collect accumulated tax from a slot (permissionless — anyone can call).
 * @param slot - Slot contract address.
 * @returns Transaction hash.
 */
collect(...)

/**
 * Liquidate an insolvent slot (permissionless). Caller receives the liquidation bounty.
 * @param slot - Slot contract address.
 * @returns Transaction hash.
 */
liquidate(...)

/**
 * Propose a new tax rate (manager only, slot must have mutableTax flag).
 * @param slot - Slot contract address.
 * @param newPct - New tax percentage (in basis points × 100, e.g. 500 = 5%).
 * @returns Transaction hash.
 */
proposeTaxUpdate(...)

/**
 * Propose a new module (manager only, slot must have mutableModule flag).
 * @param slot - Slot contract address.
 * @param newModule - Address of the new module contract.
 * @returns Transaction hash.
 */
proposeModuleUpdate(...)

/**
 * Cancel any pending tax or module update proposals (manager only).
 * @param slot - Slot contract address.
 * @returns Transaction hash.
 */
cancelPendingUpdates(...)

/**
 * Set the liquidation bounty in basis points (manager only).
 * @param slot - Slot contract address.
 * @param newBps - Bounty in basis points (0–10000).
 * @returns Transaction hash.
 */
setLiquidationBounty(...)

/**
 * Batch multiple slot function calls into a single multicall transaction.
 * @param slot - Slot contract address.
 * @param calls - Array of function calls with name and arguments.
 * @returns Transaction hash.
 */
multicall(...)
```

- [ ] **Step 4: Build and verify**

Run: `cd packages/sdk && pnpm build`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add packages/sdk/src/client.ts
git commit -m "docs(sdk): add JSDoc to all public methods"
```

---

## Task 3: Replace unsafe `!` assertions with safe `account` getter

**Files:**
- Modify: `packages/sdk/src/client.ts`

The class already has a safe `account` getter and safe `wallet` getter. But every `writeContract` call uses `this.wallet.account!` and `this.wallet.chain!` directly. Replace all of them.

- [ ] **Step 1: Add a safe `chain` getter**

After the existing `account` getter (line ~140), add:

```ts
private get chain() {
  const chain = this.wallet.chain;
  if (!chain) throw new Error("WalletClient must have a chain");
  return chain;
}
```

- [ ] **Step 2: Replace all `this.wallet.account!` with `this.wallet.account` and `this.wallet.chain!` with `this.chain`**

In every `writeContract` call (14 occurrences), change:
```ts
account: this.wallet.account!,
chain: this.wallet.chain!,
```
to:
```ts
account: this.account,
chain: this.chain,
```

Note: `this.account` returns `Address` (the string), but `writeContract` accepts both `Account | Address`. This is fine.

Do the same in `withAllowance` for the `sendCalls` and sequential approval paths.

- [ ] **Step 3: Build and verify**

Run: `cd packages/sdk && pnpm build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add packages/sdk/src/client.ts
git commit -m "fix(sdk): replace unsafe non-null assertions with validated getters"
```

---

## Task 4: Add input validation to write methods

**Files:**
- Modify: `packages/sdk/src/client.ts`

Add validation guards at the top of each write method. These throw immediately on invalid input rather than letting the contract call fail with a cryptic error.

- [ ] **Step 1: Add a validation helper (private, top of class body)**

```ts
private assertPositive(value: bigint, name: string): void {
  if (value <= 0n) throw new SlotsError(name, `${name} must be > 0`);
}
```

Import `SlotsError` at the top of the file.

- [ ] **Step 2: Add validation to each write method**

```ts
// buy()
async buy(params: BuyParams): Promise<Hash> {
  this.assertPositive(params.depositAmount, "depositAmount");
  this.assertPositive(params.selfAssessedPrice, "selfAssessedPrice");
  // ... rest unchanged
}

// topUp()
async topUp(slot: Address, amount: bigint): Promise<Hash> {
  this.assertPositive(amount, "amount");
  // ... rest unchanged
}

// withdraw()
async withdraw(slot: Address, amount: bigint): Promise<Hash> {
  this.assertPositive(amount, "amount");
  // ... rest unchanged
}

// selfAssess() - price can be 0 (releasing effectively), so skip validation

// setLiquidationBounty()
async setLiquidationBounty(slot: Address, newBps: bigint): Promise<Hash> {
  if (newBps < 0n || newBps > 10000n)
    throw new SlotsError("setLiquidationBounty", "newBps must be 0–10000");
  // ... rest unchanged
}

// multicall()
async multicall(slot: Address, calls: { functionName: string; args?: any[] }[]): Promise<Hash> {
  if (calls.length === 0)
    throw new SlotsError("multicall", "calls array must not be empty");
  // ... rest unchanged
}
```

- [ ] **Step 3: Build and verify**

Run: `cd packages/sdk && pnpm build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add packages/sdk/src/client.ts
git commit -m "feat(sdk): add input validation to write methods"
```

---

## Task 5: Wrap query methods with error context

**Files:**
- Modify: `packages/sdk/src/client.ts`

Wrap each query method so GraphQL errors include the operation name.

- [ ] **Step 1: Add a private query helper**

```ts
private async query<T>(operation: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    throw new SlotsError(operation, error);
  }
}
```

- [ ] **Step 2: Wrap all query methods**

Change each query method from:
```ts
getSlots(...args: Parameters<ReturnType<typeof getSdk>["GetSlots"]>) {
  return this.sdk.GetSlots(...args);
}
```
to:
```ts
getSlots(...args: Parameters<ReturnType<typeof getSdk>["GetSlots"]>) {
  return this.query("getSlots", () => this.sdk.GetSlots(...args));
}
```

Apply to all 17 query methods + `getMeta`.

- [ ] **Step 3: Build and verify**

Run: `cd packages/sdk && pnpm build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add packages/sdk/src/client.ts
git commit -m "feat(sdk): wrap queries with SlotsError for operation context"
```

---

## Task 6: Fix React hook

**Files:**
- Modify: `packages/sdk/src/react.ts`

- [ ] **Step 1: Add JSDoc and fix the type assertion**

```ts
import { type SupportedChainId, slotFactoryAddress } from "@0xslots/contracts";
import { useMemo } from "react";
import { usePublicClient, useWalletClient } from "wagmi";
import { type SlotsChain, SlotsClient } from "./client";

/**
 * React hook that creates a memoized {@link SlotsClient} from wagmi's public/wallet clients.
 *
 * @param chainId - Optional chain ID override. Defaults to the connected chain.
 * @returns A configured SlotsClient instance.
 * @throws If no public client is available or the chain has no factory address.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const client = useSlotsClient(SlotsChain.ARBITRUM);
 *   // use client.getSlots(), client.buy(), etc.
 * }
 * ```
 */
export function useSlotsClient(chainId?: SlotsChain): SlotsClient {
  const publicClient = usePublicClient({ chainId });
  const { data: walletClient } = useWalletClient({ chainId });

  return useMemo(() => {
    if (!publicClient) throw new Error("No publicClient available");
    const resolvedChainId = (chainId ?? publicClient.chain.id) as SlotsChain;
    const factoryAddress =
      slotFactoryAddress[resolvedChainId as SupportedChainId];
    if (!factoryAddress)
      throw new Error(`No factory address for chain ${resolvedChainId}`);

    return new SlotsClient({
      chainId: resolvedChainId,
      factoryAddress,
      publicClient,
      walletClient: walletClient ?? undefined,
    });
  }, [chainId, publicClient, walletClient]);
}
```

Key changes:
- Remove the double assertion `as unknown as SupportedChainId` → just `as SupportedChainId` (both are number enums, direct cast is safe)
- Add full JSDoc with example

- [ ] **Step 2: Build and verify**

Run: `cd packages/sdk && pnpm build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add packages/sdk/src/react.ts
git commit -m "docs(sdk): add JSDoc to useSlotsClient, fix type assertion"
```

---

## Task 7: Final build + typecheck

- [ ] **Step 1: Full build**

Run: `cd packages/sdk && pnpm build`
Expected: Build succeeds

- [ ] **Step 2: Typecheck the landing app**

Run: `cd apps/landing && pnpm tsc --noEmit`
Expected: No new errors (existing ones are OK)

- [ ] **Step 3: Final commit if any fixups needed**

---

## Out of Scope (noted, not addressed)

These were identified in the audit but intentionally excluded from this plan:

1. **Retry logic for network calls** — viem already retries RPC calls internally; graphql-request failures are transient and callers should handle retry at the application layer.
2. **Allowance race condition** — inherent to ERC-20 approve pattern; the only real fix is permit2, which is a separate feature.
3. **`_atomicSupport` cache invalidation** — wallets rarely change capabilities mid-session; a full fix would require event subscriptions from wallet extensions.
4. **Type-safe multicall** — would require complex TypeScript generics over the ABI tuple; `as any` is the pragmatic choice here since `encodeFunctionData` validates at runtime.
5. **React hook referential stability** — wagmi guarantees stable references for `publicClient`/`walletClient` within the same chain; this is a non-issue in practice.
