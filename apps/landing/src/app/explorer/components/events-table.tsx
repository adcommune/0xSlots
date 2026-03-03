"use client";

import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useV3RecentEvents } from "@/hooks/use-v3";
import { useChain } from "@/context/chain";
import { truncateAddress, formatPrice } from "@/utils";

type UnifiedEvent = {
  id: string;
  type: string;
  slot: string;
  actor: string;
  detail: string;
  timestamp: number;
  tx: string;
};

function normalizeEvents(data: ReturnType<typeof useV3RecentEvents>["data"]): UnifiedEvent[] {
  if (!data) return [];
  const events: UnifiedEvent[] = [];

  for (const e of data.boughtEvents) {
    events.push({
      id: e.id, type: "Buy", slot: e.slot.id, actor: e.buyer,
      detail: e.previousOccupant === "0x0000000000000000000000000000000000000000"
        ? `claimed @ ${formatPrice(e.selfAssessedPrice, 6)}`
        : `force-bought @ ${formatPrice(e.price, 6)} → ${formatPrice(e.selfAssessedPrice, 6)}`,
      timestamp: Number(e.timestamp), tx: e.tx,
    });
  }
  for (const e of data.releasedEvents) {
    events.push({
      id: e.id, type: "Release", slot: e.slot.id, actor: e.occupant,
      detail: `refund ${formatPrice(e.refund, 6)}`,
      timestamp: Number(e.timestamp), tx: e.tx,
    });
  }
  for (const e of data.liquidatedEvents) {
    events.push({
      id: e.id, type: "Liquidate", slot: e.slot.id, actor: e.liquidator,
      detail: `bounty ${formatPrice(e.bounty, 6)}`,
      timestamp: Number(e.timestamp), tx: e.tx,
    });
  }
  for (const e of data.priceUpdatedEvents) {
    events.push({
      id: e.id, type: "Price", slot: e.slot.id, actor: "",
      detail: `${formatPrice(e.oldPrice, 6)} → ${formatPrice(e.newPrice, 6)}`,
      timestamp: Number(e.timestamp), tx: e.tx,
    });
  }
  for (const e of data.depositedEvents) {
    events.push({
      id: e.id, type: "Deposit", slot: e.slot.id, actor: e.depositor,
      detail: `+${formatPrice(e.amount, 6)}`,
      timestamp: Number(e.timestamp), tx: e.tx,
    });
  }
  for (const e of data.withdrawnEvents) {
    events.push({
      id: e.id, type: "Withdraw", slot: e.slot.id, actor: e.occupant,
      detail: `-${formatPrice(e.amount, 6)}`,
      timestamp: Number(e.timestamp), tx: e.tx,
    });
  }
  for (const e of data.taxCollectedEvents) {
    events.push({
      id: e.id, type: "Collect", slot: e.slot.id, actor: e.recipient,
      detail: `${formatPrice(e.amount, 6)}`,
      timestamp: Number(e.timestamp), tx: e.tx,
    });
  }

  return events.sort((a, b) => b.timestamp - a.timestamp);
}

const TYPE_COLORS: Record<string, string> = {
  Buy: "bg-green-500/10 text-green-600",
  Release: "bg-yellow-500/10 text-yellow-600",
  Liquidate: "bg-red-500/10 text-red-600",
  Price: "bg-blue-500/10 text-blue-600",
  Deposit: "bg-emerald-500/10 text-emerald-600",
  Withdraw: "bg-orange-500/10 text-orange-600",
  Collect: "bg-purple-500/10 text-purple-600",
};

export function EventsTable() {
  const { data, isLoading } = useV3RecentEvents();
  const { explorerUrl } = useChain();
  const events = normalizeEvents(data);

  if (isLoading) {
    return (
      <div className="rounded-lg border p-8 text-center animate-pulse">
        <p className="text-sm text-muted-foreground">Loading events...</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground text-sm">
        No events yet
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            <th className="px-4 py-2.5">Type</th>
            <th className="px-4 py-2.5">Slot</th>
            <th className="px-4 py-2.5">Actor</th>
            <th className="px-4 py-2.5">Detail</th>
            <th className="px-4 py-2.5">Time</th>
            <th className="px-4 py-2.5">Tx</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {events.map((ev) => (
            <tr key={ev.id} className="hover:bg-muted/30 transition-colors">
              <td className="px-4 py-2.5">
                <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${TYPE_COLORS[ev.type] ?? "bg-muted text-muted-foreground"}`}>
                  {ev.type}
                </span>
              </td>
              <td className="px-4 py-2.5">
                <Link href={`/slots/${ev.slot}`} className="text-primary hover:underline font-mono text-xs">
                  {truncateAddress(ev.slot)}
                </Link>
              </td>
              <td className="px-4 py-2.5 font-mono text-xs">
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
                <a href={`${explorerUrl}/tx/${ev.tx}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-mono text-xs">
                  {truncateAddress(ev.tx)}
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
