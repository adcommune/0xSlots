"use client";

import { CHAINS, DEFAULT_CHAIN } from "@0xslots/contracts";
import type { SlotsChain } from "@0xslots/sdk";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { getExplorerUrl } from "@/lib/config";

interface ChainContextValue {
  chainId: SlotsChain;
  explorerUrl: string;
  setChain: (chainId: number) => void;
}

const ChainContext = createContext<ChainContextValue | null>(null);

export function ChainProvider({ children }: { children: ReactNode }) {
  const [chainId, setChainId] = useState<SlotsChain>(
    DEFAULT_CHAIN.id as SlotsChain,
  );
  const { isConnected } = useAccount();
  const { mutate: switchChain } = useSwitchChain();

  // Handle ?chain= query param on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const chainParam = params.get("chain");
    if (chainParam) {
      const parsed = Number(chainParam);
      if (CHAINS.some((c) => c.id === parsed)) {
        setChainId(parsed as SlotsChain);
        if (isConnected) switchChain({ chainId: parsed });
      }
    }
  }, []);

  const setChain = useCallback(
    (id: number) => {
      setChainId(id as SlotsChain);
      if (isConnected) switchChain({ chainId: id });
    },
    [isConnected, switchChain],
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
