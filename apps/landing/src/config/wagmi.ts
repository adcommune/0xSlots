import { http, createConfig, injected } from "wagmi";
import { mainnet, arbitrum, baseSepolia } from "wagmi/chains";
import { walletConnect } from "wagmi/connectors";

export const config = createConfig({
  chains: [arbitrum, baseSepolia, mainnet],
  connectors: [injected(), walletConnect({})],
  transports: {
    [mainnet.id]: http("https://eth.llamarpc.com"),
    [baseSepolia.id]: http("https://sepolia.base.org"),
    [arbitrum.id]: http("wss://arbitrum.drpc.org"),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
