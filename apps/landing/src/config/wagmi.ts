import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { arbitrum, baseSepolia, mainnet } from "wagmi/chains";
import { alchemyKey } from "@/constants";

export const config = getDefaultConfig({
  appName: "0xSlots",
  projectId: "8d4685db15de09d142d3650e08c90f79",
  chains: [arbitrum, baseSepolia, mainnet],
  transports: {
    [mainnet.id]: http(`https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`),
    [baseSepolia.id]: http(
      `https://base-sepolia.g.alchemy.com/v2/${alchemyKey}`,
    ),
    [arbitrum.id]: http(`https://arb-mainnet.g.alchemy.com/v2/${alchemyKey}`),
  },
  ssr: false,
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
