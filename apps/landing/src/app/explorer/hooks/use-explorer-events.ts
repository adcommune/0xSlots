"use client";

import type { SlotsChain, SlotsClient } from "@0xslots/sdk";
import { useQuery } from "@tanstack/react-query";
import type { EventType } from "@/types";
import { truncateAddress } from "@/utils";
import { useSlotsClient } from "./use-slots-client";

export interface UnifiedEvent {
  id: string;
  type: EventType;
  timestamp: string;
  tx: string;
  blockNumber: string;
  details: string;
  actor?: string;
}

async function fetchAndUnifyEvents(client: SlotsClient) {
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
        details: `Land ${truncateAddress(e.land.id)} opened`,
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
        details: `Slot #${e.slot.slotId} purchased${
          e.previousOccupant
            ? ` from ${truncateAddress(e.previousOccupant)}`
            : ""
        }`,
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
        details: `Slot #${e.slotId} created on ${truncateAddress(e.land)}`,
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

  return {
    events,
    counts: {
      totalLands: landOpenedEvents?.length ?? 0,
      slotPurchases: slotPurchases?.length ?? 0,
      availableSlots: releasedSlots?.length ?? 0,
    },
  };
}

export function useExplorerEvents(chainId: SlotsChain) {
  const client = useSlotsClient(chainId);

  return useQuery({
    queryKey: ["explorer-events", chainId],
    queryFn: () => fetchAndUnifyEvents(client),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
