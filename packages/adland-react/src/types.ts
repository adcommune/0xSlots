import type { SlotsChain } from "@0xslots/sdk";
import type { AdData } from "@adland/data";

/**
 * Optional analytics context passed with every impression/click event.
 * Only include dimensions you'll filter or group by — Umami already
 * captures hostname, URL, referrer, country, device, OS, and browser.
 */
/** Authentication method for verified impressions */
export type AdAuth = "farcaster" | "none";

export interface AdProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The slot contract address (0xSlots v3).
   * Required when fetching from chain. Omit when passing static `data`.
   */
  slot?: string;
  /**
   * Chain ID for on-chain reads. Defaults to BASE (8453).
   */
  chainId?: SlotsChain;
  /**
   * Static ad data. When provided, skips on-chain fetching.
   */
  data?: AdData;
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
   * Authentication method for verified impressions. Default: "none".
   * "farcaster" uses Quick Auth — server resolves FID + address automatically.
   */
  auth?: AdAuth;
  /**
   * Placement context sent with events (e.g. "carousel", "sidebar", "frame").
   */
  context?: string;
  /**
   * Compound children (AdImage, AdTitle, etc.)
   */
  children?: React.ReactNode;
}

export enum AdDataQueryError {
  NO_AD = "NO_AD",
  ERROR = "ERROR",
}
