"use client";

import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { ConnectButton } from "@/components/connect-button";
import { ExplorerTabs } from "@/components/explorer-tabs";
import { useV3AllEvents, useV3Factory, useV3Slots } from "@/hooks/use-v3";
import { truncateAddress, formatPrice } from "@/utils";

const EXPLORER = "https://sepolia.basescan.org";

function StatsBar() {
  const { data: factory } = useV3Factory();
  const { data: slots } = useV3Slots();
  const vacant = slots?.filter((s) => s.isVacant).length ?? 0;
  const occupied = (slots?.length ?? 0) - vacant;

  return (
    <div className="flex items-center gap-5">
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[10px] uppercase text-gray-500">Slots</span>
        <span className="font-mono text-sm font-black">{factory?.slotCount ?? 0}</span>
      </div>
      <div className="w-px h-3 bg-gray-300" />
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[10px] uppercase text-gray-500">Occupied</span>
        <span className="font-mono text-sm font-black">{occupied}</span>
      </div>
      <div className="w-px h-3 bg-gray-300" />
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[10px] uppercase text-gray-500">Vacant</span>
        <span className="font-mono text-sm font-black">{vacant}</span>
      </div>
    </div>
  );
}

function SlotsTable() {
  const { data: slots, isLoading, refetch, isFetching } = useV3Slots();

  if (isLoading) {
    return (
      <div className="border-2 border-black p-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-6 bg-gray-100 animate-pulse mb-2" />
        ))}
      </div>
    );
  }

  if (!slots || slots.length === 0) {
    return (
      <div className="border-2 border-black p-8 text-center">
        <p className="font-mono text-xs text-gray-500">NO SLOTS FOUND</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="font-mono text-[10px] text-gray-400 hover:text-black disabled:opacity-50"
        >
          {isFetching ? "REFRESHING..." : "↻ REFRESH"}
        </button>
      </div>
      <div className="border-2 border-black">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-black bg-gray-50">
                <th className="px-4 py-2 text-left font-mono text-[10px] uppercase text-gray-500">Slot</th>
                <th className="px-4 py-2 text-left font-mono text-[10px] uppercase text-gray-500">Status</th>
                <th className="px-4 py-2 text-left font-mono text-[10px] uppercase text-gray-500">Occupant</th>
                <th className="px-4 py-2 text-right font-mono text-[10px] uppercase text-gray-500">Price</th>
                <th className="px-4 py-2 text-right font-mono text-[10px] uppercase text-gray-500">Tax</th>
                <th className="px-4 py-2 text-left font-mono text-[10px] uppercase text-gray-500">Recipient</th>
                <th className="px-4 py-2 text-left font-mono text-[10px] uppercase text-gray-500">Flags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {slots.map((slot) => {
                const isOccupied = !slot.isVacant;
                const hasPending = slot.hasPendingTaxUpdate || slot.hasPendingModuleUpdate;
                return (
                  <tr key={slot.id} className="font-mono text-xs hover:bg-gray-50 cursor-pointer" onClick={() => window.location.href = `/slots/${slot.id}`}>
                    <td className="px-4 py-2">
                      <Link href={`/slots/${slot.id}`} className="text-blue-600 hover:underline">
                        {truncateAddress(slot.id)}
                      </Link>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`inline-block px-1.5 py-0.5 border text-[10px] font-bold ${
                        isOccupied ? "border-black bg-black text-white" : "border-gray-400 text-gray-500"
                      }`}>
                        {isOccupied ? "OCCUPIED" : "VACANT"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-600">
                      {isOccupied && slot.occupant ? truncateAddress(slot.occupant) : "—"}
                    </td>
                    <td className="px-4 py-2 text-right font-bold">
                      {isOccupied ? formatPrice(slot.price, 6) : "0"}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {Number(slot.taxPercentage) / 100}%
                    </td>
                    <td className="px-4 py-2 text-gray-600">
                      {truncateAddress(slot.recipient)}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1">
                        {slot.mutableTax && <span className="text-[9px] px-1 py-0.5 border border-gray-300 text-gray-500">TAX</span>}
                        {slot.mutableModule && <span className="text-[9px] px-1 py-0.5 border border-gray-300 text-gray-500">MOD</span>}
                        {hasPending && <span className="text-[9px] px-1 py-0.5 border border-yellow-500 text-yellow-700 bg-yellow-50">PENDING</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function EventsTable() {
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

export default function ExplorerPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b-4 border-black bg-linear-to-br from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <h1 className="text-xl font-black tracking-tighter uppercase leading-tight">
                  Explorer
                </h1>
                <p className="text-gray-400 font-mono text-[10px]">
                  Base Sepolia · v3
                </p>
              </div>
              <div className="w-px h-6 bg-gray-300" />
              <StatsBar />
            </div>
            <div className="flex items-center gap-3">
              <ConnectButton />
              <Link
                href="/explorer/create"
                className="border-2 border-black bg-black text-white px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-black transition-colors"
              >
                + Create Slot
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-4">
        <ExplorerTabs
          tabs={[
            {
              id: "slots",
              label: "Slots",
              content: () => <SlotsTable />,
            },
            {
              id: "events",
              label: "Events",
              content: () => <EventsTable />,
            },
          ]}
        />

        <div className="mt-8 text-center text-xs text-gray-400 font-mono">
          Powered by 0xSlots v3 · The Graph
        </div>
      </div>
    </div>
  );
}
