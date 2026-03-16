import { createPublicClient, http, type Transport } from "viem";
import { appChains } from "./chains";

/** Alchemy subdomain by chain ID */
export const ALCHEMY_SUBDOMAINS: Record<number, string> = {
  1: "eth-mainnet",
  10: "opt-mainnet",
  8453: "base-mainnet",
  42161: "arb-mainnet",
  11155111: "eth-sepolia",
  84532: "base-sepolia",
};

/** Build an Alchemy RPC URL for a given chain */
export function alchemyRpcUrl(chainId: number, apiKey: string): string | undefined {
  const sub = ALCHEMY_SUBDOMAINS[chainId];
  return sub ? `https://${sub}.g.alchemy.com/v2/${apiKey}` : undefined;
}

/** Create an HTTP transport for a chain, falling back to public RPC if no Alchemy subdomain exists */
export function alchemyTransport(chainId: number, apiKey?: string): Transport {
  if (!apiKey) return http();
  const url = alchemyRpcUrl(chainId, apiKey);
  return url ? http(url) : http();
}

/** Create a transport map for multiple chains */
export function alchemyTransports(
  chainIds: number[],
  apiKey?: string,
): Record<number, Transport> {
  return Object.fromEntries(
    chainIds.map((id) => [id, alchemyTransport(id, apiKey)]),
  );
}

export function getChainClient(chainId: number, alchemyKey: string) {
  return createPublicClient({
    chain: appChains.find(c => c.id === chainId),
    transport: alchemyTransport(chainId, alchemyKey)
  })
}