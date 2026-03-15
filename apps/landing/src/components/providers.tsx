"use client";

import "@rainbow-me/rainbowkit/styles.css";

import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { SplitsProvider } from "@0xsplits/splits-sdk-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { WagmiProvider } from "wagmi";
import { TooltipProvider } from "@/components/ui/tooltip";
import { config } from "@/config/wagmi";
import { ChainProvider } from "@/context/chain";
import { SplitsClientSync } from "./splits-client-sync";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <ChainProvider>
            <SplitsProvider>
              <SplitsClientSync />
              <TooltipProvider>{children}</TooltipProvider>
            </SplitsProvider>
          </ChainProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
