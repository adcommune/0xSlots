"use client";

import { sdk } from "@farcaster/miniapp-sdk";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface FarcasterUser {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
}

interface FarcasterContext {
  /** Whether the app is running inside a Farcaster client */
  isMiniApp: boolean;
  /** Whether the SDK has finished initialising */
  isReady: boolean;
  /** The Farcaster SDK instance (always available, but only meaningful in miniapp mode) */
  sdk: typeof sdk;
  /** The connected Farcaster user (only available in miniapp mode) */
  user: FarcasterUser | null;
}

const FarcasterCtx = createContext<FarcasterContext>({
  isMiniApp: false,
  isReady: false,
  sdk,
  user: null,
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
  const [user, setUser] = useState<FarcasterUser | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const context = await sdk.context;
        if (context) {
          setIsMiniApp(true);
          if (context.user) {
            setUser({
              fid: context.user.fid,
              username: context.user.username,
              displayName: context.user.displayName,
              pfpUrl: context.user.pfpUrl,
            });
          }
          await sdk.actions.ready();
          await sdk.back.enableWebNavigation();
        }
      } catch {
        // Not inside a Farcaster client — ignore
      }
      setIsReady(true);
    }
    init();
  }, []);

  return (
    <FarcasterCtx.Provider value={{ isMiniApp, isReady, sdk, user }}>
      {children}
    </FarcasterCtx.Provider>
  );
}
