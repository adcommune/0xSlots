"use client";

import { CHAINS, DEFAULT_CHAIN } from "@0xslots/contracts";
import type { SlotsChain } from "@0xslots/sdk";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { getExplorerUrl } from "@/lib/config";

interface ChainContextValue {
  chainId: SlotsChain;
  explorerUrl: string;
  setChain: (chainId: number) => void;
}

const ChainContext = createContext<ChainContextValue | null>(null);

export function ChainProvider({ children }: { children: ReactNode }) {
  const { chainId: walletChainId } = useAccount();
  const { mutate: switchChain } = useSwitchChain();

  const chainId: SlotsChain =
    walletChainId && CHAINS.some((c) => c.id === walletChainId)
      ? (walletChainId as SlotsChain)
      : (DEFAULT_CHAIN.id as SlotsChain);

  // Switch to chain from ?chain= query param on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const chainParam = params.get("chain");
    if (chainParam) {
      const parsed = Number(chainParam);
      if (CHAINS.some((c) => c.id === parsed) && parsed !== walletChainId) {
        switchChain({ chainId: parsed });
      }
    }
  }, []);

  const setChain = useCallback(
    (id: number) => switchChain({ chainId: id }),
    [switchChain],
  );

  const explorerUrl = useMemo(() => getExplorerUrl(chainId), [chainId]);

  return (
    <ChainContext.Provider value={{ chainId, explorerUrl, setChain }}>
      {children}
    </ChainContext.Provider>
  );
}

export function useChain(): ChainContextValue {
  const ctx = useContext(ChainContext);
  if (!ctx) throw new Error("useChain must be used within ChainProvider");
  return ctx;
}
