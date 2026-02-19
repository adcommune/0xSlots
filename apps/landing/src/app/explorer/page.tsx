import { createSlotsClient, SlotsChain } from "@0xslots/sdk";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConnectButton } from "@/components/connect-button";
import { ExplorerTabs } from "@/components/explorer-tabs";
import { HubSettings } from "@/components/hub-settings";
import { ChainSelector } from "./chain-selector";

const CHAIN_CONFIG = {
  [SlotsChain.BASE_SEPOLIA]: {
    name: "Base Sepolia",
    explorer: "https://sepolia.basescan.org",
  },
  [SlotsChain.ARBITRUM]: {
    name: "Arbitrum",
    explorer: "https://arbiscan.io",
  },
} as const;

function shorten(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

type EventType =
  | "landOpened"
  | "slotCreated"
  | "slotPurchased"
  | "slotReleased"
  | "priceUpdated";

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
  };

  return (
    <Badge variant={type} className="font-mono text-[10px] uppercase">
      {labels[type]}
    </Badge>
  );
}

function parseChain(chain?: string): SlotsChain {
  if (chain === "arbitrum") return SlotsChain.ARBITRUM;
  return SlotsChain.BASE_SEPOLIA;
}

export default async function ExplorerPage({
  searchParams,
}: {
  searchParams: Promise<{ chain?: string }>;
}) {
  const { chain: chainParam } = await searchParams;
  const chainId = parseChain(chainParam);
  const config = CHAIN_CONFIG[chainId];

  const client = createSlotsClient({ chainId });

  // Fetch all event types
  const [
    { landOpenedEvents },
    { slotPurchases },
    { slots: releasedSlots },
    { slotCreatedEvents },
    { priceUpdates },
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
    client.getSlotCreatedEvents({
      first: 20,
      orderBy: "timestamp",
      orderDirection: "desc",
    }),
    client.getPriceUpdates({
      first: 20,
      orderBy: "timestamp",
      orderDirection: "desc",
    }),
  ]);

  // Fetch hub settings
  let hubData: any = null;
  let currencies: any[] = [];
  let modules: any[] = [];
  try {
    const hubId = chainId === SlotsChain.ARBITRUM
      ? "0x50b9111b44cf2f8eb5a2b21bf58dcf7cba583dd3"
      : "0x62882e33374ff18b8f9fcf5aee44b102a2c2245a";
    const hubResult = await client.getHub({ id: hubId });
    hubData = hubResult.hub;
    const currResult = await client.getAllowedCurrencies({ hubId });
    currencies = currResult.currencies || [];
    const modResult = await client.getAllowedModules({ hubId });
    modules = modResult.modules || [];
  } catch {}

  // Fetch lands and slots
  let lands: any[] = [];
  let allSlots: any[] = [];
  try {
    const landsResult = await client.getLands({ first: 50, orderBy: "createdAt" as any, orderDirection: "desc" as any });
    lands = landsResult.lands || [];
    const slotsResult = await client.getSlots({ first: 200, orderBy: "slotId" as any, orderDirection: "asc" as any });
    allSlots = slotsResult.slots || [];
  } catch {}

  const slotsByLand = new Map<string, any[]>();
  for (const slot of allSlots) {
    const landId = slot.land.id;
    if (!slotsByLand.has(landId)) slotsByLand.set(landId, []);
    slotsByLand.get(landId)!.push(slot);
  }

  // Unify all events into a single array
  const events: UnifiedEvent[] = [];

  if (landOpenedEvents) {
    for (const e of landOpenedEvents) {
      events.push({
        id: e.id,
        type: "landOpened",
        timestamp: e.timestamp,
        tx: e.tx,
        blockNumber: e.blockNumber,
        actor: e.account,
        details: `Land ${shorten(e.land.id)} opened`,
      });
    }
  }

  if (slotPurchases) {
    for (const e of slotPurchases) {
      events.push({
        id: e.id,
        type: "slotPurchased",
        timestamp: e.timestamp,
        tx: e.tx,
        blockNumber: e.blockNumber,
        actor: e.newOccupant,
        details: `Slot #${e.slot.slotId} purchased${e.previousOccupant ? ` from ${shorten(e.previousOccupant)}` : ""}`,
      });
    }
  }

  if (slotCreatedEvents) {
    for (const e of slotCreatedEvents) {
      events.push({
        id: e.id,
        type: "slotCreated",
        timestamp: e.timestamp,
        tx: e.tx,
        blockNumber: e.blockNumber,
        details: `Slot #${e.slotId} created on ${shorten(e.land)}`,
      });
    }
  }

  if (priceUpdates) {
    for (const e of priceUpdates) {
      events.push({
        id: e.id,
        type: "priceUpdated",
        timestamp: e.timestamp,
        tx: e.tx,
        blockNumber: e.blockNumber,
        details: `Slot #${e.slot.slotId} price updated`,
      });
    }
  }

  events.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="border-b-4 border-black bg-linear-to-br from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">
                Protocol Explorer
              </h1>
              <p className="text-gray-500 font-mono text-sm">
                {config.name} · Real-time protocol events
              </p>
            </div>
            <div className="flex items-center gap-4">
              <ChainSelector current={chainParam || "base-sepolia"} />
              <ConnectButton />
            </div>
          </div>
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

        <ExplorerTabs tabs={[
          {
            id: "lands",
            label: "Lands",
            content: lands.length > 0 ? (
          <div className="space-y-4">
            {lands.map((land: any) => {
              const landSlots = slotsByLand.get(land.id) || [];
              const occupied = landSlots.filter(
                (s: any) => s.occupant && s.occupant !== "0x0000000000000000000000000000000000000000"
              );
              return (
                <Link
                  key={land.id}
                  href={`/slots/${land.id}`}
                  className="block border-2 border-black hover:bg-gray-50 transition-colors"
                >
                  <div className="border-b-2 border-black bg-gray-50 px-6 py-3 flex items-center justify-between">
                    <div>
                      <span className="font-mono text-[10px] text-gray-500">LAND</span>
                      <h3 className="font-black text-sm tracking-tight">{shorten(land.id)}</h3>
                    </div>
                    <div className="text-right font-mono text-[10px]">
                      <div className="text-gray-500">OWNER</div>
                      <div>{shorten(land.owner)}</div>
                    </div>
                  </div>
                  <div className="px-6 py-3">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {landSlots.map((slot: any) => {
                        const isOccupied = slot.occupant && slot.occupant !== "0x0000000000000000000000000000000000000000";
                        return (
                          <div
                            key={slot.id}
                            className={`w-9 h-9 border-2 border-black flex items-center justify-center font-mono text-xs font-bold ${
                              isOccupied ? "bg-black text-white" : "bg-white text-black"
                            }`}
                            title={`Slot #${slot.slotId} — ${isOccupied ? shorten(slot.occupant) : "VACANT"}`}
                          >
                            {slot.slotId}
                          </div>
                        );
                      })}
                    </div>
                    <div className="grid grid-cols-3 gap-4 font-mono text-xs">
                      <div>
                        <span className="text-gray-500">SLOTS</span>
                        <div className="font-bold">{landSlots.length}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">OCCUPIED</span>
                        <div className="font-bold">{occupied.length}/{landSlots.length}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">TAX RATE</span>
                        <div className="font-bold">
                          {landSlots[0] ? `${Number(landSlots[0].taxPercentage) / 100}%` : "—"}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="border-2 border-black p-12 text-center">
            <p className="font-mono text-sm text-gray-500">NO LANDS FOUND</p>
          </div>
        ),
          },
          {
            id: "events",
            label: "Events",
            content: (
        <div>
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
                <TableHead className="font-bold uppercase text-xs">Type</TableHead>
                <TableHead className="font-bold uppercase text-xs">Details</TableHead>
                <TableHead className="font-bold uppercase text-xs">Actor</TableHead>
                <TableHead className="font-bold uppercase text-xs">Time</TableHead>
                <TableHead className="font-bold uppercase text-xs">Tx</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-400 py-8">
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
                        href={`${config.explorer}/tx/${event.tx}`}
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

        </div>
            ),
          },
          {
            id: "settings",
            label: "Hub Settings",
            content: (
              <HubSettings
                hub={hubData}
                currencies={currencies}
                modules={modules}
                explorerUrl={config.explorer}
              />
            ),
          },
        ]} />

        <div className="mt-8 text-center text-xs text-gray-400 font-mono">
          Powered by @0xslots/sdk · The Graph
        </div>
      </div>
    </div>
  );
}
