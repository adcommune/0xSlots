"use client";

import { useQuery } from "@tanstack/react-query";
import type { Address } from "viem";
import { useSlotsClient } from "@/hooks/use-slots-client";
import { useSlotsClient as useSubgraphSlotsClient } from "@/hooks/use-v3";
import { useChain } from "@/context/chain";

type AdContent = {
  type: string;
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

/**
 * Fetch IPFS content via the cached Next.js API route.
 */
async function fetchIpfsContent(uri: string): Promise<AdContent | null> {
  const res = await fetch(`/api/ipfs?uri=${encodeURIComponent(uri)}`);
  if (!res.ok) return null;
  return res.json();
}

/**
 * Read the current metadata URI from chain (RPC).
 */
export function useMetadataUri(slotAddress: string) {
  const client = useSlotsClient();
  const { chainId } = useChain();

  return useQuery({
    queryKey: ["metadata-uri", chainId, slotAddress],
    queryFn: async () => {
      const uri = await client.modules.metadata.getURI(
        slotAddress as Address,
      );
      return uri || null;
    },
    staleTime: 10_000,
    enabled: !!slotAddress,
  });
}

/**
 * Fetch ad content from IPFS for a given URI.
 * Cached forever on the server via /api/ipfs, and stale after 60s on the client.
 */
export function useIpfsContent(uri: string | null | undefined) {
  return useQuery({
    queryKey: ["ipfs-content", uri],
    queryFn: () => fetchIpfsContent(uri!),
    staleTime: Infinity, // IPFS content is immutable
    enabled: !!uri,
  });
}

type HistoryEntry = {
  uri: string;
  timestamp: string;
  tx: string;
  author: { id: string; type: string };
};

/**
 * Fetch metadata update history from the subgraph.
 */
export function useMetadataHistory(slotAddress: string) {
  const subgraphClient = useSubgraphSlotsClient();
  const { chainId } = useChain();

  return useQuery({
    queryKey: ["metadata-history", chainId, slotAddress],
    queryFn: async (): Promise<HistoryEntry[]> => {
      const { metadataUpdatedEvents } =
        await subgraphClient.modules.metadata.getUpdateHistory({
          slot: slotAddress.toLowerCase(),
          first: 10,
        });
      return metadataUpdatedEvents.map((e) => ({
        uri: e.uri,
        timestamp: e.timestamp,
        tx: e.tx,
        author: { id: e.author.id, type: e.author.type },
      }));
    },
    staleTime: 10_000,
    enabled: !!slotAddress,
  });
}

/**
 * Resolve ad types for a list of history entries.
 * Each URI is fetched via the cached IPFS route.
 */
export function useHistoryAdTypes(history: HistoryEntry[] | undefined) {
  const uris = history?.map((e) => e.uri) ?? [];

  return useQuery({
    queryKey: ["metadata-history-types", ...uris],
    queryFn: async (): Promise<Record<string, string | undefined>> => {
      const results = await Promise.all(
        uris.map(async (uri) => {
          const content = await fetchIpfsContent(uri);
          return [uri, content?.type] as const;
        }),
      );
      return Object.fromEntries(results);
    },
    staleTime: Infinity, // IPFS content is immutable
    enabled: uris.length > 0,
  });
}
