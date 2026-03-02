"use client";

import { EnsAddress } from "@/components/ens-address";
import { useV3Slots } from "@/hooks/use-v3";
import { truncateAddress, formatPrice } from "@/utils";

export function SlotsTable() {
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
                <th className="px-4 py-2 text-left font-mono text-[10px] uppercase text-gray-500">Recipient</th>
                <th className="px-4 py-2 text-left font-mono text-[10px] uppercase text-gray-500">Status</th>
                <th className="px-4 py-2 text-left font-mono text-[10px] uppercase text-gray-500">Occupant</th>
                <th className="px-4 py-2 text-right font-mono text-[10px] uppercase text-gray-500">Price</th>
                <th className="px-4 py-2 text-right font-mono text-[10px] uppercase text-gray-500">Tax</th>
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
                      <EnsAddress
                        address={slot.recipient}
                        href={`/recipient/${slot.recipient}`}
                        onClick={(e) => e.stopPropagation()}
                      />
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
