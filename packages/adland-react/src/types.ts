import type { SlotsChain } from "@0xslots/sdk";
import type { AdData } from "@adland/data";

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
   * Optional RPC URL override. If not provided, uses public RPC for the chain.
   */
  rpcUrl?: string;
  /**
   * Base URL for the "Your ad here" CTA link.
   * Empty-state click navigates to `${baseLinkUrl}/slots/${slot}?chain=${chainId}`.
   * Defaults to "https://app.0xslots.org".
   */
  baseLinkUrl?: string;
  /**
   * Compound children (AdImage, AdTitle, etc.)
   */
  children?: React.ReactNode;
}

export enum AdDataQueryError {
  NO_AD = "NO_AD",
  ERROR = "ERROR",
}
