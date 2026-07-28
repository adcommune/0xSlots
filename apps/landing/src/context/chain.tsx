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
  useRef,
  useState,
} from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { getExplorerUrl } from "@/lib/config";

export const CHAIN_PARAM = "chain";
const STORAGE_KEY = "0xslots.chain";

interface ChainContextValue {
  chainId: SlotsChain;
  explorerUrl: string;
  setChain: (chainId: number) => void;
}

const ChainContext = createContext<ChainContextValue | null>(null);

function isKnownChain(id: number): id is SlotsChain {
  return Number.isFinite(id) && CHAINS.some((c) => c.id === id);
}

/**
 * Resolve the chain synchronously, on the very first render.
 *
 * Touching `window` here is safe: this provider tree sits behind
 * FarcasterProvider's `isReady` gate, so it never renders on the server and
 * there is no hydration pass to mismatch against. Resolving synchronously
 * (rather than in an effect) is what keeps the slot page from rendering
 * "Slot not found" against the default chain before correcting itself.
 *
 * Precedence: URL param → last selection → default. The URL wins so shared
 * links stay self-describing.
 */
function resolveInitialChain(): { chainId: SlotsChain; fromUrl: boolean } {
  const fallback = { chainId: DEFAULT_CHAIN.id as SlotsChain, fromUrl: false };
  if (typeof window === "undefined") return fallback;

  const param = Number(
    new URLSearchParams(window.location.search).get(CHAIN_PARAM),
  );
  if (isKnownChain(param)) return { chainId: param, fromUrl: true };

  try {
    const stored = Number(window.localStorage.getItem(STORAGE_KEY));
    if (isKnownChain(stored)) return { chainId: stored, fromUrl: false };
  } catch {
    // localStorage throws in private mode / when storage is disabled
  }

  return fallback;
}

/** Reflect the chain in the address bar without triggering a navigation. */
function writeChainToUrl(id: number) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (url.searchParams.get(CHAIN_PARAM) === String(id)) return;
  url.searchParams.set(CHAIN_PARAM, String(id));
  window.history.replaceState(null, "", url);
}

export function ChainProvider({ children }: { children: ReactNode }) {
  const initial = useRef(resolveInitialChain());
  const [chainId, setChainId] = useState<SlotsChain>(initial.current.chainId);
  const { isConnected } = useAccount();
  const { mutate: switchChain } = useSwitchChain();

  // Stamp the chain into the URL immediately, so a page opened without
  // ?chain= still reloads onto the same chain instead of falling back.
  useEffect(() => {
    writeChainToUrl(chainId);
  }, [chainId]);

  // Only nudge the wallet when the chain was explicitly requested via the URL.
  // Restoring a stored preference shouldn't prompt a network switch on load.
  const walletSynced = useRef(false);
  useEffect(() => {
    if (walletSynced.current) return;
    if (!initial.current.fromUrl || !isConnected) return;
    walletSynced.current = true;
    switchChain({ chainId: initial.current.chainId });
  }, [isConnected, switchChain]);

  const setChain = useCallback(
    (id: number) => {
      if (!isKnownChain(id)) return;
      setChainId(id);
      try {
        window.localStorage.setItem(STORAGE_KEY, String(id));
      } catch {
        // non-fatal — the URL param still carries the selection
      }
      writeChainToUrl(id);
      if (isConnected) switchChain({ chainId: id });
    },
    [isConnected, switchChain],
  );

  const explorerUrl = useMemo(() => getExplorerUrl(chainId), [chainId]);

  const value = useMemo(
    () => ({ chainId, explorerUrl, setChain }),
    [chainId, explorerUrl, setChain],
  );

  return (
    <ChainContext.Provider value={value}>{children}</ChainContext.Provider>
  );
}

export function useChain(): ChainContextValue {
  const ctx = useContext(ChainContext);
  if (!ctx) throw new Error("useChain must be used within ChainProvider");
  return ctx;
}
