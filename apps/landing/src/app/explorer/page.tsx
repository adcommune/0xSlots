import { createSlotsClient, SlotsChain } from "@0xslots/sdk";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function shorten(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

type EventType =
  | "landOpened"
  | "slotCreated"
  | "slotPurchased"
  | "slotReleased"
  | "priceUpdated"
  | "flowChange";

interface UnifiedEvent {
  id: string;
  type: EventType;
  timestamp: string;
  tx: string;
  blockNumber: string;
  details: string;
  actor?: string;
}

function EventBadge({ type }: { type: EventType }) {
  const labels: Record<EventType, string> = {
    landOpened: "Land Opened",
    slotCreated: "Slot Created",
    slotPurchased: "Slot Purchased",
    slotReleased: "Slot Released",
    priceUpdated: "Price Updated",
    flowChange: "Flow Change",
  };

  return (
    <Badge variant={type} className="font-mono text-[10px] uppercase">
      {labels[type]}
    </Badge>
  );
}

export default async function ExplorerPage() {
  const client = createSlotsClient({
    chainId: SlotsChain.BASE_SEPOLIA,
  });

  // Fetch all event types
  const [
    { landOpenedEvents },
    { slotPurchases },
    { slots: releasedSlots },
  ] = await Promise.all([
    client.getLandOpenedEvents({
      first: 20,
      orderBy: "timestamp",
      orderDirection: "desc",
    }),
    client.getSlotPurchases({
      first: 20,
      orderBy: "timestamp",
      orderDirection: "desc",
    }),
    client.getSlots({
      where: { occupant: null },
      first: 10,
      orderBy: "updatedAt",
      orderDirection: "desc",
    }),
  ]);

  // Unify all events into a single array
  const events: UnifiedEvent[] = [];

  // Add land opened events
  landOpenedEvents?.forEach((e) => {
    events.push({
      id: e.id,
      type: "landOpened",
      timestamp: e.timestamp,
      tx: e.tx,
      blockNumber: e.blockNumber,
      actor: e.account,
      details: `Land ${shorten(e.land.id)} opened`,
    });
  });

  // Add slot purchases
  slotPurchases?.forEach((e) => {
    events.push({
      id: e.id,
      type: "slotPurchased",
      timestamp: e.timestamp,
      tx: e.tx,
      blockNumber: e.blockNumber,
      actor: e.newOccupant,
      details: `Slot #${e.slot.slotId} purchased${e.previousOccupant ? ` from ${shorten(e.previousOccupant)}` : ""}`,
    });
  });

  // Sort all events by timestamp
  events.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="border-b-4 border-black bg-linear-to-br from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">
            Protocol Explorer
          </h1>
          <p className="text-gray-500 font-mono text-sm">
            Base Sepolia · Real-time protocol events
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="border-2 border-black p-6 bg-blue-50">
            <div className="text-sm font-mono uppercase text-gray-600 mb-1">
              Total Lands
            </div>
            <div className="text-3xl font-black">{landOpenedEvents?.length || 0}</div>
          </div>
          <div className="border-2 border-black p-6 bg-purple-50">
            <div className="text-sm font-mono uppercase text-gray-600 mb-1">
              Slot Purchases
            </div>
            <div className="text-3xl font-black">{slotPurchases?.length || 0}</div>
          </div>
          <div className="border-2 border-black p-6 bg-orange-50">
            <div className="text-sm font-mono uppercase text-gray-600 mb-1">
              Available Slots
            </div>
            <div className="text-3xl font-black">{releasedSlots?.length || 0}</div>
          </div>
        </div>

        {/* Events Table */}
        <div className="border-2 border-black">
          <div className="bg-gray-50 border-b-2 border-black p-4">
            <h2 className="text-lg font-bold uppercase tracking-tight">
              Recent Events
            </h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="border-b-2 border-black hover:bg-transparent">
                <TableHead className="font-bold uppercase text-xs">
                  Type
                </TableHead>
                <TableHead className="font-bold uppercase text-xs">
                  Details
                </TableHead>
                <TableHead className="font-bold uppercase text-xs">
                  Actor
                </TableHead>
                <TableHead className="font-bold uppercase text-xs">
                  Time
                </TableHead>
                <TableHead className="font-bold uppercase text-xs">
                  Tx
                </TableHead>
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
                    <TableCell className="font-medium">
                      {event.details}
                    </TableCell>
                    <TableCell>
                      {event.actor ? (
                        <a
                          href={`https://sepolia.basescan.org/address/${event.actor}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline text-blue-600"
                        >
                          {shorten(event.actor)}
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {formatDistanceToNow(
                        new Date(Number(event.timestamp) * 1000),
                        { addSuffix: true }
                      )}
                    </TableCell>
                    <TableCell>
                      <a
                        href={`https://sepolia.basescan.org/tx/${event.tx}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline text-blue-600"
                      >
                        {shorten(event.tx)}
                      </a>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-400 font-mono">
          Powered by @0xslots/sdk · The Graph
        </div>
      </div>
    </div>
  );
}
