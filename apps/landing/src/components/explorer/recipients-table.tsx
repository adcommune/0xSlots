"use client";

import { AccountTypeIcon } from "@/components/account-type-icon";
import { EnsAddress } from "@/components/ens-address";
import { RefreshButton } from "@/components/refresh-button";
import { TablePagination, usePagination } from "@/components/table-pagination";
import { TableEmpty, TableSkeleton } from "@/components/table-states";
import { useAccounts } from "@/hooks/use-v3";

export function RecipientsTable() {
  const { data: accounts, isLoading, refetch, isFetching } = useAccounts();
  const { page, setPage, pageSize, setPageSize, totalPages, paged } =
    usePagination(accounts ?? []);

  if (isLoading) return <TableSkeleton />;
  if (!accounts || accounts.length === 0) return <TableEmpty message="No recipients found" />;

  return (
    <div>
      <RefreshButton onRefresh={() => refetch()} isFetching={isFetching} />
      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  Recipient
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  Slots
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paged.map((a) => {
                const accountType = a.type;
                return (
                  <tr
                    key={a.id}
                    className="text-sm even:bg-muted/30 hover:bg-muted/50 cursor-pointer"
                    onClick={() => {
                      window.location.href = `/recipient/${a.id}`;
                    }}
                  >
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-1.5">
                        <AccountTypeIcon
                          type={accountType}
                          className="h-3 w-3"
                        />
                        <EnsAddress address={a.id} />
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <div className="flex gap-px">
                          {Array.from({ length: a.slotCount }).map((_, i) => (
                            <span
                              key={i}
                              className={`block w-2 h-2 ${i < a.occupiedCount ? "animate-pulse bg-green-600" : "bg-muted-foreground/25"}`}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {a.occupiedCount}/{a.slotCount} occupied
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <TablePagination
          page={page}
          totalPages={totalPages}
          pageSize={pageSize}
          total={accounts.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>
    </div>
  );
}
