"use client";

import { formatDistanceToNow } from "date-fns";
import { formatPrice, truncateAddress } from "@/utils";

type UnifiedEvent = {
  id: string;
  type: string;
  actor: string;
  detail: string;
  timestamp: number;
  tx: string;
};

const TYPE_COLORS: Record<string, string> = {
  Buy: "bg-green-500/10 text-green-600",
  Release: "bg-yellow-500/10 text-yellow-600",
  Liquidate: "bg-red-500/10 text-red-600",
  Price: "bg-blue-500/10 text-blue-600",
  Deposit: "bg-emerald-500/10 text-emerald-600",
  Withdraw: "bg-orange-500/10 text-orange-600",
  Collect: "bg-purple-500/10 text-purple-600",
  "Tax Proposed": "bg-indigo-500/10 text-indigo-600",
  "Module Proposed": "bg-cyan-500/10 text-cyan-600",
  "Update Cancelled": "bg-gray-500/10 text-gray-600",
};

export function normalizeSlotActivity(data: any, decimals: number = 6): UnifiedEvent[] {
  if (!data) return [];
  const events: UnifiedEvent[] = [];

  for (const e of data.boughtEvents ?? []) {
    events.push({
      id: e.id, type: "Buy", actor: e.buyer,
      detail: e.previousOccupant === "0x0000000000000000000000000000000000000000"
        ? `claimed @ ${formatPrice(e.selfAssessedPrice, decimals)}`
        : `force-bought @ ${formatPrice(e.price, decimals)} → ${formatPrice(e.selfAssessedPrice, decimals)}`,
      timestamp: Number(e.timestamp), tx: e.tx,
    });
  }
  for (const e of data.releasedEvents ?? []) {
    events.push({
      id: e.id, type: "Release", actor: e.occupant,
      detail: `refund ${formatPrice(e.refund, decimals)}`,
      timestamp: Number(e.timestamp), tx: e.tx,
    });
  }
  for (const e of data.liquidatedEvents ?? []) {
    events.push({
      id: e.id, type: "Liquidate", actor: e.liquidator,
      detail: `bounty ${formatPrice(e.bounty, decimals)}`,
      timestamp: Number(e.timestamp), tx: e.tx,
    });
  }
  for (const e of data.priceUpdatedEvents ?? []) {
    events.push({
      id: e.id, type: "Price", actor: "",
      detail: `${formatPrice(e.oldPrice, decimals)} → ${formatPrice(e.newPrice, decimals)}`,
      timestamp: Number(e.timestamp), tx: e.tx,
    });
  }
  for (const e of data.depositedEvents ?? []) {
    events.push({
      id: e.id, type: "Deposit", actor: e.depositor,
      detail: `+${formatPrice(e.amount, decimals)}`,
      timestamp: Number(e.timestamp), tx: e.tx,
    });
  }
  for (const e of data.withdrawnEvents ?? []) {
    events.push({
      id: e.id, type: "Withdraw", actor: e.occupant,
      detail: `-${formatPrice(e.amount, decimals)}`,
      timestamp: Number(e.timestamp), tx: e.tx,
    });
  }
  for (const e of data.taxCollectedEvents ?? []) {
    events.push({
      id: e.id, type: "Collect", actor: e.recipient,
      detail: `${formatPrice(e.amount, decimals)}`,
      timestamp: Number(e.timestamp), tx: e.tx,
    });
  }
  for (const e of data.taxUpdateProposedEvents ?? []) {
    events.push({
      id: e.id, type: "Tax Proposed", actor: "",
      detail: `→ ${(Number(e.newPercentage) / 100).toFixed(1)}%/mo`,
      timestamp: Number(e.timestamp), tx: e.tx,
    });
  }
  for (const e of data.moduleUpdateProposedEvents ?? []) {
    events.push({
      id: e.id, type: "Module Proposed", actor: "",
      detail: truncateAddress(e.newModule),
      timestamp: Number(e.timestamp), tx: e.tx,
    });
  }
  for (const e of data.pendingUpdateCancelledEvents ?? []) {
    events.push({
      id: e.id, type: "Update Cancelled", actor: "",
      detail: "",
      timestamp: Number(e.timestamp), tx: e.tx,
    });
  }

  return events.sort((a, b) => b.timestamp - a.timestamp);
}

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
                  <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${TYPE_COLORS[ev.type] ?? "bg-muted text-muted-foreground"}`}>
                    {ev.type}
                  </span>
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
