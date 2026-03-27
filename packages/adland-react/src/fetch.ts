import { SlotsClient, type SlotsChain } from "@0xslots/sdk";
import type { AdData } from "@adland/data";
import { type Address, createPublicClient, http } from "viem";
import { base, baseSepolia } from "viem/chains";

import { AdDataQueryError } from "./types";

const IPFS_GATEWAY = "https://amethyst-representative-mandrill-369.mypinata.cloud/ipfs/";

const viemChains: Record<number, typeof base> = {
  8453: base,
  84532: baseSepolia,
};

/**
 * Create a read-only SlotsClient for a given chain.
 */
export function createReadClient(
  chainId: SlotsChain,
  rpcUrl?: string,
): SlotsClient {
  const chain = viemChains[chainId];
  if (!chain) throw new Error(`Unsupported chain: ${chainId}`);

  const publicClient = createPublicClient({
    chain,
    transport: http(rpcUrl),
  });

  return new SlotsClient({ chainId, publicClient });
}

/**
 * Extract the IPFS CID from a metadata URI, or null for non-IPFS URIs.
 */
export function extractCid(uri: string): string | null {
  if (uri.startsWith("ipfs://")) return uri.slice(7);
  if (uri.startsWith("Qm") || uri.startsWith("bafy")) return uri;
  return null;
}

/**
 * Fetch ad content from a metadata URI (IPFS or HTTP).
 * Returns both the ad data and the CID (if IPFS).
 */
export const fetchAdFromURI = async (
  uri: string,
): Promise<{ data: AdData; cid: string | null }> => {
  if (!uri) throw new Error(AdDataQueryError.NO_AD);

  const cid = extractCid(uri);
  const url = cid ? `${IPFS_GATEWAY}${cid}` : uri;

  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    if (res.status === 404) throw new Error(AdDataQueryError.NO_AD);
    throw new Error(AdDataQueryError.ERROR);
  }

  const data = await res.json();
  if (data.error) throw new Error(data.error);

  return { data, cid };
};

/**
 * Fetch the metadata URI for a slot using the SDK.
 */
export const fetchMetadataURI = async (
  client: SlotsClient,
  slotAddress: string,
): Promise<string> => {
  const info = await client.getSlotInfo(slotAddress as Address);
  const moduleAddress = (info as { module: Address }).module;

  if (
    !moduleAddress ||
    moduleAddress === "0x0000000000000000000000000000000000000000"
  ) {
    return "";
  }

  return client.modules.metadata.getURI(
    moduleAddress,
    slotAddress as Address,
  );
};
