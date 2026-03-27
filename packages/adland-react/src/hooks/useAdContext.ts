import type { SlotsChain } from "@0xslots/sdk";
import type { AdData } from "@adland/data";
import { createContext, useContext } from "react";

export interface AdContextValue {
  data: AdData | null;
  cid: string | null;
  isLoading: boolean;
  error: unknown;
  isEmpty: boolean;
  slot?: string;
  baseLinkUrl: string;
  chainId: SlotsChain;
}

export const AdContext = createContext<AdContextValue | null>(null);

export function useAd(): AdContextValue {
  const ctx = useContext(AdContext);
  if (!ctx) throw new Error("useAd must be used within an <Ad> component");
  return ctx;
}
