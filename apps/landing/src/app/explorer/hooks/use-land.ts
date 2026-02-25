"use client";

import type { SlotsChain } from "@0xslots/sdk";
import { useQuery } from "@tanstack/react-query";
import { useSlotsClient } from "./use-slots-client";

export function useLand(chainId: SlotsChain, landId: string) {
  const client = useSlotsClient(chainId);

  return useQuery({
    queryKey: ["land", chainId, landId],
    queryFn: async () => {
      const result = await client.getLand({ id: landId });
      return result.land;
    },
    staleTime: 30_000,
    enabled: !!landId,
  });
}
