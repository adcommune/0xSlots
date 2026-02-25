"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ExplorerTabs } from "@/components/explorer-tabs";
import { CHAIN_CONFIG, parseChain } from "@/lib/config";
import { ChainSelector } from "./chain-selector";
import { EventsTab } from "./components/EventsTab";
import { HubSettingsTab } from "./components/HubSettingsTab";
import { LandsTab } from "./components/LandsTab";
import { StatsGrid } from "./components/StatsGrid";

function ExplorerContent() {
  const searchParams = useSearchParams();
  const chainParam = searchParams.get("chain") ?? undefined;
  const chainId = parseChain(chainParam);
  const config = CHAIN_CONFIG[chainId];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b-4 border-black bg-linear-to-br from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <h1 className="text-xl font-black tracking-tighter uppercase leading-tight">
                  Explorer
                </h1>
                <p className="text-gray-400 font-mono text-[10px]">
                  {config.name}
                </p>
              </div>
              <div className="w-px h-6 bg-gray-300" />
              <StatsGrid chainId={chainId} />
            </div>
            <div className="flex items-center gap-3">
              <a
                href={`/explorer/create${chainParam ? `?chain=${chainParam}` : ""}`}
                className="border-2 border-black bg-black text-white px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-black transition-colors"
              >
                + Create Land
              </a>
              <ChainSelector current={chainParam || "arbitrum"} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-4">
        <ExplorerTabs
          tabs={[
            {
              id: "lands",
              label: "Lands",
              content: () => <LandsTab chainId={chainId} />,
            },
            {
              id: "events",
              label: "Events",
              content: () => <EventsTab chainId={chainId} />,
            },
            {
              id: "settings",
              label: "Hub Settings",
              content: () => <HubSettingsTab chainId={chainId} />,
            },
          ]}
        />

        <div className="mt-8 text-center text-xs text-gray-400 font-mono">
          Powered by @0xslots/sdk · The Graph
        </div>
      </div>
    </div>
  );
}

function ExplorerSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <div className="border-b-4 border-black bg-linear-to-br from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-6">
            <div className="h-6 w-24 bg-gray-200 animate-pulse" />
            <div className="flex items-center gap-4">
              <div className="h-3 w-16 bg-gray-100 animate-pulse" />
              <div className="h-3 w-16 bg-gray-100 animate-pulse" />
              <div className="h-3 w-16 bg-gray-100 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-6 py-4" />
    </div>
  );
}

export default function ExplorerPage() {
  return (
    <Suspense fallback={<ExplorerSkeleton />}>
      <ExplorerContent />
    </Suspense>
  );
}
