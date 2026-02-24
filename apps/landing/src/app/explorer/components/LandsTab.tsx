"use client";

import type { SlotsChain } from "@0xslots/sdk";
import { useLands } from "../hooks";
import { LandCard } from "./LandCard";

export function LandsTab({ chainId }: { chainId: SlotsChain }) {
  const { data: lands, isLoading } = useLands(chainId);

  if (isLoading) {
    return (
      <div className="border-2 border-black">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`flex items-center px-4 py-2 animate-pulse ${i > 0 ? "border-t border-gray-200" : ""}`}
          >
            <div className="h-3 w-24 bg-gray-200" />
            <div className="h-3 w-32 bg-gray-100 ml-auto" />
          </div>
        ))}
      </div>
    );
  }

  if (!lands || lands.length === 0) {
    return (
      <div className="border-2 border-black p-8 text-center">
        <p className="font-mono text-xs text-gray-500">NO LANDS FOUND</p>
      </div>
    );
  }

  return (
    <div className="border-2 border-black divide-y divide-gray-200">
      {/* Table header */}
      <div className="flex items-center gap-4 px-4 py-1.5 bg-gray-50 font-mono text-[10px] uppercase text-gray-400 tracking-wider">
        <span className="w-40">Owner</span>
        <span className="w-28">Land</span>
        <span className="w-20 text-center">Slots</span>
        <span className="w-24 text-center">Occupied</span>
        <span className="w-16 text-center">Tax</span>
        <span className="flex-1 text-right">Slot Map</span>
      </div>
      {lands.map((land) => (
        <LandCard
          key={land.id}
          chainId={chainId}
          landId={land.id}
          owner={land.owner}
        />
      ))}
    </div>
  );
}
