import { http, createConfig } from "wagmi";
import { arbitrum } from "wagmi/chains";
import { injected } from "wagmi/connectors";

export const config = createConfig({
  chains: [arbitrum],
  connectors: [injected()],
  transports: {
    [arbitrum.id]: http("https://arb-mainnet.g.alchemy.com/v2/4XrtaFg8OqFaNxv45MreCFT3ekifcxWm"),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
