"use client";

import { formatDistanceToNow } from "date-fns";

import { EventTypeBadge } from "@/components/event-type-badge";
import { formatPrice, truncateAddress } from "@/utils";

type UnifiedEvent = {
  id: string;
  type: string;
  actor: string;
  detail: string;
  timestamp: number;
  tx: string;
};


export function normalizeSlotActivity(data: any): UnifiedEvent[] {
  if (!data) return [];
  const events: UnifiedEvent[] = [];

  for (const e of data.boughtEvents ?? []) {
    const d = e.currency?.decimals ?? 6;
    const s = e.currency?.symbol ?? "";
    events.push({
      id: e.id, type: "Buy", actor: e.buyer,
      detail: e.previousOccupant === "0x0000000000000000000000000000000000000000"
        ? `claimed @ ${formatPrice(e.selfAssessedPrice, d)} ${s}`
        : `force-bought @ ${formatPrice(e.price, d)} → ${formatPrice(e.selfAssessedPrice, d)} ${s}`,
      timestamp: Number(e.timestamp), tx: e.tx,
    });
  }
  for (const e of data.releasedEvents ?? []) {
    const s = e.currency?.symbol ?? "";
    events.push({
      id: e.id, type: "Release", actor: e.occupant,
      detail: `refund ${formatPrice(e.refund, e.currency?.decimals ?? 6)} ${s}`,
      timestamp: Number(e.timestamp), tx: e.tx,
    });
  }
  for (const e of data.liquidatedEvents ?? []) {
    const s = e.currency?.symbol ?? "";
    events.push({
      id: e.id, type: "Liquidate", actor: e.liquidator,
      detail: `bounty ${formatPrice(e.bounty, e.currency?.decimals ?? 6)} ${s}`,
      timestamp: Number(e.timestamp), tx: e.tx,
    });
  }
  for (const e of data.priceUpdatedEvents ?? []) {
    const d = e.currency?.decimals ?? 6;
    const s = e.currency?.symbol ?? "";
    events.push({
      id: e.id, type: "Price", actor: "",
      detail: `${formatPrice(e.oldPrice, d)} → ${formatPrice(e.newPrice, d)} ${s}`,
      timestamp: Number(e.timestamp), tx: e.tx,
    });
  }
  for (const e of data.depositedEvents ?? []) {
    const s = e.currency?.symbol ?? "";
    events.push({
      id: e.id, type: "Deposit", actor: e.depositor,
      detail: `+${formatPrice(e.amount, e.currency?.decimals ?? 6)} ${s}`,
      timestamp: Number(e.timestamp), tx: e.tx,
    });
  }
  for (const e of data.withdrawnEvents ?? []) {
    const s = e.currency?.symbol ?? "";
    events.push({
      id: e.id, type: "Withdraw", actor: e.occupant,
      detail: `-${formatPrice(e.amount, e.currency?.decimals ?? 6)} ${s}`,
      timestamp: Number(e.timestamp), tx: e.tx,
    });
  }
  for (const e of data.taxCollectedEvents ?? []) {
    const s = e.currency?.symbol ?? "";
    events.push({
      id: e.id, type: "Collect", actor: e.recipient,
      detail: `${formatPrice(e.amount, e.currency?.decimals ?? 6)} ${s}`,
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
