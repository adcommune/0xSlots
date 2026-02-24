"use client";

import type { SlotsChain } from "@0xslots/sdk";
import { useExplorerEvents } from "../hooks";

export function StatsGrid({ chainId }: { chainId: SlotsChain }) {
  const { data, isLoading } = useExplorerEvents(chainId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="h-3 w-16 bg-gray-300 animate-pulse" />
            <div className="h-4 w-6 bg-gray-300 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  const counts = data?.counts ?? {
    totalLands: 0,
    slotPurchases: 0,
    availableSlots: 0,
  };

  return (
    <div className="flex items-center gap-5">
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[10px] uppercase text-gray-500">Lands</span>
        <span className="font-mono text-sm font-black">{counts.totalLands}</span>
      </div>
      <div className="w-px h-3 bg-gray-300" />
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[10px] uppercase text-gray-500">Purchases</span>
        <span className="font-mono text-sm font-black">{counts.slotPurchases}</span>
      </div>
      <div className="w-px h-3 bg-gray-300" />
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[10px] uppercase text-gray-500">Available</span>
        <span className="font-mono text-sm font-black">{counts.availableSlots}</span>
      </div>
    </div>
  );
}
