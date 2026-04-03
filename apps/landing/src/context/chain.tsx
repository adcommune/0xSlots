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
import { useSwitchChain } from "wagmi";
import { getExplorerUrl } from "@/lib/config";

interface ChainContextValue {
  chainId: SlotsChain;
  explorerUrl: string;
  setChain: (chainId: number) => void;
}

const CHAIN_STORAGE_KEY = "0xslots:chainId";

function getInitialChain(): SlotsChain {
  if (typeof window === "undefined") return DEFAULT_CHAIN.id as SlotsChain;

  // Query param takes priority
  const params = new URLSearchParams(window.location.search);
  const chainParam = params.get("chain");
  if (chainParam) {
    const parsed = Number(chainParam);
    if (CHAINS.some((c) => c.id === parsed)) return parsed as SlotsChain;
  }

  // Then localStorage
  const stored = localStorage.getItem(CHAIN_STORAGE_KEY);
  if (stored) {
    const parsed = Number(stored);
    if (CHAINS.some((c) => c.id === parsed)) return parsed as SlotsChain;
  }

  return DEFAULT_CHAIN.id as SlotsChain;
}

const ChainContext = createContext<ChainContextValue | null>(null);

export function ChainProvider({ children }: { children: ReactNode }) {
  const [chainId, setChainId] = useState<SlotsChain>(getInitialChain);
  const { mutate: switchWalletChain } = useSwitchChain();

  // Sync wallet to the initial chain on mount
  useEffect(() => {
    switchWalletChain({ chainId });
  }, []);

  const setChain = useCallback(
    (id: number) => {
      setChainId(id as SlotsChain);
      localStorage.setItem(CHAIN_STORAGE_KEY, String(id));
      switchWalletChain({ chainId: id });
    },
    [switchWalletChain],
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
