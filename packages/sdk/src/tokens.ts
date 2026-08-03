import type { Address } from "viem";
import { SlotsChain } from "./client";

export interface TokenInfo {
  address: Address;
  name: string;
  symbol: string;
  decimals: number;
  /**
   * Test token with an unpermissioned `mint(address,uint256)`.
   *
   * Circle's testnet USDC is the real FiatToken — `mint` is gated to
   * configured minters, so a testnet user has to leave the app for
   * faucet.circle.com before they can buy anything. A faucet token avoids
   * that dead end.
   */
  faucet?: boolean;
}

/**
 * Predetermined tokens available per chain for slot creation.
 * The first token in each array is the default.
 */
export const CHAIN_TOKENS: Record<SlotsChain, TokenInfo[]> = {
  [SlotsChain.BASE_SEPOLIA]: [
    // Default: mintable, so a new testnet user can create AND buy a slot
    // without leaving the app. Shared with the Feed app, so balances carry
    // across both rather than fragmenting across two test tokens.
    {
      address: "0xFA28A416810e39a7142C7557e6e43407d765f627",
      name: "Feed USDC",
      symbol: "USDCf",
      decimals: 6,
      faucet: true,
    },
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

/** The faucet-enabled token for a chain, if it has one. */
export function getFaucetToken(chainId: number): TokenInfo | undefined {
  return getChainTokens(chainId).find((t) => t.faucet);
}
