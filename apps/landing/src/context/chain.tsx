"use client";

import { CHAINS, DEFAULT_CHAIN } from "@0xslots/contracts";
import type { SlotsChain } from "@0xslots/sdk";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import { useSwitchChain } from "wagmi";

interface ChainContextValue {
  chainId: SlotsChain;
  setChain: (chainId: number) => void;
}

const ChainContext = createContext<ChainContextValue | null>(null);

export function ChainProvider({ children }: { children: ReactNode }) {
  const [chainId, setChainId] = useState<SlotsChain>(
    DEFAULT_CHAIN.id as SlotsChain,
  );
  const { mutate: switchWalletChain } = useSwitchChain();

  const setChain = useCallback(
    (id: number) => {
      setChainId(id as SlotsChain);
      if (CHAINS.some((c) => c.id === id)) {
        switchWalletChain({ chainId: id });
      }
    },
    [switchWalletChain],
  );

  return (
    <ChainContext.Provider value={{ chainId, setChain }}>
      {children}
    </ChainContext.Provider>
  );
}

export function useChain(): ChainContextValue {
  const ctx = useContext(ChainContext);
  if (!ctx) throw new Error("useChain must be used within ChainProvider");
  return ctx;
}
