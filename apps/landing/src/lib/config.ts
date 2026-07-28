import { CHAINS, DEFAULT_CHAIN } from "@0xslots/contracts";
import { SlotsChain } from "@0xslots/sdk";

export const CHAIN_CONFIG = {
  [SlotsChain.BASE_SEPOLIA]: {
    name: "Base Sepolia",
    explorer: "https://sepolia.basescan.org",
  },
  [SlotsChain.BASE]: {
    name: "Base",
    explorer: "https://basescan.org",
  },
} as const;

/** Get block explorer base URL for a given chain ID. Derives from viem chain objects. */
export function getExplorerUrl(chainId: number): string {
  const chain = CHAINS.find((c) => c.id === chainId);
  return (
    (chain ?? DEFAULT_CHAIN).blockExplorers?.default?.url ??
    "https://sepolia.basescan.org"
  );
}

/**
 * Resolve the chain for a server component from its `?chain=` search param.
 *
 * Server components can't see the client's stored preference, so the param is
 * the only signal available at prefetch time — without it, SSR always primes
 * the cache with the default chain's data regardless of what the user selected.
 */
export function getChainFromSearchParams(
  searchParams: Record<string, string | string[] | undefined> | undefined,
): SlotsChain {
  const raw = searchParams?.chain;
  const parsed = Number(Array.isArray(raw) ? raw[0] : raw);
  return CHAINS.some((c) => c.id === parsed)
    ? (parsed as SlotsChain)
    : (DEFAULT_CHAIN.id as SlotsChain);
}
