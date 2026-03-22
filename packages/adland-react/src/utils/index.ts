import { Network } from "../types";

/**
 * Get the base URL for the network
 * Uses relative URL in browser (for local dev), otherwise defaults to production
 */
export const getBaseUrl = (network: Network): string => {
  if (typeof window !== "undefined") {
    // In browser - use relative URL for local development
    return "";
  }

  if (network === "testnet") {
    return "https://testnet.adland.space";
  }

  if (network === "mainnet") {
    return "https://app.adland.space";
  }

  return "";
};
