import { SlotsClient, type SlotsChain } from "@0xslots/sdk";
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
 * Fetch ad content from a metadata URI (IPFS or HTTP)
 */
export const fetchAdFromURI = async (uri: string) => {
  if (!uri) throw new Error(AdDataQueryError.NO_AD);

  const url = uri.startsWith("ipfs://")
    ? `${IPFS_GATEWAY}${uri.slice(7)}`
    : uri;

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

  return data;
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
