"use client";

import { createSlotsClient, type SlotFieldsFragment } from "@0xslots/sdk";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useChain } from "@/context/chain";

// Re-export the slot type for convenience
export type { SlotFieldsFragment as V3Slot } from "@0xslots/sdk";

export function useSlotsClient() {
  const { chainId } = useChain();
  return useMemo(() => createSlotsClient({ chainId }), [chainId]);
}

export function useSlots() {
  const { chainId } = useChain();
  const client = useSlotsClient();
  return useQuery({
    queryKey: ["slots", chainId],
    queryFn: async () => {
      const { slots } = await client.getSlots({ first: 100 });
      return slots as SlotFieldsFragment[];
    },
    staleTime: 15_000,
  });
}

export function useSlot(id: string) {
  const { chainId } = useChain();
  const client = useSlotsClient();
  return useQuery({
    queryKey: ["slot", chainId, id],
    queryFn: async () => {
      const { slot } = await client.getSlot({ id: id.toLowerCase() });
      return slot as SlotFieldsFragment | null;
    },
    staleTime: 10_000,
    enabled: !!id,
  });
}

export function useSlotsByRecipient(recipient: string) {
  const { chainId } = useChain();
  const client = useSlotsClient();
  return useQuery({
    queryKey: ["slots-recipient", chainId, recipient],
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
  const { chainId } = useChain();
  const client = useSlotsClient();
  return useQuery({
    queryKey: ["slots-occupant", chainId, occupant],
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
  const { chainId } = useChain();
  const client = useSlotsClient();
  return useQuery({
    queryKey: ["factory", chainId],
    queryFn: async () => {
      const { factories } = await client.getFactory();
      return factories[0] ?? null;
    },
    staleTime: 30_000,
  });
}

export function useSlotPurchases(slotId: string) {
  const { chainId } = useChain();
  const client = useSlotsClient();
  return useQuery({
    queryKey: ["slot-purchases", chainId, slotId],
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
  const { chainId } = useChain();
  const client = useSlotsClient();
  return useQuery({
    queryKey: ["slot-settlements", chainId, slotId],
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
  const { chainId } = useChain();
  const client = useSlotsClient();
  return useQuery({
    queryKey: ["slot-tax-collections", chainId, slotId],
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
  const { chainId } = useChain();
  const client = useSlotsClient();
  return useQuery({
    queryKey: ["slot-activity", chainId, slotId],
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
  const { chainId } = useChain();
  const client = useSlotsClient();
  return useQuery({
    queryKey: ["recent-events", chainId],
    queryFn: async () => {
      return client.getRecentEvents({ first: 50 });
    },
    staleTime: 10_000,
  });
}
