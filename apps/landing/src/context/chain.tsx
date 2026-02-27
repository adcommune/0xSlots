"use client";

import type { SlotsChain } from "@0xslots/sdk";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import { useSwitchChain } from "wagmi";
import { arbitrum, baseSepolia } from "wagmi/chains";
import { parseChain } from "@/lib/config";

interface ChainContextValue {
  chainId: SlotsChain;
  chainKey: string;
  setChain: (key: string) => void;
}

const ChainContext = createContext<ChainContextValue | null>(null);

const WALLET_CHAIN_MAP = {
  arbitrum: arbitrum.id,
  "base-sepolia": baseSepolia.id,
} as const;

export function ChainProvider({ children }: { children: ReactNode }) {
  const [chainKey, setChainKey] = useState("base-sepolia");
  const chainId = parseChain(chainKey);
  const { mutate: switchWalletChain } = useSwitchChain();

  const setChain = useCallback(
    (key: string) => {
      setChainKey(key);
      if (key in WALLET_CHAIN_MAP) {
        switchWalletChain({
          chainId: WALLET_CHAIN_MAP[key as keyof typeof WALLET_CHAIN_MAP],
        });
      }
    },
    [switchWalletChain],
  );

  return (
    <ChainContext.Provider value={{ chainId, chainKey, setChain }}>
      {children}
    </ChainContext.Provider>
  );
}

export function useChain(): ChainContextValue {
  const ctx = useContext(ChainContext);
  if (!ctx) throw new Error("useChain must be used within ChainProvider");
  return ctx;
}
