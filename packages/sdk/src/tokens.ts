import type { Address } from "viem";
import { SlotsChain } from "./client";

export interface TokenInfo {
  address: Address;
  name: string;
  symbol: string;
  decimals: number;
}

/**
 * Predetermined tokens available per chain for slot creation.
 * The first token in each array is the default.
 */
export const CHAIN_TOKENS: Record<SlotsChain, TokenInfo[]> = {
  [SlotsChain.BASE_SEPOLIA]: [
    {
      address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      name: "USD Coin",
      symbol: "USDC",
      decimals: 6,
    },
  ],
  [SlotsChain.BASE]: [
    {
      address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      name: "USD Coin",
      symbol: "USDC",
      decimals: 6,
    },
  ],
};

/**
 * Get the list of predetermined tokens for a given chain.
 */
export function getChainTokens(chainId: number): TokenInfo[] {
  return CHAIN_TOKENS[chainId as SlotsChain] ?? [];
}

/**
 * Get the default token for a given chain (first in the list).
 */
export function getDefaultToken(chainId: number): TokenInfo | undefined {
  return getChainTokens(chainId)[0];
}
