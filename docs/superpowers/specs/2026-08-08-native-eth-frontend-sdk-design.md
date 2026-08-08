# Native ETH across the SDK, subgraph and explorer — design

**Date:** 2026-08-08
**Status:** Draft, pending review
**Scope:** `packages/contracts`, `packages/sdk`, `packages/subgraph`, `apps/landing`
**Depends on:** [native ETH slots](2026-08-08-native-eth-slots-design.md) — contracts must ship first

## Goal

Make an ETH-denominated slot usable end to end: creatable from the form,
tradeable through the SDK without an approval, and correctly rendered in the
explorer.

The contract work made `currency == address(0)` a valid slot denomination. Every
TypeScript consumer still assumes `currency` is an ERC-20 it can call
`balanceOf`, `approve` and `symbol` on. Until that assumption is broken in four
places, a native slot is unusable from the app and misrendered in the explorer.

## What actually breaks

Two failures, of very different severity:

1. **`SDK.withAllowance` reverts.** `packages/sdk/src/client.ts:892` reads
   `currency` off the slot and calls `allowance` on it. Against `address(0)`
   that reverts, so **every native `buy` and `topUp` fails**. Both write paths
   funnel through this one function (`buy` at :650, `topUp` at :695).
2. **The subgraph degrades rather than crashing.**
   `packages/subgraph/src/helpers.ts:81` uses `try_name`/`try_symbol`/
   `try_decimals`, so `address(0)` yields a `Currency` with `name: null`,
   `symbol: null`, `decimals: 18`. Correct decimals, no label — the explorer
   renders an unnamed currency everywhere.

## Non-goals

- **`packages/ponder` is out of scope.** It is `private`, and no app imports it;
  the explorer reads the subgraph (`apps/landing/.env.example` sets
  `NEXT_PUBLIC_SUBGRAPH_API_KEY`). It can be brought up to date separately if it
  is ever put back into service.
- **ETH does not become the default currency.** See §1.
- No redesign of the create form, explorer tables, or slot page beyond the
  native branches named here.
- `apps/vitrine`, `apps/api` and `apps/docs` are untouched.

## Decisions taken

**ETH is appended to the currency list, never first.** `packages/sdk/src/tokens.ts`
already documents this convention for WETH — *"Appended, never first:
`getDefaultToken` returns [0], so USDC stays the default and an untouched create
form produces the slot it always did."* Native ETH is the first case where
breaking it is arguable, since removing `approve()` is the point of the feature.
It stays appended anyway: prices stay stable-denominated, an untouched form keeps
producing the slot it always did, and the decision is trivially reversible once
real ETH slots have been observed.

**The SDK gets a test harness.** See §6.

## Design

### 1. One definition of "native", in two languages

`packages/sdk/src/tokens.ts` becomes the single TypeScript source of truth:

```ts
export const NATIVE_CURRENCY_ADDRESS =
  "0x0000000000000000000000000000000000000000" as const;

export function isNativeCurrency(address: Address | undefined): boolean {
  return address?.toLowerCase() === NATIVE_CURRENCY_ADDRESS;
}

export const NATIVE_CURRENCY: TokenInfo = {
  address: NATIVE_CURRENCY_ADDRESS,
  name: "Ether",
  symbol: "ETH",
  decimals: 18,
  logo: "eth",
};
```

`NATIVE_CURRENCY` is appended to `CHAIN_TOKENS` for both `BASE` and
`BASE_SEPOLIA`, after the existing entries.

`isNativeCurrency` takes `undefined` because every call site in `apps/landing`
holds a possibly-unloaded address, and forcing each one to guard separately is
how one gets missed.

**The subgraph cannot share this.** Mappings are AssemblyScript compiled to
WASM; they cannot import from a TypeScript package. `packages/subgraph` restates
the constant in its own module. This duplication is stated rather than hidden:
two definitions, one convention, and any change to the sentinel must touch both.

### 2. `packages/contracts` — the blocking change

ABIs here are **hand-maintained TypeScript**, not generated — there is no
`@wagmi/cli`, no `forge inspect` pipeline, no codegen script. `src/abis/slot.ts`
is edited directly.

Required edits:

- `buy` — `stateMutability: "nonpayable"` → `"payable"`
- `topUp` — same
- Add `InvalidValue` and `TransferFailed` to the error entries

This blocks everything downstream: viem validates `stateMutability` before
sending, so with the current ABI it refuses to attach `value` and every native
write fails regardless of SDK changes.

`src/addresses.ts` additionally takes the redeployed `MinimumPricePolicyFactory`
addresses for both chains — that contract is not upgradeable and changed in the
contract work, so it is a fresh deploy at a new address.

### 3. SDK — the write path

`withAllowance` (`client.ts:882`) is the only place approvals happen and the only
function both write paths share. It becomes a two-branch dispatcher:

- **native** — attach `value` to the call, never read `allowance`, never
  `approve`, never poll. The value is the amount already computed by the caller:
  `buy` derives `approvalAmount` as price + deposit at :662, and `topUp` passes
  its `amount` at :697. Both are exactly the `msg.value` the contract now
  requires.
