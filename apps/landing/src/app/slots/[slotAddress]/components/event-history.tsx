"use client";

import { formatDistanceToNow } from "date-fns";

import { EventTypeBadge } from "@/components/event-type-badge";
import type { UnifiedEvent } from "@/lib/normalize-events";
import { truncateAddress } from "@/utils";

export { normalizeEvents as normalizeSlotActivity } from "@/lib/normalize-events";

export function SlotEventHistory({ events, explorerUrl }: { events: UnifiedEvent[]; explorerUrl: string }) {
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Type</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Actor</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Detail</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Time</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Tx</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {events.length === 0 ? (
              <tr><td colSpan={5} className="text-center text-muted-foreground py-6 text-sm">No activity yet</td></tr>
            ) : events.map((ev) => (
              <tr key={ev.id} className="text-sm hover:bg-muted/30 transition-colors">
                <td className="px-4 py-2.5">
                  <EventTypeBadge type={ev.type} />
                </td>
                <td className="px-4 py-2.5 text-xs">
                  {ev.actor ? (
                    <a href={`${explorerUrl}/address/${ev.actor}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {truncateAddress(ev.actor)}
                    </a>
                  ) : "—"}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{ev.detail}</td>
                <td className="px-4 py-2.5 text-muted-foreground text-xs whitespace-nowrap">
                  {formatDistanceToNow(new Date(ev.timestamp * 1000), { addSuffix: true })}
                </td>
                <td className="px-4 py-2.5">
                  <a href={`${explorerUrl}/tx/${ev.tx}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs">
                    {truncateAddress(ev.tx)}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
