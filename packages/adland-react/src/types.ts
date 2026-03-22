import type { SlotsChain } from "@0xslots/sdk";
import type { AdData } from "@adland/data";

export type Network = "testnet" | "mainnet";

export interface AdProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The slot contract address (0xSlots v3).
   * Required when fetching from chain. Omit when passing static `data`.
   */
  slot?: string;
  /**
   * Static ad data. When provided, skips on-chain fetching.
   */
  data?: AdData;
  /**
   * Chain ID for on-chain reads. Defaults to BASE (8453).
   */
  chainId?: SlotsChain;
  /**
   * Network to use for tracking requests (currently only "testnet" is supported)
   */
  network?: Network;
  /**
   * Optional base URL override. If not provided, uses relative URL in browser or production URL in SSR
   */
  baseUrl?: string;
  /**
   * Optional RPC URL override. If not provided, uses public RPC for the chain.
   */
  rpcUrl?: string;
  /**
   * Compound children (AdImage, AdTitle, etc.)
   */
  children?: React.ReactNode;
}

export enum AdDataQueryError {
  NO_AD = "NO_AD",
  ERROR = "ERROR",
}

export interface AdDataQueryResponse {
  error?: AdDataQueryError;
  data?: AdData;
}