- **ERC-20** — the current body, unchanged, including the post-approval polling
  that handles RPC node lag.

The function's name stops describing what it does once it has a branch that
never touches an allowance. It is renamed to `withPayment`, with
`withAllowance`'s logic surviving as its ERC-20 arm. It is `private`, so this is
not a breaking change for consumers.

`buy` and `topUp` themselves need no logic change — only the currency lookup
already inside `withAllowance` decides the branch.

### 4. Subgraph — name the zero currency

`getOrCreateCurrency` (`helpers.ts:81`) special-cases the sentinel before
attempting any contract call:

```ts
if (address.equals(Address.zero())) {
  currency = new Currency(id);
  currency.name = "Ether";
  currency.symbol = "ETH";
  currency.decimals = 18;
  currency.save();
  return currency;
}
```

No schema change. `Currency.name` and `.symbol` are already nullable and
`.decimals` is already `Int!`, so the `try_*` fallbacks stay exactly as they are
for real tokens.

One wrinkle worth recording: `Currency` is `@entity(immutable: true)`, and
`src/feed.ts:163` already calls `getOrCreateCurrency(Address.zero())`, so a
zero-address `Currency` with null name and symbol may already exist in a
deployed index. The special case therefore only takes effect on a reindex — but
a subgraph version deploy reindexes from `startBlock` regardless, so this costs
nothing beyond remembering that the fix is not retroactive to a running index.

### 5. `apps/landing` — two hooks, one flow, one asset

**`src/hooks/use-currency-balance.ts`** currently hardcodes
`erc20Abi.balanceOf`. wagmi's `useBalance` already returns the native balance
when given no `token`, so the hook branches on `isNativeCurrency(currency)` and
passes `token: undefined` for native. Return type is unchanged (`bigint`), so no
call site changes.

**`src/app/create/hooks/use-erc20-check.ts`** backs the create form's
custom-address input. It returns `NATIVE_CURRENCY`'s fields directly for the zero
address instead of issuing three `readContract` calls that would all revert.

**`src/app/slots/[slotAddress]/components/user-balance.tsx`** reads `symbol` and
`decimals` straight off the currency address with `erc20Abi`. Both revert for
`address(0)`, rendering "Your Token Balance" and "—". It takes the same native
branch, sourcing those two values from `NATIVE_CURRENCY` instead.

**`buy-section.tsx` needs no approval change.** Approvals happen entirely inside
the SDK, not the UI — the component only reads `slot.currencyDecimals ?? 6` and
`slot.currencySymbol ?? "USDC"` from subgraph data, so §3 and §4 together make it
correct with no edit. Its fallbacks are worth knowing about though: if subgraph
data is missing for a native slot it silently renders USDC/6, which would
misformat an ETH amount by twelve orders of magnitude. Out of scope to fix here,
but it is why §4 matters more than it looks.

**`public/tokens/eth.svg`** — a new logo asset, matching the existing
`usdc.svg` and `weth.svg`. `TokenInfo.logo` is a slug by deliberate design, so
the asset is the consumer's responsibility and nothing else needs to change.

**`src/components/testnet-faucet.tsx` is unchanged.** `getFaucetToken` finds the
entry with `faucet: true`, which stays USDCf; `NATIVE_CURRENCY` sets no faucet
flag. Testnet users obtain ETH externally, which they must do for gas anyway.

### 6. Verification

**No TypeScript package in this repository has a test harness** — no vitest, no
jest, no matchstick. The available scripts are `typecheck` (sdk, contracts),
`build`, `graph build` (subgraph) and `next build` (landing). That is compile
coverage, not behaviour coverage.

**`packages/sdk` gains vitest**, scoped narrowly to the §3 dispatch:

- a native `buy` attaches `value` equal to price + deposit, and issues no
  `approve`
- a native `topUp` attaches `value` equal to `amount`
- an ERC-20 `buy` still reads `allowance` and still approves when short
- an ERC-20 `buy` with sufficient allowance does not approve

These use a mocked viem client; they assert which calls are issued, not chain
state. That is the whole risk surface — the branch decides whether real funds
move as `value` or via an allowance, and it is invisible to every other check in
the repo.

The remaining packages are verified by their existing commands plus one manual
smoke path on Base Sepolia, recorded here so it is not improvised:

1. Create an ETH slot from the form
2. Buy it — confirm no approval prompt appears
3. Top up the deposit
4. Buy it from a second account
5. Confirm the first account's refund arrived, and that the explorer shows the
   slot denominated in ETH throughout

## Sequencing

1. `packages/contracts` ABI + addresses — blocks everything else
2. `packages/sdk` — `tokens.ts` constants, then the `withPayment` branch
3. `packages/sdk` — vitest harness and the four dispatch tests
4. `packages/subgraph` — sentinel constant and `getOrCreateCurrency`
5. `apps/landing` — hooks, buy flow, `eth.svg`
6. Deploy subgraph, then the manual smoke path

Steps 1 and 2 are the only ones that gate anything; 4 and 5 are independent of
each other and could run in parallel.
