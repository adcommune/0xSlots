"use client";

import type { SlotFieldsFragment } from "@0xslots/sdk";
import { AccountTypeIcon } from "@/components/account-type-icon";
import { OccupancyBadge } from "@/components/occupancy-badge";
import { Badge } from "@/components/ui/badge";
import { useEffectiveOccupancy } from "@/hooks/use-effective-occupancy";
import { truncateAddress } from "@/utils";

/**
 * The occupant column.
 *
 * Renders RESOLVED occupancy, not the indexed value. On an epoch slot the
 * handover happens at a clock boundary but is written to storage lazily, so
 * between the two the subgraph's `occupant` names someone who has already
 * stopped paying tax on this slot. `useEffectiveOccupancy` mirrors what
 * `Slot.occupant()` returns on-chain.
 *
 * Its own component because the hook cannot be called inside the table's map.
 */
export function OccupantCell({ slot }: { slot: SlotFieldsFragment }) {
  const occupancy = useEffectiveOccupancy(slot);
  const occupant = occupancy?.occupant ?? null;

  if (!occupant) {
    return (
      <div className="flex items-center gap-1.5">
        <Badge variant="secondary" className="text-[10px]">
          VACANT
        </Badge>
        {occupancy?.hasPendingTransfer && (
          <OccupancyBadge occupancy={occupancy} className="text-[10px]" />
        )}
      </div>
    );
  }

  // The account entity belongs to the INDEXED occupant, so it only describes
  // the address we're showing when we haven't resolved past it.
  const account = occupancy?.isResolvedAhead ? null : slot.occupantAccount;

  return (
    <div className="flex items-center gap-1.5">
      <span className="inline-flex items-center gap-1.5">
        {account && <AccountTypeIcon type={account.type} className="h-3 w-3" />}
        {truncateAddress(occupant)}
      </span>
      {(occupancy?.isResolvedAhead || occupancy?.hasPendingTransfer) && (
        <OccupancyBadge occupancy={occupancy} className="text-[10px]" />
      )}
    </div>
  );
}
