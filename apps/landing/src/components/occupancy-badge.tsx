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
 * Two states exist only because transfers on epoch slots apply lazily:
 *
 * - SETTLING — the boundary has passed, so on-chain the incoming occupant
 *   already holds the slot and pays its tax, but no transaction has written
 *   that to storage yet so the subgraph still shows the old occupant. The
 *   address shown alongside is already the new one.
 * - INCOMING — a buy is committed and waiting for its boundary. Whoever holds
 *   the slot keeps it and keeps paying until then. Only reachable when the buy
 *   took the slot FROM someone: claiming a vacant slot is immediate, so it
 *   never produces this state.
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

  if (occupancy.isResolvedAhead) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="settling" className={className}>
              SETTLING
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-[16rem]">
            Just changed hands — the new holder is shown. The explorer catches
            up shortly.
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
              INCOMING {formatDuration(secondsLeft)}
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            A buy is committed and takes effect at the next epoch boundary.
            Whoever holds the slot keeps it and keeps paying its tax until then,
            and cannot change its price in the meantime. If they leave first the
            slot sits empty, but the buy still stands — nobody else can take it
            in the meantime.
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
