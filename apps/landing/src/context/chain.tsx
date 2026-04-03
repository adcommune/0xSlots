"use client";

import { CHAINS, DEFAULT_CHAIN } from "@0xslots/contracts";
import type { SlotsChain } from "@0xslots/sdk";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useEffect,
} from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { getExplorerUrl } from "@/lib/config";

interface ChainContextValue {
  chainId: SlotsChain;
  explorerUrl: string;
  setChain: (chainId: number) => void;
}

const CHAIN_STORAGE_KEY = "0xslots:chainId";
const ChainContext = createContext<ChainContextValue | null>(null);

function isSupportedChain(id: number): id is SlotsChain {
  return CHAINS.some((c) => c.id === id);
}

function getStoredChain(): SlotsChain | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(CHAIN_STORAGE_KEY);
  if (stored) {
    const parsed = Number(stored);
    if (isSupportedChain(parsed)) return parsed;
  }
  return null;
}

export function ChainProvider({ children }: { children: ReactNode }) {
  const { chainId: walletChainId, isConnected, status } = useAccount();
  const { mutate: switchChain } = useSwitchChain();

  const stored = getStoredChain();

  // Wallet connected + on a supported chain → use it
  // Otherwise → stored preference or default
  const chainId: SlotsChain =
    isConnected && walletChainId && isSupportedChain(walletChainId)
      ? walletChainId
      : (stored ?? (DEFAULT_CHAIN.id as SlotsChain));

  console.log("[chain] render", {
    walletChainId,
    isConnected,
    status,
    stored,
    resolved: chainId,
    defaultChain: DEFAULT_CHAIN.id,
  });

  // Handle ?chain= query param on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const chainParam = params.get("chain");
    if (chainParam) {
      const parsed = Number(chainParam);
      console.log("[chain] query param", { chainParam: parsed });
      if (isSupportedChain(parsed)) {
        localStorage.setItem(CHAIN_STORAGE_KEY, String(parsed));
        if (isConnected && parsed !== walletChainId) {
          console.log("[chain] switching from query param", { from: walletChainId, to: parsed });
          switchChain({ chainId: parsed });
        }
      }
    }
  }, []);

  const setChain = useCallback(
    (id: number) => {
      console.log("[chain] setChain called", { id, currentWallet: walletChainId });
      localStorage.setItem(CHAIN_STORAGE_KEY, String(id));
      switchChain({ chainId: id });
    },
    [switchChain, walletChainId],
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
