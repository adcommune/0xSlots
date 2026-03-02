"use client";

import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { truncateAddress, formatPrice } from "@/utils";

interface RecipientSlot {
  id: string;
  isVacant: boolean;
  occupant?: string | null;
  price: string;
  taxPercentage: string;
  deposit: string;
  collectedTax: string;
  createdAt: string;
}

export function RecipientSlotsTable({ slots, isLoading }: { slots: RecipientSlot[] | undefined; isLoading: boolean }) {
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
        <p className="font-mono text-xs text-gray-500">
          NO SLOTS FOUND FOR THIS RECIPIENT
        </p>
      </div>
    );
  }

  return (
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
              <th className="px-4 py-2 text-right font-mono text-[10px] uppercase text-gray-500">Deposit</th>
              <th className="px-4 py-2 text-right font-mono text-[10px] uppercase text-gray-500">Collected</th>
              <th className="px-4 py-2 text-left font-mono text-[10px] uppercase text-gray-500">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {slots.map((slot) => (
              <tr
                key={slot.id}
                className="font-mono text-xs hover:bg-gray-50 cursor-pointer"
                onClick={() => (window.location.href = `/slots/${slot.id}`)}
              >
                <td className="px-4 py-2">
                  <Link href={`/slots/${slot.id}`} className="text-blue-600 hover:underline">
                    {truncateAddress(slot.id)}
                  </Link>
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-block px-1.5 py-0.5 border text-[10px] font-bold ${
                      !slot.isVacant
                        ? "border-black bg-black text-white"
                        : "border-gray-400 text-gray-500"
                    }`}
                  >
                    {slot.isVacant ? "VACANT" : "OCCUPIED"}
                  </span>
                </td>
                <td className="px-4 py-2 text-gray-600">
                  {!slot.isVacant && slot.occupant ? truncateAddress(slot.occupant) : "—"}
                </td>
                <td className="px-4 py-2 text-right font-bold">
                  {!slot.isVacant ? formatPrice(slot.price, 6) : "0"}
                </td>
                <td className="px-4 py-2 text-right">
                  {Number(slot.taxPercentage) / 100}%
                </td>
                <td className="px-4 py-2 text-right">
                  {formatPrice(slot.deposit, 6)}
                </td>
                <td className="px-4 py-2 text-right">
                  {formatPrice(slot.collectedTax, 6)}
                </td>
                <td className="px-4 py-2 text-gray-500">
                  {formatDistanceToNow(new Date(Number(slot.createdAt) * 1000), { addSuffix: true })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
