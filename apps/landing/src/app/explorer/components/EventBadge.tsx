import { Badge } from "@/components/ui/badge";
import type { EventType } from "@/types";

function EventBadge({ type }: { type: EventType }) {
  const labels: Record<EventType, string> = {
    landOpened: "Land Opened",
    slotCreated: "Slot Created",
    slotPurchased: "Slot Purchased",
    slotReleased: "Slot Released",
    priceUpdated: "Price Updated",
  };

  return (
    <Badge variant={type} className="font-mono text-[10px] uppercase">
      {labels[type]}
    </Badge>
  );
}

export default EventBadge;
