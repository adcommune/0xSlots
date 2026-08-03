"use client";

// Re-export from SDK — app consumers pass chainId from useChain() context
export {
  type SlotOnChain,
  useSlotOnChain,
  useSlotsOnChain,
} from "@0xslots/sdk/react";
