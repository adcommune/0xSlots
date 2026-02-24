"use client";

import { useQuery } from "@tanstack/react-query";
import type { SlotsChain } from "@0xslots/sdk";
import { useSlotsClient } from "./use-slots-client";

export function useLandsByOwner(chainId: SlotsChain, owner: string | undefined) {
  const client = useSlotsClient(chainId);

  return useQuery({
    queryKey: ["landsByOwner", chainId, owner?.toLowerCase()],
    queryFn: async () => {
      const result = await client.getLandsByOwner({ owner: owner!, first: 1 });
      return result.lands ?? [];
    },
    enabled: !!owner,
    staleTime: 30_000,
  });
}
