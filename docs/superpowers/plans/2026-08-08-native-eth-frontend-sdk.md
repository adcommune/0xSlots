# Native ETH — SDK, Subgraph and Explorer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make an ETH-denominated slot creatable from the form, tradeable through the SDK without an approval, and correctly rendered in the explorer.

**Architecture:** `currency == address(0)` is the native sentinel. One TypeScript definition in `packages/sdk/src/tokens.ts` serves the SDK and the app; the subgraph restates it because AssemblyScript cannot import TypeScript. The SDK's single approval choke point becomes a two-branch dispatcher — native attaches `value`, ERC-20 keeps approving.

**Tech Stack:** TypeScript, viem/wagmi, Next.js (App Router), The Graph (AssemblyScript mappings), tsup, vitest (introduced here).

**Spec:** [2026-08-08-native-eth-frontend-sdk-design.md](../specs/2026-08-08-native-eth-frontend-sdk-design.md)

## Global Constraints

- **All commands run from the repo root** (`/Users/nezzarkefif/Documents/GitHub/0xSlots`) using `pnpm --filter <pkg>`, unless a step says otherwise.
- **The contracts work must be merged first.** This plan depends on `buy`/`topUp` being `payable` on-chain. The branch is `feat/native-eth-slots`.
- **ABIs in `packages/contracts` are hand-maintained TypeScript.** There is no `@wagmi/cli`, no `forge inspect` pipeline, no codegen script. Edit `src/abis/slot.ts` directly.
- **The ERC-20 path must stay behaviourally identical** everywhere. Native is an added branch, never a rewrite of the existing one.
- **`packages/ponder` is out of scope.** It is `private` and no app imports it.
- **ETH is appended to `CHAIN_TOKENS`, never first.** `getDefaultToken` returns index 0 and USDC must stay the default.
- Verification commands per package: `pnpm --filter @0xslots/sdk typecheck`, `pnpm --filter @0xslots/contracts typecheck`, `pnpm --filter @0xslots/subgraph build`, `pnpm --filter landing build`.

---

### Task 1: Make the ABI accept value

Nothing else in this plan can work until viem knows `buy` and `topUp` are payable — it validates `stateMutability` before sending and will refuse to attach `value` to a `nonpayable` function.

**Files:**
- Modify: `packages/contracts/src/abis/slot.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `slotAbi` with `buy` and `topUp` as `stateMutability: "payable"`, plus `InvalidValue` and `TransferFailed` error entries.

- [ ] **Step 1: Flip `buy` to payable**

In `packages/contracts/src/abis/slot.ts`, find the entry with `name: "buy"`. Its three inputs are `account`, `depositAmount`, `selfAssessedPrice`. Change only its trailing `stateMutability`:

```ts
    outputs: [],
    stateMutability: "payable",
  },
```

Be careful: `stateMutability: "nonpayable"` appears dozens of times in this file. Match on the `buy` entry specifically, not with a global replace.

- [ ] **Step 2: Flip `topUp` to payable**

Find the entry with `name: "topUp"` — a single `amount` input. Change only its `stateMutability`:

```ts
    outputs: [],
    stateMutability: "payable",
  },
```

- [ ] **Step 3: Add the two new errors**

Add these alongside the other `type: "error"` entries:

```ts
  {
    type: "error",
    name: "InvalidValue",
    inputs: [],
  },
  {
    type: "error",
    name: "TransferFailed",
    inputs: [],
  },
