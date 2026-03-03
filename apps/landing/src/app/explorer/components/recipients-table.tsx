"use client";

import { useMemo } from "react";
import { EnsAddress } from "@/components/ens-address";
import { Badge } from "@/components/ui/badge";
import { useSlots } from "@/hooks/use-v3";
import { formatPrice } from "@/utils";

type RecipientRow = {
  address: string;
  totalSlots: number;
  occupied: number;
  vacant: number;
  totalPrice: bigint;
  currencyDecimals: number;
  currencySymbol: string;
};

export function RecipientsTable() {
  const { data: slots, isLoading, refetch, isFetching } = useSlots();

  const recipients = useMemo(() => {
    if (!slots) return [];

    const map = new Map<string, RecipientRow>();
    for (const slot of slots) {
      const addr = slot.recipient.toLowerCase();
      const existing = map.get(addr);
      const isOccupied = slot.occupant != null;
      if (existing) {
        existing.totalSlots += 1;
        if (isOccupied) {
          existing.occupied += 1;
          existing.totalPrice += BigInt(slot.price);
        } else {
          existing.vacant += 1;
        }
      } else {
        map.set(addr, {
          address: addr,
          totalSlots: 1,
          occupied: isOccupied ? 1 : 0,
          vacant: isOccupied ? 0 : 1,
          totalPrice: isOccupied ? BigInt(slot.price) : 0n,
          currencyDecimals: slot.currencyDecimals ?? 18,
          currencySymbol: slot.currencySymbol ?? "USDC",
        });
      }
    }

    return Array.from(map.values()).sort(
      (a, b) => b.totalSlots - a.totalSlots,
    );
  }, [slots]);

  if (isLoading) {
    return (
      <div className="rounded-lg border p-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-6 bg-muted animate-pulse mb-2 rounded" />
        ))}
      </div>
    );
  }

  if (recipients.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <p className="text-sm text-muted-foreground">No recipients found</p>
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
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  Recipient
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                  Slots
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                  Occupied
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                  Vacant
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                  Total Price
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {recipients.map((r) => (
                <tr
                  key={r.address}
                  className="text-sm hover:bg-muted/50 cursor-pointer"
                  onClick={() => {
                    window.location.href = `/recipient/${r.address}`;
                  }}
                >
                  <td className="px-4 py-2.5">
                    <EnsAddress
                      address={r.address}
                      href={`/recipient/${r.address}`}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs">
                    {r.totalSlots}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Badge variant="default" className="text-[10px]">
                      {r.occupied}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Badge variant="secondary" className="text-[10px]">
                      {r.vacant}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right font-bold font-mono text-xs">
                    {formatPrice(r.totalPrice.toString(), r.currencyDecimals)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
