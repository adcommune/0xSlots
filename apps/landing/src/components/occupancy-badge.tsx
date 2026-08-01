"use client";

import type { EffectiveOccupancy } from "@0xslots/sdk";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDuration } from "@/hooks/use-effective-occupancy";

/**
 * Occupancy state, resolved rather than indexed.
 *
 * SOLD is the property analogue of exchanged contracts: binding at an agreed
 * price, completing on a set date, with the current holder keeping the slot and
 * paying for it until then. Only reachable when the buy took the slot FROM
 * someone — claiming a vacant slot completes immediately.
 *
 * There is deliberately NO badge for "completed but not yet recorded". The
 * holder shown is already the correct one, so flagging that our index is behind
 * tells the reader something about our pipeline rather than about the property.
 * The slot page still raises it, because there it comes with a button that
 * fixes it.
 */
export function OccupancyBadge({
  occupancy,
  insolvent,
  className,
}: {
  occupancy: EffectiveOccupancy | null;
  insolvent?: boolean;
  className?: string;
}) {
  if (!occupancy) return null;

  if (insolvent) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="destructive" className={className}>
              INSOLVENT
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            The deposit is exhausted. Anyone can liquidate this slot and collect
            the bounty — no policy can prevent it.
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (occupancy.hasPendingTransfer) {
    const secondsLeft = occupancy.pendingEffectiveAt
      ? Number(occupancy.pendingEffectiveAt) - Math.floor(Date.now() / 1000)
      : 0;
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="incoming" className={className}>
              SOLD · {formatDuration(secondsLeft)}
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-[17rem]">
            Sold — completes in {formatDuration(secondsLeft)}. The sale is
            binding at the agreed price and nobody else can buy it before then.
            Until it completes the current holder keeps the slot, keeps paying
            for it, and cannot change its price.
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Badge
      variant={occupancy.occupant ? "default" : "secondary"}
      className={className}
    >
      {occupancy.occupant ? "OCCUPIED" : "VACANT"}
    </Badge>
  );
}
