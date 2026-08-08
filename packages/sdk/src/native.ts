import type { Address } from "viem";

/**
 * The native-ETH sentinel, and the predicate for it.
 *
 * ── Why this is its own module ──────────────────────────────────────────────
 * A leaf: it imports nothing at runtime (`Address` is type-only and erased).
 *
 * `tokens.ts` needs `SlotsChain` from `client.ts` at module-init time, to key
 * `CHAIN_TOKENS`. So `client.ts` importing back from `tokens.ts` forms a cycle
 * — and that cycle is not benign. Bundled by tsup it happens to survive,
 * because esbuild emits one file and hoists the enum; under a native-ESM
 * loader such as Vitest it does not, and `SlotsChain` evaluates to `undefined`
 * while `CHAIN_TOKENS` is being built.
 *
 * Keeping the sentinel here lets both sides import it with no cycle at all.
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
