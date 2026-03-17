"use client";

import { RefreshButton } from "@/components/refresh-button";
import { TableEmpty, TableSkeleton } from "@/components/table-states";
import { Badge } from "@/components/ui/badge";
import { useChain } from "@/context/chain";
import { useModules } from "@/hooks/use-v3";
import { truncateAddress } from "@/utils";

export function ModulesTable() {
  const { data: modules, isLoading, refetch, isFetching } = useModules();
  const { explorerUrl } = useChain();

  if (isLoading) return <TableSkeleton rows={3} />;
  if (!modules || modules.length === 0) return <TableEmpty message="No modules found" />;

  return (
    <div>
      <RefreshButton onRefresh={() => refetch()} isFetching={isFetching} />
      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  Address
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  Name
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  Version
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {modules.map((m) => (
                <tr key={m.id} className="text-sm even:bg-muted/30 hover:bg-muted/50">
                  <td className="px-4 py-2.5">
                    <a
                      href={`${explorerUrl}/address/${m.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-xs"
                      title={m.id}
                    >
                      {truncateAddress(m.id)}
                    </a>
                  </td>
                  <td className="px-4 py-2.5 font-medium">{m.name}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {m.version}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Badge
                      variant={m.verified ? "default" : "secondary"}
                      className={`text-[10px] ${m.verified ? "border-green-200 bg-green-50 text-green-700" : ""}`}
                    >
                      {m.verified ? "VERIFIED" : "UNVERIFIED"}
                    </Badge>
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
