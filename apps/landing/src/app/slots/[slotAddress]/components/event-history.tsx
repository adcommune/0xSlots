"use client";

import { formatDistanceToNow } from "date-fns";
import { truncateAddress, formatPrice } from "@/utils";

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
    <div className="border-2 border-black">
      <div className="bg-gray-50 border-b-2 border-black p-4">
        <h2 className="text-sm font-bold uppercase tracking-tight">Event History</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-4 py-2 text-left font-mono text-[10px] uppercase text-gray-500">Type</th>
              <th className="px-4 py-2 text-left font-mono text-[10px] uppercase text-gray-500">Actor</th>
              <th className="px-4 py-2 text-left font-mono text-[10px] uppercase text-gray-500">Amount</th>
              <th className="px-4 py-2 text-left font-mono text-[10px] uppercase text-gray-500">Time</th>
              <th className="px-4 py-2 text-left font-mono text-[10px] uppercase text-gray-500">Tx</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {(!events || events.length === 0) ? (
              <tr><td colSpan={5} className="text-center text-gray-400 py-6 font-mono text-xs">No events yet</td></tr>
            ) : events.map((ev) => (
              <tr key={ev.id} className="font-mono text-[11px]">
                <td className="px-4 py-2">
                  <span className="inline-block px-1.5 py-0.5 border border-black text-[10px] font-bold uppercase">{ev.type}</span>
                </td>
                <td className="px-4 py-2">
                  <a href={`${EXPLORER}/address/${ev.actor}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {truncateAddress(ev.actor)}
                  </a>
                </td>
                <td className="px-4 py-2">{ev.amount ? formatPrice(ev.amount, 6) : "—"}</td>
                <td className="px-4 py-2 text-gray-500">
                  {formatDistanceToNow(new Date(Number(ev.timestamp) * 1000), { addSuffix: true })}
                </td>
                <td className="px-4 py-2">
                  <a href={`${EXPLORER}/tx/${ev.txHash}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
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
