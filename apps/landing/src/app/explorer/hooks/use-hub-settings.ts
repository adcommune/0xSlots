"use client";

import { useQuery } from "@tanstack/react-query";
import { SlotsChain } from "@0xslots/sdk";
import { useSlotsClient } from "./use-slots-client";

export const HUB_IDS: Record<SlotsChain, string> = {
  [SlotsChain.BASE_SEPOLIA]: "0x62882e33374ff18b8f9fcf5aee44b102a2c2245a",
  [SlotsChain.ARBITRUM]: "0x50b9111b44cf2f8eb5a2b21bf58dcf7cba583dd3",
};

export function useHubSettings(chainId: SlotsChain) {
  const client = useSlotsClient(chainId);
  const hubId = HUB_IDS[chainId];

  return useQuery({
    queryKey: ["hub-settings", chainId],
    queryFn: async () => {
      const [hubResult, currResult, modResult] = await Promise.all([
        client.getHub({ id: hubId }),
        client.getAllowedCurrencies({ hubId }),
        client.getAllowedModules({ hubId }),
      ]);
      return {
        hub: hubResult.hub ?? null,
        currencies: currResult.currencies ?? [],
        modules: modResult.modules ?? [],
      };
    },
    staleTime: 60_000,
  });
}
