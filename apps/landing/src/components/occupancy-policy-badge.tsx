"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useChain } from "@/context/chain";
import { useResolvedPolicy } from "@/hooks/use-resolved-policy";
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
 *
 * There was an epoch badge here too, for slots whose buys landed on a clock
 * boundary. That scheduling was removed in v4 and a policy veto is now the only
 * thing that changes when a slot can change hands.
 */
export function OccupancyPolicyBadge({
  occupancyPolicy,
  className,
}: {
  occupancyPolicy?: string | null;
  className?: string;
}) {
  const { chainId } = useChain();
  const policy = occupancyPolicy?.toLowerCase() ?? null;
  // Resolved on-chain when the static map has no entry — tenure is chosen per
  // slot now, so most policy addresses will never be in a hardcoded list.
  const { policy: known } = useResolvedPolicy(policy, chainId);

  // The common case today: instant buy, no policy. Plain Harberger — say so
  // rather than rendering nothing, since "no badge" reads as "unknown".
  if (!policy) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={className}>
              Instant buy
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            Anyone can buy this slot right now, at its listed price.
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <span className={className}>
      {policy && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {/* `resolvePolicy` always answers — an unrecognised address gets
                  its own label and an "unknown" impact — so there is nothing to
                  fall back to here. While the read is in flight `known` is
                  undefined, which renders the neutral outline. */}
              <Badge
                variant={known?.impact === "soft" ? "protected" : "outline"}
              >
                {known?.label ?? `Policy ${truncateAddress(policy)}`}
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="max-w-[16rem]">
              {known?.description ?? "Reading this slot's occupancy rule…"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </span>
  );
}
