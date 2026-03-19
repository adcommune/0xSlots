"use client";

import { DEFAULT_CHAIN } from "@0xslots/contracts";
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
  const { mutate: switchWalletChain } = useSwitchChain();
  const { chainId: walletChainId } = useAccount();

  // Keep the connected wallet chain in sync with the selected chain at all times.
  useEffect(() => {
    if (walletChainId && walletChainId !== chainId) {
      switchWalletChain({ chainId });
    }
  }, [chainId, walletChainId, switchWalletChain]);

  const setChain = useCallback(
    (id: number) => {
      setChainId(id as SlotsChain);
    },
    [],
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
