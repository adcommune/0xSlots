"use client";

import { formatDistanceToNow } from "date-fns";
import { formatPrice, truncateAddress } from "@/utils";

interface Purchase {
  id: string;
  buyer: string;
  previousOccupant: string;
  price: string;
  deposit: string;
  selfAssessedPrice: string;
  timestamp: string;
  tx: string;
}

export function SlotEventHistory({ events, explorerUrl, decimals = 6 }: { events: Purchase[] | undefined; explorerUrl: string; decimals?: number }) {
  return (
    <div className="rounded-lg border">
      <div className="bg-muted/50 border-b px-4 py-3">
        <h2 className="text-sm font-semibold">Purchase History</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Buyer</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Price Paid</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Self-Assessed</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Deposit</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Time</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Tx</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(!events || events.length === 0) ? (
              <tr><td colSpan={6} className="text-center text-muted-foreground py-6 text-sm">No purchases yet</td></tr>
            ) : events.map((ev) => (
              <tr key={ev.id} className="text-sm">
                <td className="px-4 py-2.5">
                  <a href={`${explorerUrl}/address/${ev.buyer}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-mono text-xs">
                    {truncateAddress(ev.buyer)}
                  </a>
                </td>
                <td className="px-4 py-2.5">{formatPrice(ev.price, decimals)}</td>
                <td className="px-4 py-2.5">{formatPrice(ev.selfAssessedPrice, decimals)}</td>
                <td className="px-4 py-2.5">{formatPrice(ev.deposit, decimals)}</td>
                <td className="px-4 py-2.5 text-muted-foreground text-xs">
                  {formatDistanceToNow(new Date(Number(ev.timestamp) * 1000), { addSuffix: true })}
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
    </div>
  );
}
