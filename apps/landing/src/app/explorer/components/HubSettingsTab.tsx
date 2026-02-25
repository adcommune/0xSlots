"use client";

import type { SlotsChain } from "@0xslots/sdk";
import { HubSettings } from "@/components/hub-settings";
import { CHAIN_CONFIG } from "@/lib/config";
import { useHubSettings } from "../hooks";

export function HubSettingsTab({ chainId }: { chainId: SlotsChain }) {
  const { data, isLoading } = useHubSettings(chainId);
  const config = CHAIN_CONFIG[chainId];

  if (isLoading) {
    return (
      <div className="border-2 border-black">
        <div className="bg-gray-50 border-b-2 border-black p-4">
          <div className="h-5 w-48 bg-gray-200 animate-pulse" />
        </div>
        <div className="p-6 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="h-3 w-32 bg-gray-100 animate-pulse" />
              <div className="h-3 w-24 bg-gray-100 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <HubSettings
      hub={(data?.hub as any) ?? null}
      currencies={(data?.currencies as any[]) ?? []}
      modules={(data?.modules as any[]) ?? []}
      explorerUrl={config.explorer}
    />
  );
}
