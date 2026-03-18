import { appChains } from "@0xslots/config/chains";
import { alchemyTransports } from "@0xslots/config/transports";
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { alchemyKey } from "@/constants";

const transports = alchemyTransports(
  appChains.map((c) => c.id),
  alchemyKey,
);

const baseConfig = getDefaultConfig({
  appName: "0xSlots",
  projectId: "8d4685db15de09d142d3650e08c90f79",
  chains: appChains,
  transports,
  ssr: false,
});

// Extend with the Farcaster miniapp connector so it auto-connects inside
// Farcaster clients while RainbowKit wallets remain available on the web.
export const config = {
  ...baseConfig,
  connectors: [...baseConfig.connectors, farcasterMiniApp()],
} as typeof baseConfig;

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
