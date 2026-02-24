"use client";

import { useQuery } from "@tanstack/react-query";
import type { SlotsChain } from "@0xslots/sdk";
import { useSlotsClient } from "./use-slots-client";

export function useLands(chainId: SlotsChain) {
  const client = useSlotsClient(chainId);

  return useQuery({
    queryKey: ["lands", chainId],
    queryFn: async () => {
      const result = await client.getLands({
        first: 50,
        orderBy: "createdAt",
        orderDirection: "desc",
      });
      return result.lands ?? [];
    },
    staleTime: 30_000,
  });
}
