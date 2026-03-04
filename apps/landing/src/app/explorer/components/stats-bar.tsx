"use client";

import { LandPlot } from "lucide-react";
import { useFactory, useSlots } from "@/hooks/use-v3";

export function StatsBar() {
  const { data: factory } = useFactory();
  const { data: slots } = useSlots();
  const vacant = slots?.filter((s) => s.occupant == null).length ?? 0;
  const occupied = (slots?.length ?? 0) - vacant;

  return (
    <div className="flex items-center gap-5">
      <div className="flex items-center gap-1.5">
        <LandPlot className="size-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Slots</span>
        <span className="text-sm font-bold">{factory?.slotCount ?? 0}</span>
      </div>
      <div className="w-px h-3 bg-border" />
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Occupied</span>
        <span className="text-sm font-bold">{occupied}</span>
      </div>
      <div className="w-px h-3 bg-border" />
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Vacant</span>
        <span className="text-sm font-bold">{vacant}</span>
      </div>
    </div>
  );
}
