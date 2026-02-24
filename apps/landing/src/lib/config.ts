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

export function parseChain(chain?: string): SlotsChain {
  if (chain === "base-sepolia") return SlotsChain.BASE_SEPOLIA;
  return SlotsChain.ARBITRUM;
}
