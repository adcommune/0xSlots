"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { KNOWN_POLICIES } from "@/config/policies";
import { formatDuration } from "@/hooks/use-effective-occupancy";
import { truncateAddress } from "@/utils";

/**
 * How a slot's occupancy rules deviate from plain Harberger.
 *
 * Harberger is three coupled rules: you self-assess a price, you pay tax on it
 * continuously, and anyone can take it at that price. The tax punishes
 * over-declaring; the forced sale punishes under-declaring. Occupancy policies
 * only ever change the TIMING of that third rule — never who sets the price —
 * so they are dials, not switches. This badge says which dial is turned and by
 * how much, because a slot you cannot be bought out of for a week is a
 * materially different thing to hold than one you can lose in the next block.
 */
export function OccupancyPolicyBadge({
  epochSeconds,
  occupancyPolicy,
  className,
}: {
  epochSeconds?: string | bigint | null;
  occupancyPolicy?: string | null;
  className?: string;
}) {
  const epoch = epochSeconds ? Number(epochSeconds) : 0;
  const policy = occupancyPolicy?.toLowerCase() ?? null;
  const known = policy ? KNOWN_POLICIES[policy] : undefined;

  // The common case today: instant buy, no policy. Plain Harberger — say so
  // rather than rendering nothing, since "no badge" reads as "unknown".
  if (epoch === 0 && !policy) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={className}>
              Instant buy
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            Pure Harberger. Anyone can buy this slot at its declared price, in
            the very next block.
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <span className={className}>
      {epoch > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="incoming" className="mr-1">
                {formatDuration(epoch)} epochs
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-medium">Near-pure Harberger.</p>
              <p className="mt-1">
                Taking this slot from its occupant lands on the clock, not on
                arrival — at the next {formatDuration(epoch)} boundary. Everyone
                waits the same sub-epoch amount and nobody picks theirs, so
                being faster stops being worth anything. Claiming it while
                vacant is immediate.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {policy && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant={known?.impact === "soft" ? "settling" : "outline"}
              >
                {known?.label ?? `Policy ${truncateAddress(policy)}`}
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              {known ? (
                <>
                  <p className="font-medium">
                    {known.impact === "soft"
                      ? "Softens Harberger."
                      : "Near-pure Harberger."}
                  </p>
                  <p className="mt-1">{known.description}</p>
                </>
              ) : (
                <>
                  <p className="font-medium">Unrecognised policy.</p>
                  <p className="mt-1">
                    This slot has an occupancy policy this app does not know
                    about, so how easily it can be bought out is unknown. It can
                    still never block liquidation or stop the occupant leaving —
                    the core forbids both.
                  </p>
                </>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </span>
  );
}
