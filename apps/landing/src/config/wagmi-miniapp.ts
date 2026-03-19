import { appChains } from "@0xslots/config/chains";
import { alchemyTransports } from "@0xslots/config/transports";
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import { createConfig } from "wagmi";
import { alchemyKey } from "@/constants";

const transports = alchemyTransports(
  appChains.map((c) => c.id),
  alchemyKey,
);

export const miniAppConfig = createConfig({
  chains: appChains,
  connectors: [farcasterMiniApp()],
  transports,
  ssr: false,
});

// Module augmentation lives in wagmi.ts (web config) which shares the same
// chain / transport shape. The miniapp config is structurally compatible.
