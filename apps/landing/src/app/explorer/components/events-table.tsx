"use client";

import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useV3AllEvents } from "@/hooks/use-v3";
import { truncateAddress } from "@/utils";

const EXPLORER = "https://sepolia.basescan.org";

export function EventsTable() {
  const { data: events, isLoading } = useV3AllEvents();

  if (isLoading) {
    return (
      <div className="border-2 border-black p-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-6 bg-gray-100 animate-pulse mb-2" />
        ))}
      </div>
    );
  }

  return (
    <div className="border-2 border-black">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-black bg-gray-50">
              <th className="px-4 py-2 text-left font-mono text-[10px] uppercase text-gray-500">Type</th>
              <th className="px-4 py-2 text-left font-mono text-[10px] uppercase text-gray-500">Slot</th>
              <th className="px-4 py-2 text-left font-mono text-[10px] uppercase text-gray-500">Actor</th>
              <th className="px-4 py-2 text-left font-mono text-[10px] uppercase text-gray-500">Time</th>
              <th className="px-4 py-2 text-left font-mono text-[10px] uppercase text-gray-500">Tx</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {(!events || events.length === 0) ? (
              <tr>
                <td colSpan={5} className="text-center text-gray-400 py-8 font-mono text-xs">
                  No events found
                </td>
              </tr>
            ) : (
              events.map((ev) => (
                <tr key={ev.id} className="font-mono text-xs">
                  <td className="px-4 py-2">
                    <span className="inline-block px-1.5 py-0.5 border border-black text-[10px] font-bold uppercase">
                      {ev.type}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <Link href={`/slots/${ev.slot.id}`} className="text-blue-600 hover:underline">
                      {truncateAddress(ev.slot.id)}
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    <a
                      href={`${EXPLORER}/address/${ev.actor}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {truncateAddress(ev.actor)}
                    </a>
                  </td>
                  <td className="px-4 py-2 text-gray-500">
                    {formatDistanceToNow(new Date(Number(ev.timestamp) * 1000), { addSuffix: true })}
                  </td>
                  <td className="px-4 py-2">
                    <a
                      href={`${EXPLORER}/tx/${ev.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
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
