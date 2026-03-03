"use client";

import { useQuery } from "@tanstack/react-query";
import {
  createSlotsClient,
  SlotsChain,
  type SlotFieldsFragment,
} from "@0xslots/sdk";

// Re-export the slot type for convenience
export type { SlotFieldsFragment as V3Slot } from "@0xslots/sdk";

const client = createSlotsClient({ chainId: SlotsChain.BASE_SEPOLIA });

export function useV3Slots() {
  return useQuery({
    queryKey: ["v3-slots"],
    queryFn: async () => {
      const { slots } = await client.getSlots({ first: 100 });
      return slots as SlotFieldsFragment[];
    },
    staleTime: 15_000,
  });
}

export function useV3Slot(id: string) {
  return useQuery({
    queryKey: ["v3-slot", id],
    queryFn: async () => {
      const { slot } = await client.getSlot({ id: id.toLowerCase() });
      return slot as SlotFieldsFragment | null;
    },
    staleTime: 10_000,
    enabled: !!id,
  });
}

export function useV3SlotsByRecipient(recipient: string) {
  return useQuery({
    queryKey: ["v3-slots-recipient", recipient],
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

export function useV3SlotsByOccupant(occupant: string) {
  return useQuery({
    queryKey: ["v3-slots-occupant", occupant],
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

export function useV3Factory() {
  return useQuery({
    queryKey: ["v3-factory"],
    queryFn: async () => {
      const { factories } = await client.getFactory();
      return factories[0] ?? null;
    },
    staleTime: 30_000,
  });
}

export function useV3SlotPurchases(slotId: string) {
  return useQuery({
    queryKey: ["v3-slot-purchases", slotId],
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

export function useV3SlotSettlements(slotId: string) {
  return useQuery({
    queryKey: ["v3-slot-settlements", slotId],
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

export function useV3SlotTaxCollections(slotId: string) {
  return useQuery({
    queryKey: ["v3-slot-tax-collections", slotId],
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

export function useV3SlotActivity(slotId: string) {
  return useQuery({
    queryKey: ["v3-slot-activity", slotId],
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
