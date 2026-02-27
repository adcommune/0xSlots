"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchSlots,
  fetchSlot,
  fetchSlotEvents,
  fetchFactory,
  fetchAllEvents,
} from "@/lib/v3-queries";

export function useV3Slots() {
  return useQuery({
    queryKey: ["v3-slots"],
    queryFn: () => fetchSlots(100),
    staleTime: 15_000,
  });
}

export function useV3Slot(id: string) {
  return useQuery({
    queryKey: ["v3-slot", id],
    queryFn: () => fetchSlot(id.toLowerCase()),
    staleTime: 10_000,
    enabled: !!id,
  });
}

export function useV3SlotEvents(slotId: string) {
  return useQuery({
    queryKey: ["v3-slot-events", slotId],
    queryFn: () => fetchSlotEvents(slotId.toLowerCase()),
    staleTime: 10_000,
    enabled: !!slotId,
  });
}

export function useV3Factory() {
  return useQuery({
    queryKey: ["v3-factory"],
    queryFn: () => fetchFactory(),
    staleTime: 30_000,
  });
}

export function useV3AllEvents() {
  return useQuery({
    queryKey: ["v3-all-events"],
    queryFn: () => fetchAllEvents(50),
    staleTime: 15_000,
  });
}
