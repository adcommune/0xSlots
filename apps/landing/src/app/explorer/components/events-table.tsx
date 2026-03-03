"use client";

import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import type { EventType } from "@/types";
import { useChain } from "@/context/chain";
import { useV3AllEvents } from "@/hooks/use-v3";
import { truncateAddress } from "@/utils";
import EventBadge from "./EventBadge";

export function EventsTable() {
  const { explorerUrl } = useChain();
  const { data: events, isLoading } = useV3AllEvents();

  if (isLoading) {
    return (
      <div className="rounded-lg border p-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-6 bg-muted animate-pulse mb-2 rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Type</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Slot</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Actor</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Time</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Tx</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(!events || events.length === 0) ? (
              <tr>
                <td colSpan={5} className="text-center text-muted-foreground py-8 text-sm">
                  No events found
                </td>
              </tr>
            ) : (
              events.map((ev) => (
                <tr key={ev.id} className="text-sm">
                  <td className="px-4 py-2.5">
                    <EventBadge type={ev.type as EventType} />
                  </td>
                  <td className="px-4 py-2.5">
                    <Link href={`/slots/${ev.slot.id}`} className="text-primary hover:underline font-mono text-xs">
                      {truncateAddress(ev.slot.id)}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">
                    <a
                      href={`${explorerUrl}/address/${ev.actor}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-mono text-xs"
                    >
                      {truncateAddress(ev.actor)}
                    </a>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">
                    {formatDistanceToNow(new Date(Number(ev.timestamp) * 1000), { addSuffix: true })}
                  </td>
                  <td className="px-4 py-2.5">
                    <a
                      href={`${explorerUrl}/tx/${ev.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-mono text-xs"
                    >
                      {truncateAddress(ev.txHash)}
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
