"use client";

import { slotsHubAddress } from "@0xslots/contracts";
import { SlotsChain } from "@0xslots/sdk";
import { useQuery } from "@tanstack/react-query";
import { useSlotsClient } from "./use-slots-client";

export function useHubSettings(chainId: SlotsChain) {
  const client = useSlotsClient(chainId);
  const hubAddress = slotsHubAddress[chainId];

  console.log({ hubAddress });

  return useQuery({
    queryKey: ["hub-settings", chainId],
    queryFn: async () => {
      const [hubResult, modResult] = await Promise.all([
        client.getHub({ id: hubAddress }),
        client.getAllowedModules({ hubId: hubAddress }),
      ]);
      return {
        hub: hubResult.hub ?? null,
        modules: modResult.modules ?? [],
      };
    },
    staleTime: 60_000,
  });
}
