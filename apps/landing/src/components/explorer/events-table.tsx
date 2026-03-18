"use client";

import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

import { EventTypeBadge } from "@/components/event-type-badge";
import { TablePagination, usePagination } from "@/components/table-pagination";
import { TableEmpty, TableSkeleton } from "@/components/table-states";
import { useChain } from "@/context/chain";
import { useRecentEvents } from "@/hooks/use-v3";
import { normalizeEvents } from "@/lib/normalize-events";
import { truncateAddress } from "@/utils";


export function EventsTable() {
  const { data, isLoading } = useRecentEvents();
  const { explorerUrl } = useChain();
  const events = normalizeEvents(data);
  const { page, setPage, pageSize, setPageSize, totalPages, paged } = usePagination(events);

  if (isLoading) return <TableSkeleton />;
  if (events.length === 0) return <TableEmpty message="No events yet" />;

  return (
    <div className="rounded-lg border">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="px-4 py-2.5">Type</th>
              <th className="px-4 py-2.5">Slot</th>
              <th className="px-4 py-2.5">Actor</th>
              <th className="px-4 py-2.5">Detail</th>
              <th className="px-4 py-2.5">Time</th>
              <th className="px-4 py-2.5">Tx</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {paged.map((ev) => (
              <tr key={ev.id} className="even:bg-muted/30 hover:bg-muted/50 transition-colors">
                <td className="px-4 py-2.5">
                  <EventTypeBadge type={ev.type} />
                </td>
                <td className="px-4 py-2.5">
                  <Link
                    href={`/slots/${ev.slot}`}
                    className="text-primary hover:underline text-xs"
                  >
                    {truncateAddress(ev.slot ?? "")}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-xs">
                  {ev.actor ? (
                    <Link
                      href={`/recipient/${ev.actor}`}
                      className="text-primary hover:underline"
                    >
                      {truncateAddress(ev.actor)}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{ev.detail}</td>
                <td className="px-4 py-2.5 text-muted-foreground text-xs whitespace-nowrap">
                  {formatDistanceToNow(new Date(ev.timestamp * 1000), {
                    addSuffix: true,
                  })}
                </td>
                <td className="px-4 py-2.5">
                  <a
                    href={`${explorerUrl}/tx/${ev.tx}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-xs"
                  >
                    {truncateAddress(ev.tx)}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePagination page={page} totalPages={totalPages} pageSize={pageSize} total={events.length} onPageChange={setPage} onPageSizeChange={setPageSize} />
    </div>
  );
}