```

- [ ] **Step 4: Verify the ABI matches the compiled contract**

This guards against hand-transcription drift. Run from the repo root:

```bash
cd apps/contracts && forge inspect Slot abi --json > /tmp/slot-abi.json && cd -
node -e '
const forge = require("/tmp/slot-abi.json");
const pick = (a, n) => a.find(e => e.type === "function" && e.name === n);
for (const n of ["buy", "topUp"]) {
  const m = pick(forge, n).stateMutability;
  console.log(n, "->", m);
  if (m !== "payable") { console.error("FAIL: forge says " + n + " is " + m); process.exit(1); }
}
const errs = forge.filter(e => e.type === "error").map(e => e.name);
for (const n of ["InvalidValue", "TransferFailed"]) {
  if (!errs.includes(n)) { console.error("FAIL: forge ABI missing error " + n); process.exit(1); }
}
console.log("OK: forge ABI agrees");
'
```

Expected: `buy -> payable`, `topUp -> payable`, `OK: forge ABI agrees`.

If this fails, the contracts branch is not merged or not built — stop and resolve that before continuing.

- [ ] **Step 5: Typecheck and build**

Run: `pnpm --filter @0xslots/contracts typecheck && pnpm --filter @0xslots/contracts build`
Expected: both succeed.

- [ ] **Step 6: Commit**

```bash
git add packages/contracts/src/abis/slot.ts
git commit -m "feat(contracts-pkg): mark buy and topUp payable in the slot ABI

viem validates stateMutability before sending, so it refuses to attach
value while these read nonpayable. Also adds the InvalidValue and
TransferFailed errors so decoded reverts are readable."
```

---

### Task 2: One definition of native

The sentinel, the predicate, and the `TokenInfo` every consumer reads. Appended to both Base chains' token lists.

**Files:**
- Modify: `packages/sdk/src/tokens.ts`
- Modify: `packages/sdk/src/index.ts` (export the new symbols)

**Interfaces:**
- Consumes: `TokenInfo` (already in `tokens.ts`), `SlotsChain` (already imported there)
- Produces:
  - `NATIVE_CURRENCY_ADDRESS: "0x0000000000000000000000000000000000000000"`
  - `isNativeCurrency(address: Address | undefined): boolean`
  - `NATIVE_CURRENCY: TokenInfo`

  Tasks 3, 5 and 6 all import these from `@0xslots/sdk`.

- [ ] **Step 1: Add the constants and predicate**

In `packages/sdk/src/tokens.ts`, after the `TokenInfo` interface and before `CHAIN_TOKENS`:

```ts
/**
 * The sentinel a slot uses to denominate its market in native ETH.
 *
 * `Slot.initialize` rejected `address(0)` outright before native support
 * existed, so no slot predating that change can be holding it — which is what
 * makes it a sound sentinel rather than an ambiguous default.
 */
export const NATIVE_CURRENCY_ADDRESS =
  "0x0000000000000000000000000000000000000000" as const;

/**
 * Whether `address` denominates a slot in native ETH.
 *
 * Accepts `undefined` deliberately: every call site in the app holds a
 * possibly-unloaded address, and making each one guard separately is how one
 * gets missed.
 */
export function isNativeCurrency(address: Address | undefined): boolean {
  return address?.toLowerCase() === NATIVE_CURRENCY_ADDRESS;
}

/** Native ETH presented as a token, so consumers need no second code path. */
export const NATIVE_CURRENCY: TokenInfo = {
  address: NATIVE_CURRENCY_ADDRESS,
  name: "Ether",
  symbol: "ETH",
  decimals: 18,
  logo: "eth",
};
```

- [ ] **Step 2: Append to both Base chains**

In `CHAIN_TOKENS`, add `NATIVE_CURRENCY` as the **last** entry of both the `[SlotsChain.BASE_SEPOLIA]` and `[SlotsChain.BASE]` arrays, after the existing WETH entry in each:

```ts
    // Appended, never first — same rule as WETH above. `getDefaultToken`
    // returns [0], so USDC stays the default and an untouched create form
    // produces the slot it always did.
    NATIVE_CURRENCY,
  ],
