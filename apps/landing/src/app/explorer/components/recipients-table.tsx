"use client";

import { EnsAddress } from "@/components/ens-address";
import { Badge } from "@/components/ui/badge";
import { useAccounts } from "@/hooks/use-v3";

export function RecipientsTable() {
  const { data: accounts, isLoading, refetch, isFetching } = useAccounts();

  if (isLoading) {
    return (
      <div className="rounded-lg border p-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-6 bg-muted animate-pulse mb-2 rounded" />
        ))}
      </div>
    );
  }

  if (!accounts || accounts.length === 0) {
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
              </tr>
            </thead>
            <tbody className="divide-y">
              {accounts.map((a) => {
                const vacant = a.slotCount - a.occupiedCount;
                return (
                  <tr
                    key={a.id}
                    className="text-sm hover:bg-muted/50 cursor-pointer"
                    onClick={() => {
                      window.location.href = `/recipient/${a.id}`;
                    }}
                  >
                    <td className="px-4 py-2.5">
                      <EnsAddress
                        address={a.id}
                        href={`/recipient/${a.id}`}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs">
                      {a.slotCount}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Badge variant="default" className="text-[10px]">
                        {a.occupiedCount}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Badge variant="secondary" className="text-[10px]">
                        {vacant}
                      </Badge>
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
