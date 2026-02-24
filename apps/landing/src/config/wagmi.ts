import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { mainnet, arbitrum, baseSepolia } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "0xSlots",
  projectId: "8d4685db15de09d142d3650e08c90f79",
  chains: [arbitrum, baseSepolia, mainnet],
  transports: {
    [mainnet.id]: http("https://eth.llamarpc.com"),
    [baseSepolia.id]: http("https://sepolia.base.org"),
    [arbitrum.id]: http("wss://arbitrum.drpc.org"),
  },
  ssr: true
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