```

- [ ] **Step 3: Export from the package entry point**

`packages/sdk/src/index.ts` uses an explicit named list, not `export *`, so the new symbols are invisible to consumers until added. Replace the tokens block at lines 41-48:

```ts
// Tokens
export {
  CHAIN_TOKENS,
  getChainTokens,
  getDefaultToken,
  getFaucetToken,
  isNativeCurrency,
  NATIVE_CURRENCY,
  NATIVE_CURRENCY_ADDRESS,
  type TokenInfo,
} from "./tokens";
```

- [ ] **Step 4: Verify the default did not move**

```bash
pnpm --filter @0xslots/sdk build && node -e '
const { getDefaultToken, getChainTokens, isNativeCurrency, NATIVE_CURRENCY_ADDRESS } = require("./packages/sdk/dist/index.js");
for (const id of [8453, 84532]) {
  const d = getDefaultToken(id);
  console.log(id, "default:", d.symbol);
  if (d.symbol !== "USDC" && d.symbol !== "USDCf") { console.error("FAIL: default moved on " + id); process.exit(1); }
  const has = getChainTokens(id).some(t => t.symbol === "ETH");
  if (!has) { console.error("FAIL: ETH missing on " + id); process.exit(1); }
}
if (!isNativeCurrency(NATIVE_CURRENCY_ADDRESS)) { console.error("FAIL: predicate"); process.exit(1); }
if (isNativeCurrency(undefined) !== false) { console.error("FAIL: undefined must be false"); process.exit(1); }
if (!isNativeCurrency("0x0000000000000000000000000000000000000000".toUpperCase().replace("0X","0x"))) { console.error("FAIL: case handling"); process.exit(1); }
console.log("OK");
'
```

Expected: both chains report a USDC-family default, ETH present, `OK`.

- [ ] **Step 5: Commit**

```bash
git add packages/sdk/src/tokens.ts packages/sdk/src/index.ts
git commit -m "feat(sdk): define native ETH as a selectable currency

