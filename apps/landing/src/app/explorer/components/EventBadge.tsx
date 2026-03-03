import { Badge } from "@/components/ui/badge";
import type { EventType } from "@/types";

function EventBadge({ type }: { type: EventType }) {
  const labels: Record<EventType, string> = {
    // V3
    Buy: "Buy",
    Release: "Release",
    Liquidate: "Liquidate",
    PriceUpdate: "Price Update",
    Deposit: "Deposit",
    Withdraw: "Withdraw",
    TaxCollect: "Tax Collect",
    Settle: "Settle",
    TaxProposed: "Tax Proposed",
    ModuleProposed: "Module Proposed",
    UpdateCancelled: "Cancelled",
    UpdateApplied: "Applied",
    LiquidationBountyUpdated: "Bounty Updated",
    // V2
    landOpened: "Land Opened",
    slotCreated: "Slot Created",
    slotPurchased: "Slot Purchased",
    slotReleased: "Slot Released",
    priceUpdated: "Price Updated",
  };

  return (
    <Badge variant={type} className="text-[10px] font-semibold uppercase">
      {labels[type]}
    </Badge>
  );
}

export default EventBadge;
