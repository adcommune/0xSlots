"use client";

import "@rainbow-me/rainbowkit/styles.css";

import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { SplitsProvider } from "@0xsplits/splits-sdk-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useEffect, useState } from "react";
import { WagmiProvider, useConnect } from "wagmi";
import { TooltipProvider } from "@/components/ui/tooltip";
import { config } from "@/config/wagmi";
import { ChainProvider } from "@/context/chain";
import { FarcasterProvider, useFarcaster } from "@/context/farcaster";
import { SplitsClientSync } from "./splits-client-sync";

/**
 * Auto-connects the Farcaster wallet when running inside a miniapp.
 * On the web this is a no-op.
 */
function FarcasterAutoConnect() {
  const { isMiniApp } = useFarcaster();
  const { connect, connectors } = useConnect();

  useEffect(() => {
    if (!isMiniApp) return;
    const fc = connectors.find((c) => c.id === "farcasterMiniApp");
    if (fc) connect({ connector: fc });
  }, [isMiniApp, connect, connectors]);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <FarcasterProvider>
            <FarcasterAutoConnect />
            <ChainProvider>
              <SplitsProvider>
                <SplitsClientSync />
                <TooltipProvider>{children}</TooltipProvider>
              </SplitsProvider>
            </ChainProvider>
          </FarcasterProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
