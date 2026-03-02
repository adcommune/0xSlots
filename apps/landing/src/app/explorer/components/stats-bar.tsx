"use client";

import { useV3Factory, useV3Slots } from "@/hooks/use-v3";

export function StatsBar() {
  const { data: factory } = useV3Factory();
  const { data: slots } = useV3Slots();
  const vacant = slots?.filter((s) => s.isVacant).length ?? 0;
  const occupied = (slots?.length ?? 0) - vacant;

  return (
    <div className="flex items-center gap-5">
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[10px] uppercase text-gray-500">Slots</span>
        <span className="font-mono text-sm font-black">{factory?.slotCount ?? 0}</span>
      </div>
      <div className="w-px h-3 bg-gray-300" />
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[10px] uppercase text-gray-500">Occupied</span>
        <span className="font-mono text-sm font-black">{occupied}</span>
      </div>
      <div className="w-px h-3 bg-gray-300" />
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[10px] uppercase text-gray-500">Vacant</span>
        <span className="font-mono text-sm font-black">{vacant}</span>
      </div>
    </div>
  );
}
