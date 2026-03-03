"use client";

import {
  createSlotsClient,
  type SlotFieldsFragment,
  SlotsChain,
} from "@0xslots/sdk";
import { useQuery } from "@tanstack/react-query";

// Re-export the slot type for convenience
export type { SlotFieldsFragment as V3Slot } from "@0xslots/sdk";

const client = createSlotsClient({ chainId: SlotsChain.BASE_SEPOLIA });

export function useSlots() {
  return useQuery({
    queryKey: ["slots"],
    queryFn: async () => {
      const { slots } = await client.getSlots({ first: 100 });
      return slots as SlotFieldsFragment[];
    },
    staleTime: 15_000,
  });
}

export function useSlot(id: string) {
  return useQuery({
    queryKey: ["slot", id],
    queryFn: async () => {
      const { slot } = await client.getSlot({ id: id.toLowerCase() });
      return slot as SlotFieldsFragment | null;
    },
    staleTime: 10_000,
    enabled: !!id,
  });
}

export function useSlotsByRecipient(recipient: string) {
  return useQuery({
    queryKey: ["slots-recipient", recipient],
    queryFn: async () => {
      const { slots } = await client.getSlotsByRecipient({
        recipient: recipient.toLowerCase(),
        first: 100,
      });
      return slots as SlotFieldsFragment[];
    },
    staleTime: 15_000,
    enabled: !!recipient,
  });
}

export function useSlotsByOccupant(occupant: string) {
  return useQuery({
    queryKey: ["slots-occupant", occupant],
    queryFn: async () => {
      const { slots } = await client.getSlotsByOccupant({
        occupant: occupant.toLowerCase(),
        first: 100,
      });
      return slots as SlotFieldsFragment[];
    },
    staleTime: 15_000,
    enabled: !!occupant,
  });
}

export function useFactory() {
  return useQuery({
    queryKey: ["factory"],
    queryFn: async () => {
      const { factories } = await client.getFactory();
      return factories[0] ?? null;
    },
    staleTime: 30_000,
  });
}

export function useSlotPurchases(slotId: string) {
  return useQuery({
    queryKey: ["slot-purchases", slotId],
    queryFn: async () => {
      const { boughtEvents } = await client.getBoughtEvents({
        slotId: slotId.toLowerCase(),
        first: 50,
      });
      return boughtEvents;
    },
    staleTime: 10_000,
    enabled: !!slotId,
  });
}

export function useSlotsettlements(slotId: string) {
  return useQuery({
    queryKey: ["slot-settlements", slotId],
    queryFn: async () => {
      const { settledEvents } = await client.getSettledEvents({
        slotId: slotId.toLowerCase(),
        first: 50,
      });
      return settledEvents;
    },
    staleTime: 10_000,
    enabled: !!slotId,
  });
}

export function useSlotTaxCollections(slotId: string) {
  return useQuery({
    queryKey: ["slot-tax-collections", slotId],
    queryFn: async () => {
      const { taxCollectedEvents } = await client.getTaxCollectedEvents({
        slotId: slotId.toLowerCase(),
        first: 50,
      });
      return taxCollectedEvents;
    },
    staleTime: 10_000,
    enabled: !!slotId,
  });
}

export function useSlotActivity(slotId: string) {
  return useQuery({
    queryKey: ["slot-activity", slotId],
    queryFn: async () => {
      const data = await client.getSlotActivity({
        slotId: slotId.toLowerCase(),
        first: 50,
      });
      return data;
    },
    staleTime: 10_000,
    enabled: !!slotId,
  });
}

export function useRecentEvents() {
  return useQuery({
    queryKey: ["recent-events"],
    queryFn: async () => {
      return client.getRecentEvents({ first: 50 });
    },
    staleTime: 10_000,
  });
}
