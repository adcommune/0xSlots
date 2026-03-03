"use client";

import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { formatUnits } from "viem";
import { Badge } from "@/components/ui/badge";
import { formatPrice, truncateAddress } from "@/utils";
import type { V3Slot } from "@/hooks/use-v3";

export function RecipientSlotsTable({
  slots,
  isLoading,
}: {
  slots: V3Slot[] | undefined;
  isLoading: boolean;
}) {
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
        <p className="text-sm text-muted-foreground">
          No slots found for this recipient
        </p>
      </div>
    );
  }

  console.log({ slots });

  return (
    <div className="rounded-lg border">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                Slot
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                Occupant
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                Price
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                Tax
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                Deposit
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                Collected
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {slots.map((slot) => (
              <tr
                key={slot.id}
                className="text-sm hover:bg-muted/50 cursor-pointer"
                onClick={() => {
                  window.location.href = `/slots/${slot.id}`;
                }}
              >
                <td className="px-4 py-2.5">
                  <Link
                    href={`/slots/${slot.id}`}
                    className="text-primary hover:underline font-mono text-xs"
                  >
                    {truncateAddress(slot.id)}
                  </Link>
                </td>
                <td className="px-4 py-2.5">
                  <Badge
                    variant={slot.occupant != null ? "default" : "secondary"}
                    className="text-[10px]"
                  >
                    {slot.occupant == null ? "VACANT" : "OCCUPIED"}
                  </Badge>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground font-mono text-xs">
                  {slot.occupant != null && slot.occupant
                    ? truncateAddress(slot.occupant)
                    : "—"}
                </td>
                <td className="px-4 py-2.5 text-right font-bold font-mono text-xs">
                  {slot.occupant != null ? formatPrice(slot.price, slot.currencyDecimals ?? 18) : "0"}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-xs">
                  {Number(slot.taxPercentage) / 100}%
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-xs">
                  {formatUnits(BigInt(slot.deposit), slot.currencyDecimals ?? 6)}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-xs">
                  {formatUnits(
                    BigInt(slot.totalCollected),
                    slot.currencyDecimals ?? 6,
                  )}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground text-xs">
                  {formatDistanceToNow(
                    new Date(Number(slot.createdAt) * 1000),
                    { addSuffix: true },
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
