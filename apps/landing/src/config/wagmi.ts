import { http, createConfig, injected } from "wagmi";
import { mainnet, arbitrum, baseSepolia } from "wagmi/chains";
import { walletConnect } from "wagmi/connectors";

export const config = createConfig({
  chains: [arbitrum, baseSepolia, mainnet],
  connectors: [injected(), walletConnect({})],
  transports: {
    [mainnet.id]: http(),
    [baseSepolia.id]: http("https://sepolia.base.org"),
    [arbitrum.id]: http(
      "https://arb-mainnet.g.alchemy.com/v2/4XrtaFg8OqFaNxv45MreCFT3ekifcxWm",
    ),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
