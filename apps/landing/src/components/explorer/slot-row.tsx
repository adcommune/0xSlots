"use client";

import type { SlotFieldsFragment } from "@0xslots/sdk";
import { formatDistanceToNow } from "date-fns";
import { AccountTypeIcon } from "@/components/account-type-icon";
import { EnsAddress } from "@/components/ens-address";
import { OccupancyBadge } from "@/components/occupancy-badge";
import { OccupancyPolicyBadge } from "@/components/occupancy-policy-badge";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { useEffectiveOccupancy } from "@/hooks/use-effective-occupancy";
import { formatPrice, truncateAddress } from "@/utils";

/**
 * One row of the slots table.
 *
 * Its own component for two reasons: hooks cannot be called inside the parent's
 * `.map()`, and occupancy must be resolved ONCE per row. Resolving it in each
 * cell separately would start a timer per cell and — worse — let cells disagree
 * with each other, e.g. an occupant resolved past a boundary shown next to the
 * pre-boundary price.
 *
 * Every occupancy-derived value here comes from `occupancy`, never from the
 * indexed `slot.occupant` / `slot.price`.
 */
export function SlotRow({
  slot,
  onSelect,
}: {
  slot: SlotFieldsFragment;
  onSelect: (id: string) => void;
}) {
  const occupancy = useEffectiveOccupancy(slot);
  const occupant = occupancy?.occupant ?? null;

  // The account entity describes the INDEXED occupant, so it only applies to
  // the address we're rendering when we haven't resolved past it.
  const account = occupancy?.isResolvedAhead ? null : slot.occupantAccount;
  const showState = occupancy?.isResolvedAhead || occupancy?.hasPendingTransfer;

  return (
    <TableRow className="cursor-pointer" onClick={() => onSelect(slot.id)}>
      <TableCell>
        <span className="inline-flex items-center gap-1.5">
          <AccountTypeIcon
            type={slot.recipientAccount.type}
            className="h-3 w-3"
          />
          <EnsAddress address={slot.recipient} />
        </span>
      </TableCell>

      <TableCell className="text-xs">
        <div className="flex items-center gap-1.5">
          {occupant ? (
            <span className="inline-flex items-center gap-1.5">
              {account && (
                <AccountTypeIcon type={account.type} className="h-3 w-3" />
              )}
              {truncateAddress(occupant)}
            </span>
          ) : (
            <Badge variant="secondary" className="text-[10px]">
              VACANT
            </Badge>
          )}
          {showState && (
            <OccupancyBadge occupancy={occupancy} className="text-[10px]" />
          )}
        </div>
      </TableCell>

      <TableCell className="text-right text-xs whitespace-nowrap">
        {/* Resolved price, not slot.price — past a boundary the incoming
            occupant's price is what the slot is actually taxed on and what a
            buyer would pay, so showing the stale one contradicts the occupant
            rendered beside it. */}
        <span className="font-bold">
          {occupant
            ? formatPrice(
                (occupancy?.price ?? 0n).toString(),
                slot.currency.decimals ?? 18,
              )
            : "0"}
        </span>
        <span className="text-muted-foreground text-[10px] ml-1">
          {slot.currency.symbol}
        </span>
        <span className="text-muted-foreground text-[10px] ml-1">
          ({Number(slot.taxPercentage) / 100}%/mo)
        </span>
      </TableCell>

      <TableCell className="text-xs text-muted-foreground">
        {slot.module
          ? `${slot.module.name || truncateAddress(slot.module.id)}${slot.module.verified ? " ✓" : ""}`
          : "—"}
      </TableCell>

      <TableCell>
        <div className="flex flex-wrap items-center gap-1">
          {/* How easily this slot can actually be bought out — more
              consequential to a holder than the mutability flags beside it. */}
          <OccupancyPolicyBadge
            epochSeconds={slot.epochSeconds}
            occupancyPolicy={slot.occupancyPolicy}
            className="[&_*]:text-[9px]"
          />
          {slot.mutableTax && (
            <Badge variant="outline" className="text-[9px]">
              TAX
            </Badge>
          )}
          {slot.mutableModule && (
            <Badge variant="outline" className="text-[9px]">
              MOD
            </Badge>
          )}
        </div>
      </TableCell>

      <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
        {formatDistanceToNow(new Date(Number(slot.createdAt) * 1000), {
          addSuffix: true,
        })}
      </TableCell>
    </TableRow>
  );
}
