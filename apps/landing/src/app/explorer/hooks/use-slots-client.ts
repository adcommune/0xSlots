"use client";

import { createSlotsClient, type SlotsChain } from "@0xslots/sdk";
import { useMemo } from "react";

export function useSlotsClient(chainId: SlotsChain) {
  return useMemo(() => createSlotsClient({ chainId }), [chainId]);
}
