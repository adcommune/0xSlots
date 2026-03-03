"use client";

import { formatDistanceToNow } from "date-fns";
import EventBadge from "@/app/explorer/components/EventBadge";
import type { EventType } from "@/types";
import { formatPrice, truncateAddress } from "@/utils";

const EXPLORER = "https://sepolia.basescan.org";

interface SlotEvent {
  id: string;
  type: string;
  actor: string;
  amount?: string | null;
  timestamp: string;
  txHash: string;
}

export function SlotEventHistory({ events }: { events: SlotEvent[] | undefined }) {
  return (
    <div className="rounded-lg border">
      <div className="bg-muted/50 border-b px-4 py-3">
        <h2 className="text-sm font-semibold">Event History</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Type</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Actor</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Amount</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Time</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Tx</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(!events || events.length === 0) ? (
              <tr><td colSpan={5} className="text-center text-muted-foreground py-6 text-sm">No events yet</td></tr>
            ) : events.map((ev) => (
              <tr key={ev.id} className="text-sm">
                <td className="px-4 py-2.5">
                  <EventBadge type={ev.type as EventType} />
                </td>
                <td className="px-4 py-2.5">
                  <a href={`${EXPLORER}/address/${ev.actor}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-mono text-xs">
                    {truncateAddress(ev.actor)}
                  </a>
                </td>
                <td className="px-4 py-2.5">{ev.amount ? formatPrice(ev.amount, 6) : "—"}</td>
                <td className="px-4 py-2.5 text-muted-foreground text-xs">
                  {formatDistanceToNow(new Date(Number(ev.timestamp) * 1000), { addSuffix: true })}
                </td>
                <td className="px-4 py-2.5">
                  <a href={`${EXPLORER}/tx/${ev.txHash}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-mono text-xs">
                    {truncateAddress(ev.txHash)}
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
