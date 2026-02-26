"use client";

import { SlotsChain, SUBGRAPH_URLS } from "@0xslots/sdk";
import { useQuery } from "@tanstack/react-query";
import { useBlockNumber } from "wagmi";

interface SyncStatus {
  indexedBlock: number;
  chainBlock: number;
  behind: number;
  hasErrors: boolean;
  synced: boolean;
}

export function useSyncStatus(chainId: SlotsChain): {
  data: SyncStatus | null;
  isLoading: boolean;
} {
  const subgraphUrl = SUBGRAPH_URLS[chainId];

  const { data: chainBlock } = useBlockNumber({
    chainId,
    watch: false,
  });

  const { data: meta, isLoading } = useQuery({
    queryKey: ["subgraph-meta", chainId],
    queryFn: async () => {
      const res = await fetch(subgraphUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `{ _meta { block { number } hasIndexingErrors } }`,
        }),
      });
      const json = await res.json();
      return json.data?._meta as {
        block: { number: number };
        hasIndexingErrors: boolean;
      } | null;
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  if (!meta || !chainBlock) {
    return { data: null, isLoading };
  }

  const indexedBlock = meta.block.number;
  const chain = Number(chainBlock);
  const behind = Math.max(0, chain - indexedBlock);

  return {
    data: {
      indexedBlock,
      chainBlock: chain,
      behind,
      hasErrors: meta.hasIndexingErrors,
      synced: behind < 50,
    },
    isLoading,
  };
}
