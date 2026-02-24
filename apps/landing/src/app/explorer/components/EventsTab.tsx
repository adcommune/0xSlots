"use client";

import { formatDistanceToNow } from "date-fns";
import type { SlotsChain } from "@0xslots/sdk";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useExplorerEvents } from "../hooks";
import EventBadge from "./EventBadge";
import { truncateAddress } from "@/utils";
import { CHAIN_CONFIG } from "@/lib/config";

export function EventsTab({ chainId }: { chainId: SlotsChain }) {
  const { data, isLoading } = useExplorerEvents(chainId);
  const config = CHAIN_CONFIG[chainId];
  const events = data?.events ?? [];

  if (isLoading) {
    return (
      <div className="border-2 border-black">
        <div className="bg-gray-50 border-b-2 border-black p-4">
          <h2 className="text-lg font-bold uppercase tracking-tight">
            Recent Events
          </h2>
        </div>
        <div className="p-8 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-6 bg-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-black">
      <div className="bg-gray-50 border-b-2 border-black p-4">
        <h2 className="text-lg font-bold uppercase tracking-tight">
          Recent Events
        </h2>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="border-b-2 border-black hover:bg-transparent">
            <TableHead className="font-bold uppercase text-xs">Type</TableHead>
            <TableHead className="font-bold uppercase text-xs">
              Details
            </TableHead>
            <TableHead className="font-bold uppercase text-xs">
              Actor
            </TableHead>
            <TableHead className="font-bold uppercase text-xs">Time</TableHead>
            <TableHead className="font-bold uppercase text-xs">Tx</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-gray-400 py-8"
              >
                No events found
              </TableCell>
            </TableRow>
          ) : (
            events.map((event) => (
              <TableRow key={event.id} className="font-mono text-xs">
                <TableCell>
                  <EventBadge type={event.type} />
                </TableCell>
                <TableCell className="font-medium">{event.details}</TableCell>
                <TableCell>
                  {event.actor ? (
                    <a
                      href={`${config.explorer}/address/${event.actor}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline text-blue-600"
                    >
                      {truncateAddress(event.actor)}
                    </a>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </TableCell>
                <TableCell className="text-gray-500">
                  {formatDistanceToNow(
                    new Date(Number(event.timestamp) * 1000),
                    { addSuffix: true },
                  )}
                </TableCell>
                <TableCell>
                  <a
                    href={`${config.explorer}/tx/${event.tx}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline text-blue-600"
                  >
                    {truncateAddress(event.tx)}
                  </a>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
