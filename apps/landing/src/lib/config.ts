import { CHAINS, DEFAULT_CHAIN } from "@0xslots/contracts";
import { SlotsChain } from "@0xslots/sdk";

export const CHAIN_CONFIG = {
  [SlotsChain.BASE_SEPOLIA]: {
    name: "Base Sepolia",
    explorer: "https://sepolia.basescan.org",
  },
  [SlotsChain.ARBITRUM]: {
    name: "Arbitrum",
    explorer: "https://arbiscan.io",
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

export function parseChain(chain?: string): SlotsChain {
  if (chain === "base-sepolia") return SlotsChain.BASE_SEPOLIA;
  return SlotsChain.ARBITRUM;
}
