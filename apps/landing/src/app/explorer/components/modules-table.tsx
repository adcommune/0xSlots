"use client";

import { Badge } from "@/components/ui/badge";
import { useModules } from "@/hooks/use-v3";
import { truncateAddress } from "@/utils";
import { useChain } from "@/context/chain";

export function ModulesTable() {
  const { data: modules, isLoading, refetch, isFetching } = useModules();
  const { explorerUrl } = useChain();

  if (isLoading) {
    return (
      <div className="rounded-lg border p-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-6 bg-muted animate-pulse mb-2 rounded" />
        ))}
      </div>
    );
  }

  if (!modules || modules.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <p className="text-sm text-muted-foreground">No modules found</p>
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
                <tr key={m.id} className="text-sm hover:bg-muted/50">
                  <td className="px-4 py-2.5">
                    <a
                      href={`${explorerUrl}/address/${m.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-mono text-xs"
                      title={m.id}
                    >
                      {truncateAddress(m.id)}
                    </a>
                  </td>
                  <td className="px-4 py-2.5 font-medium">{m.name}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
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
