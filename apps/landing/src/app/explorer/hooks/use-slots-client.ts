"use client";

import { useMemo } from "react";
import { createSlotsClient, type SlotsChain } from "@0xslots/sdk";

export function useSlotsClient(chainId: SlotsChain) {
  return useMemo(() => createSlotsClient({ chainId }), [chainId]);
}
