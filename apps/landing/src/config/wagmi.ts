import { appChains } from "@0xslots/config/chains";
import { alchemyTransports } from "@0xslots/config/transports";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { alchemyKey } from "@/constants";

const transports = alchemyTransports(
  appChains.map((c) => c.id),
  alchemyKey,
);

export const config = getDefaultConfig({
  appName: "0xSlots",
  projectId: "8d4685db15de09d142d3650e08c90f79",
  chains: appChains,
  transports,
  ssr: false,
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
