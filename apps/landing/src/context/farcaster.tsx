"use client";

import { sdk } from "@farcaster/miniapp-sdk";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

interface FarcasterContext {
  /** Whether the app is running inside a Farcaster client */
  isMiniApp: boolean;
  /** Whether the SDK has finished initialising */
  isReady: boolean;
  /** The Farcaster SDK instance (always available, but only meaningful in miniapp mode) */
  sdk: typeof sdk;
}

const FarcasterCtx = createContext<FarcasterContext>({
  isMiniApp: false,
  isReady: false,
  sdk,
});

export function useFarcaster() {
  return useContext(FarcasterCtx);
}

/**
 * Detects whether the app is loaded inside a Farcaster client and calls
 * `sdk.actions.ready()` to dismiss the splash screen.
 *
 * On the web the provider is a no-op passthrough.
 */
export function FarcasterProvider({ children }: { children: ReactNode }) {
  const [isMiniApp, setIsMiniApp] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const context = await sdk.context;
        if (context) {
          setIsMiniApp(true);
          await sdk.actions.ready();
        }
      } catch {
        // Not inside a Farcaster client — ignore
      }
      setIsReady(true);
    }
    init();
  }, []);

  return (
    <FarcasterCtx.Provider value={{ isMiniApp, isReady, sdk }}>
      {children}
    </FarcasterCtx.Provider>
  );
}