Appended to both Base chains rather than made default, matching the
rule already documented for WETH: getDefaultToken returns [0], so an
untouched create form produces the slot it always did."
```

---

### Task 3: SDK write path — value instead of approval

`withAllowance` is the only place approvals happen and the only function both write paths share. It becomes a two-branch dispatcher.

**Files:**
- Modify: `packages/sdk/src/client.ts:882-943` (`withAllowance` → `withPayment`)
- Modify: `packages/sdk/src/client.ts:662` and `:697` (call sites)

**Interfaces:**
- Consumes: `isNativeCurrency` from Task 2
- Produces: `private async withPayment(spender: Address, amount: bigint, call: {...}): Promise<Hash>` — same signature as the old `withAllowance`, native-aware. Private, so no consumer-visible change.

- [ ] **Step 1: Import the predicate**

At the top of `packages/sdk/src/client.ts`, add `isNativeCurrency` to the existing import from `./tokens` (or add the import if none exists):

```ts
import { isNativeCurrency } from "./tokens";
```

- [ ] **Step 2: Rename and branch**

Replace the `withAllowance` declaration line and insert the native branch at the top of the body. The existing body from `const allowance = await this.publicClient.readContract({` down to the closing of the `if (allowance < amount)` block becomes the ERC-20 arm.

The new shape:

```ts
  /**
   * Send `call`, paying `amount` the way this slot's currency requires.
   *
   * Native slots hold no allowance to grant, so the value rides on the
   * transaction itself. ERC-20 slots keep the approve-then-send dance,
   * including the post-approval poll that absorbs RPC node lag.
   */
  private async withPayment(
    spender: Address,
    amount: bigint,
    call: {
      to: Address;
      abi: typeof slotAbi;
      functionName: "topUp" | "buy";
      args: readonly unknown[];
    },
  ): Promise<Hash> {
    const currency = await this.publicClient.readContract({
      address: spender,
      abi: slotAbi,
      functionName: "currency",
    });

    if (isNativeCurrency(currency)) {
      // No allowance exists to read or grant. The contract requires
      // msg.value to equal `amount` exactly.
      return this.wallet.writeContract({
        address: call.to,
        abi: call.abi,
        functionName: call.functionName,
        args: call.args as any,
        value: amount,
        account: this.account,
        chain: this.chain,
      });
    }

    const allowance = await this.publicClient.readContract({
      address: currency,
      abi: erc20Abi,
      functionName: "allowance",
      args: [this.account, spender],
    });

    // ... existing approve + pollUntil block, unchanged ...

    return this.wallet.writeContract({
      address: call.to,
      abi: call.abi,
      functionName: call.functionName,
      args: call.args as any,
      account: this.account,
      chain: this.chain,
    });
  }
```

Leave the approve block and the `pollUntil` call exactly as they are. The only edits are: the name, the doc comment, moving the `currency` read above the branch, and the new native early-return.

- [ ] **Step 3: Update both call sites**

`packages/sdk/src/client.ts:662` inside `buy`:

```ts
    return this.withPayment(params.slot, approvalAmount, {
```

`packages/sdk/src/client.ts:697` inside `topUp`:

```ts
    return this.withPayment(slot, amount, {
```

No other logic in `buy` or `topUp` changes. `approvalAmount` (price + deposit) is already exactly the `msg.value` the contract requires.

- [ ] **Step 4: Update the two doc comments that promise approvals**

`buy`'s docblock says "Handles ERC-20 approval automatically." and `topUp`'s says the same. Both become:

```
   * Handles ERC-20 approval automatically; native ETH slots pay by value.
```

- [ ] **Step 5: Confirm no references to the old name remain**

Run: `grep -rn "withAllowance" packages/ apps/ --include="*.ts" --include="*.tsx" | grep -v node_modules`
Expected: no output.

- [ ] **Step 6: Typecheck**

Run: `pnpm --filter @0xslots/sdk typecheck`
Expected: success.

- [ ] **Step 7: Commit**

```bash
git add packages/sdk/src/client.ts
git commit -m "feat(sdk): pay native slots by value instead of approval

withAllowance became a misnomer once one branch never touches an
allowance, so it is now withPayment. The ERC-20 arm is unchanged,
including the post-approval poll for RPC node lag.

buy's approvalAmount (price + deposit) is already exactly the msg.value
the contract requires, so neither call site needed new arithmetic."
```

---

### Task 4: Prove the dispatch

The branch decides whether real funds move as `value` or via an allowance, and nothing else in the repo can catch a mistake in it. This introduces vitest — no TypeScript package here has a test harness today.

**Files:**
- Create: `packages/sdk/vitest.config.ts`
- Create: `packages/sdk/src/client.test.ts`
- Modify: `packages/sdk/package.json`

**Interfaces:**
- Consumes: `SlotsClient`, `SlotsClientConfig`, `NATIVE_CURRENCY_ADDRESS` from Tasks 2-3
- Produces: `pnpm --filter @0xslots/sdk test`

- [ ] **Step 1: Add vitest**

Run: `pnpm --filter @0xslots/sdk add -D vitest@^2`

Then add to `packages/sdk/package.json` `scripts`:

```json
    "test": "vitest run",
    "test:watch": "vitest",
```

- [ ] **Step 2: Add the config**

Create `packages/sdk/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
```

- [ ] **Step 3: Write the failing tests**

Create `packages/sdk/src/client.test.ts`. `SlotsClientConfig` accepts injected `publicClient` and `walletClient`, so no chain is needed — these assert which calls are issued.

```ts
import { describe, expect, it, vi } from "vitest";
import { SlotsClient, SlotsChain } from "./client";
import { NATIVE_CURRENCY_ADDRESS } from "./tokens";

const SLOT = "0x1111111111111111111111111111111111111111" as const;
const ACCOUNT = "0x2222222222222222222222222222222222222222" as const;
const ERC20 = "0x3333333333333333333333333333333333333333" as const;

/**
 * A viem-shaped double. `reads` maps functionName -> value, so a test states
 * only what the path under test actually queries.
 */
function harness(reads: Record<string, unknown>) {
  const writeContract = vi.fn(async () => "0xhash");
  const readContract = vi.fn(async ({ functionName }: any) => {
    if (!(functionName in reads)) {
      throw new Error(`unexpected read: ${functionName}`);
    }
    return reads[functionName];
  });

  const client = new SlotsClient({
    chainId: SlotsChain.BASE,
    subgraphUrl: "http://localhost/never-called",
    publicClient: {
      readContract,
      waitForTransactionReceipt: vi.fn(async () => ({ status: "success" })),
    } as any,
    walletClient: {
      writeContract,
      account: { address: ACCOUNT },
      chain: { id: SlotsChain.BASE },
    } as any,
  });

  return { client, writeContract, readContract };
}

const approvals = (writeContract: ReturnType<typeof vi.fn>) =>
  writeContract.mock.calls.filter((c) => c[0].functionName === "approve");

describe("native ETH slots", () => {
  it("buy attaches value equal to price + deposit and never approves", async () => {
    const { client, writeContract } = harness({
      price: 10n ** 18n,
      currency: NATIVE_CURRENCY_ADDRESS,
    });

    await client.buy({
      slot: SLOT,
      account: ACCOUNT,
      depositAmount: 5n * 10n ** 17n,
      selfAssessedPrice: 2n * 10n ** 18n,
    });

    const buy = writeContract.mock.calls.find((c) => c[0].functionName === "buy");
    expect(buy).toBeDefined();
    expect(buy![0].value).toBe(10n ** 18n + 5n * 10n ** 17n);
    expect(approvals(writeContract)).toHaveLength(0);
  });

  it("topUp attaches value equal to amount and never approves", async () => {
    const { client, writeContract } = harness({
      currency: NATIVE_CURRENCY_ADDRESS,
    });

    await client.topUp(SLOT, 7n * 10n ** 17n);

    const topUp = writeContract.mock.calls.find(
      (c) => c[0].functionName === "topUp",
    );
    expect(topUp![0].value).toBe(7n * 10n ** 17n);
    expect(approvals(writeContract)).toHaveLength(0);
  });
});

describe("ERC-20 slots are unchanged", () => {
  it("buy approves when the allowance is short, and sends no value", async () => {
    const { client, writeContract } = harness({
      price: 10n ** 6n,
      currency: ERC20,
      allowance: 0n,
    });

    await client.buy({
      slot: SLOT,
      account: ACCOUNT,
      depositAmount: 10n ** 6n,
      selfAssessedPrice: 2n * 10n ** 6n,
    });

    expect(approvals(writeContract)).toHaveLength(1);
    const buy = writeContract.mock.calls.find((c) => c[0].functionName === "buy");
    expect(buy![0].value).toBeUndefined();
  });

  it("buy does not approve when the allowance already covers it", async () => {
    const { client, writeContract } = harness({
      price: 10n ** 6n,
      currency: ERC20,
      allowance: 10n ** 30n,
    });

    await client.buy({
      slot: SLOT,
      account: ACCOUNT,
      depositAmount: 10n ** 6n,
      selfAssessedPrice: 2n * 10n ** 6n,
    });

    expect(approvals(writeContract)).toHaveLength(0);
  });
});
```

- [ ] **Step 4: Run the tests**

Run: `pnpm --filter @0xslots/sdk test`
Expected: 4 passed.

If a test fails with `unexpected read: <name>`, the implementation queries something the double does not stub. Add that key to the `harness` call for that test — do **not** loosen the double to return a default for unknown reads, since catching unexpected reads is part of what these tests are for.

- [ ] **Step 5: Prove the native tests are load-bearing**

Temporarily revert the native branch in `withPayment` (delete the `if (isNativeCurrency(currency)) { ... }` block) and run:

Run: `pnpm --filter @0xslots/sdk test`
Expected: the two native tests **FAIL** — with the branch gone the code reads `allowance` off `address(0)`, which the double rejects as an unexpected read.

**Then restore the branch** and confirm all 4 pass again. Do not commit the reverted version.

- [ ] **Step 6: Commit**

```bash
git add packages/sdk/package.json packages/sdk/vitest.config.ts packages/sdk/src/client.test.ts pnpm-lock.yaml
git commit -m "test(sdk): cover the native vs ERC-20 payment dispatch

First test harness in any TypeScript package here. Scoped to the one
branch that decides whether funds move as value or via an allowance —
invisible to typecheck and to every other check in the repo.

Verified by reverting the native branch: both native tests fail."
```

---

### Task 5: Name the zero currency in the subgraph

Without this the explorer renders an unnamed currency everywhere, because `try_name`/`try_symbol` revert against `address(0)` and the mapping stores nulls.

**Files:**
- Modify: `packages/subgraph/src/helpers.ts:81-95` (`getOrCreateCurrency`)

**Interfaces:**
- Consumes: nothing (AssemblyScript cannot import the TypeScript constant from Task 2 — this is the deliberate second definition)
- Produces: a `Currency` entity for `0x0000…0000` with `name: "Ether"`, `symbol: "ETH"`, `decimals: 18`

- [ ] **Step 1: Special-case the sentinel**

In `packages/subgraph/src/helpers.ts`, replace the body of `getOrCreateCurrency`:

```ts
export function getOrCreateCurrency(address: Address): Currency {
  const id = address.toHexString();
  let currency = Currency.load(id);
  if (!currency) {
    currency = new Currency(id);

    // The native-ETH sentinel. Restated here rather than imported: mappings
    // are AssemblyScript compiled to WASM and cannot read the TypeScript
    // constant in packages/sdk. Two definitions, one convention — a change to
    // the sentinel must touch both.
    if (address.equals(Address.zero())) {
      currency.name = "Ether";
      currency.symbol = "ETH";
      currency.decimals = 18;
      currency.save();
      return currency;
    }

    const erc20 = ERC20.bind(address);
    const nameResult = erc20.try_name();
    const symbolResult = erc20.try_symbol();
    const decimalsResult = erc20.try_decimals();

    currency.name = nameResult.reverted ? null : nameResult.value;
    currency.symbol = symbolResult.reverted ? null : symbolResult.value;
    currency.decimals = decimalsResult.reverted ? 18 : decimalsResult.value;
    currency.save();
  }
  return currency;
}
```

Note `currency = new Currency(id)` moved above the branch so both arms share it. No schema change is needed: `Currency.name` and `.symbol` are already nullable and `.decimals` is already `Int!`.

- [ ] **Step 2: Confirm `Address` is imported**

Run: `grep -n "^import" packages/subgraph/src/helpers.ts`

`Address` must appear in an import from `@graphprotocol/graph-ts`. If it does not, add it to that import — do not add a second import statement from the same module.

- [ ] **Step 3: Build the subgraph**

Run: `pnpm --filter @0xslots/subgraph build:base-sepolia`
Expected: `graph codegen` then `graph build` both succeed.

- [ ] **Step 4: Commit**

```bash
git add packages/subgraph/src/helpers.ts
git commit -m "feat(subgraph): name the native ETH currency

try_name/try_symbol revert against address(0), so a native slot indexed
as an unnamed currency with null symbol. Special-cased before any
contract call.

Takes effect on reindex only — Currency is immutable and feed.ts
already creates a zero-address entity — but a version deploy reindexes
from startBlock regardless."
```

---

### Task 6: Explorer and create form

Three read paths in the app assume the currency is an ERC-20 it can call.

**Files:**
- Modify: `apps/landing/src/hooks/use-currency-balance.ts`
- Modify: `apps/landing/src/app/create/hooks/use-erc20-check.ts`
- Modify: `apps/landing/src/app/slots/[slotAddress]/components/user-balance.tsx`
- Create: `apps/landing/public/tokens/eth.svg`

**Interfaces:**
- Consumes: `isNativeCurrency`, `NATIVE_CURRENCY` from Task 2
- Produces: nothing consumed by later tasks

- [ ] **Step 1: Branch the balance hook**

Replace `apps/landing/src/hooks/use-currency-balance.ts` entirely. wagmi's `useBalance` returns the native balance when given no `token`, so the two cases collapse into one hook with the same `bigint` return — no call site changes.

```ts
"use client";

import { isNativeCurrency } from "@0xslots/sdk";
import type { Address } from "viem";
import { useAccount, useBalance } from "wagmi";

export function useCurrencyBalance(currency: Address | undefined) {
  const { address } = useAccount();
  const native = isNativeCurrency(currency);

  const { data } = useBalance({
    address,
    // Omitting `token` asks for the native balance.
    token: native ? undefined : currency,
    query: { enabled: !!address && !!currency },
  });

  return data?.value ?? 0n;
}
```

- [ ] **Step 2: Recognise the sentinel in the create form's address input**

In `apps/landing/src/app/create/hooks/use-erc20-check.ts`, add the native short-circuit at the top of `queryFn`, before the three `readContract` calls (which would all revert against `address(0)`):

```ts
    queryFn: async () => {
      if (!checksummed || !publicClient) throw new Error("No address");

      // The native sentinel is not a contract — answer without an RPC round
      // trip rather than issuing three calls that all revert.
      if (isNativeCurrency(checksummed)) {
        return {
          name: NATIVE_CURRENCY.name,
          symbol: NATIVE_CURRENCY.symbol,
          decimals: NATIVE_CURRENCY.decimals,
          address: checksummed,
        };
      }

      const [name, symbol, decimals] = await Promise.all([
        // ... existing calls, unchanged ...
```

Add to the imports at the top of that file:

```ts
import { isNativeCurrency, NATIVE_CURRENCY } from "@0xslots/sdk";
```

- [ ] **Step 3: Branch the balance display**

Replace `apps/landing/src/app/slots/[slotAddress]/components/user-balance.tsx`. It currently reads `symbol` and `decimals` off the currency address with `erc20Abi`; both revert for `address(0)`, rendering "Your Token Balance" and "—".

```tsx
"use client";

import { isNativeCurrency, NATIVE_CURRENCY } from "@0xslots/sdk";
import { type Address, erc20Abi } from "viem";
import { useReadContract } from "wagmi";
import { useCurrencyBalance } from "@/hooks/use-currency-balance";
import { formatBalance } from "@/utils";

export function UserCurrencyBalance({ currency }: { currency: Address }) {
  const balance = useCurrencyBalance(currency);
  const native = isNativeCurrency(currency);

  const { data: erc20Symbol } = useReadContract({
    address: currency,
    abi: erc20Abi,
    functionName: "symbol",
    query: { enabled: !native },
  });
  const { data: erc20Decimals } = useReadContract({
    address: currency,
    abi: erc20Abi,
    functionName: "decimals",
    query: { enabled: !native },
  });

  const symbol = native ? NATIVE_CURRENCY.symbol : erc20Symbol;
  const decimals = native ? NATIVE_CURRENCY.decimals : erc20Decimals;

  return (
    <div className="px-4 py-2 border-b flex justify-between text-sm">
      <span className="text-muted-foreground">
        Your {symbol ?? "Token"} Balance
      </span>
      <span className="font-bold">
        {decimals !== undefined ? formatBalance(balance, decimals) : "—"}
      </span>
    </div>
  );
}
```

The `query: { enabled: !native }` guards matter: without them wagmi still issues both reads against `address(0)` on every render of a native slot.

- [ ] **Step 4: Add the logo asset**

`TokenInfo.logo` is a slug by deliberate design — the package names the asset and each consumer decides where it lives. `apps/landing/public/tokens/` already holds `usdc.svg` and `weth.svg`; `NATIVE_CURRENCY.logo` is `"eth"`.

Create `apps/landing/public/tokens/eth.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" role="img" aria-label="Ether">
  <circle cx="16" cy="16" r="16" fill="#627EEA"/>
  <path d="M16.498 4v8.87l7.497 3.35z" fill="#fff" fill-opacity=".602"/>
  <path d="M16.498 4L9 16.22l7.498-3.35z" fill="#fff"/>
  <path d="M16.498 21.968v6.027L24 17.616z" fill="#fff" fill-opacity=".602"/>
  <path d="M16.498 27.995v-6.028L9 17.616z" fill="#fff"/>
  <path d="M16.498 20.573l7.497-4.353-7.497-3.348z" fill="#fff" fill-opacity=".2"/>
  <path d="M9 16.22l7.498 4.353v-7.701z" fill="#fff" fill-opacity=".602"/>
</svg>
```

- [ ] **Step 5: Build the app**

Run: `pnpm --filter landing build`
Expected: `next build` succeeds with no type errors.

If it fails resolving `@0xslots/sdk` exports, Task 2 Step 3 did not export the new symbols — go back and fix that rather than importing from a deep path.

- [ ] **Step 6: Commit**

```bash
git add apps/landing/src/hooks/use-currency-balance.ts \
        "apps/landing/src/app/create/hooks/use-erc20-check.ts" \
        "apps/landing/src/app/slots/[slotAddress]/components/user-balance.tsx" \
        apps/landing/public/tokens/eth.svg
git commit -m "feat(landing): render and fund native ETH slots

Three read paths assumed currency was an ERC-20: the balance hook, the
create form's address check, and the balance display. Each now branches
on the sentinel, with wagmi query guards so no read is issued against
address(0).

buy-section needs no change — approvals live in the SDK, and it reads
symbol and decimals from subgraph data."
```

---

### Task 7: Ship and smoke test

Everything above is compile-verified plus four unit tests. This is the first time the whole path runs against a chain.

**Files:**
- None modified

**Interfaces:**
- Consumes: Tasks 1-6
- Produces: a deployed subgraph and a verified end-to-end path

- [ ] **Step 1: Full verification sweep**

```bash
pnpm --filter @0xslots/contracts typecheck && \
pnpm --filter @0xslots/sdk typecheck && \
pnpm --filter @0xslots/sdk test && \
pnpm --filter @0xslots/subgraph build:base-sepolia && \
pnpm --filter landing build
```

Expected: all five succeed.

- [ ] **Step 2: Deploy the subgraph to Base Sepolia**

Run: `pnpm --filter @0xslots/subgraph deploy:base-sepolia`

This reindexes from `startBlock`, which is what makes the Task 5 change take effect — the zero-address `Currency` may already exist with null name and symbol in the running index, and `Currency` is `@entity(immutable: true)`.

Wait for the deployment to reach 100% sync before the next step, or the explorer will show stale data and the smoke test will read as a failure when it is not.

- [ ] **Step 3: Smoke test on Base Sepolia**

Run the app with `pnpm --filter landing dev` (port 3200) and walk the path:

1. Create a slot, selecting **ETH** in the currency list — confirm USDC was preselected and ETH required an explicit choice
2. Buy the slot — **confirm no approval prompt appears**, only one wallet signature
3. Top up the deposit
4. Buy the slot from a second account
5. Confirm the first account's refund arrived as ETH
6. Confirm the explorer shows the slot denominated in **ETH** with 18-decimal amounts throughout — slot list, slot page, and event history

- [ ] **Step 4: Report**

State plainly which of the six smoke steps passed. If any step was skipped or failed, say which and why — do not report the path as verified on the strength of the builds alone.

- [ ] **Step 5: Deploy the subgraph to Base mainnet**

Only after the Base Sepolia smoke test passes in full.

Run: `pnpm --filter @0xslots/subgraph deploy:base`

- [ ] **Step 6: Update the policy factory addresses — only if it has been redeployed**

`MinimumPricePolicyFactory` is not upgradeable and changed in the contracts work, so it needs a fresh deploy on both chains. That deploy is **not part of this plan** — it belongs to the contracts deployment — but `packages/contracts/src/addresses.ts` must record the result whenever it happens.

Check first:

```bash
grep -n -i "minimumPricePolicyFactory" packages/contracts/src/addresses.ts
cat apps/contracts/deployments/8453/MinimumPricePolicyFactory.json
cat apps/contracts/deployments/84532/MinimumPricePolicyFactory.json
```

If the deployment JSON addresses still match what `addresses.ts` records, the redeploy has not happened — **skip this step and say so in the report**. Do not invent addresses.

If they differ, update `addresses.ts` to the deployment JSON values, then:

```bash
pnpm --filter @0xslots/contracts typecheck && pnpm --filter @0xslots/contracts build
git add packages/contracts/src/addresses.ts
git commit -m "chore(contracts-pkg): record redeployed MinimumPricePolicyFactory addresses"
```

Be aware of the consequence, which is a contracts-side decision and not this plan's to make: the factory deploys policies via CREATE2 from its own address, so a new factory address means new predicted policy addresses. Policies deployed by the old factory keep working when referenced directly, but the new factory will not recognise them and `getOrDeploy` will deploy duplicates.

---

## Notes for the implementer

**On the two sentinel definitions.** `packages/sdk/src/tokens.ts` and `packages/subgraph/src/helpers.ts` both hardcode the zero address. This is not an oversight to tidy up: subgraph mappings are AssemblyScript compiled to WASM and cannot import from a TypeScript package. If the sentinel ever changes, both must change.

**On `pnpm-lock.yaml`.** Task 4 adds a dependency, so the lockfile changes and belongs in that commit. No other task should touch it.

**If an existing behaviour breaks,** the change is wrong — the ERC-20 path is used by every slot in production today and must stay identical. Do not adjust an existing call site to accommodate a native branch; branch around it instead.
