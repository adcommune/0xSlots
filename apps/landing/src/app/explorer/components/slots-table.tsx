"use client";

import { EnsAddress } from "@/components/ens-address";
import { Badge } from "@/components/ui/badge";
import { useV3Slots } from "@/hooks/use-v3";
import { truncateAddress, formatPrice } from "@/utils";

export function SlotsTable() {
  const { data: slots, isLoading, refetch, isFetching } = useV3Slots();

  if (isLoading) {
    return (
      <div className="rounded-lg border p-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-6 bg-muted animate-pulse mb-2 rounded" />
        ))}
      </div>
    );
  }

  if (!slots || slots.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <p className="text-sm text-muted-foreground">No slots found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
        >
          {isFetching ? "Refreshing..." : "Refresh"}
        </button>
      </div>
      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Recipient</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Occupant</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Price</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Tax</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Flags</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {slots.map((slot) => {
                const isOccupied = slot.occupant != null;
                return (
                  <tr key={slot.id} className="text-sm hover:bg-muted/50 cursor-pointer" onClick={() => { window.location.href = `/slots/${slot.id}`; }}>
                    <td className="px-4 py-2.5">
                      <EnsAddress
                        address={slot.recipient}
                        href={`/recipient/${slot.recipient}`}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge variant={isOccupied ? "default" : "secondary"} className="text-[10px]">
                        {isOccupied ? "OCCUPIED" : "VACANT"}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground font-mono text-xs">
                      {isOccupied && slot.occupant ? truncateAddress(slot.occupant) : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold font-mono text-xs">
                      {isOccupied ? formatPrice(slot.price, slot.currencyDecimals ?? 18) : "0"}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs">
                      {Number(slot.taxPercentage) / 100}%
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-1">
                        {slot.mutableTax && <Badge variant="outline" className="text-[9px]">TAX</Badge>}
                        {slot.mutableModule && <Badge variant="outline" className="text-[9px]">MOD</Badge>}
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
