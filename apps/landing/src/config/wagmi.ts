import { CHAINS, DEFAULT_CHAIN } from "@0xslots/contracts";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import type { Chain } from "viem";
import { http } from "wagmi";
import { mainnet } from "wagmi/chains";
import { alchemyKey } from "@/constants";

/** Alchemy RPC subdomain by chain ID */
const ALCHEMY_SUBDOMAINS: Record<number, string> = {
  1: "eth-mainnet",
  84532: "base-sepolia",
  42161: "arb-mainnet",
};

function alchemyHttp(chainId: number) {
  const sub = ALCHEMY_SUBDOMAINS[chainId];
  return sub ? http(`https://${sub}.g.alchemy.com/v2/${alchemyKey}`) : http();
}

// DEFAULT_CHAIN first, then remaining supported chains, plus mainnet for ENS
const chains = [
  DEFAULT_CHAIN,
  ...CHAINS.filter((c) => c.id !== DEFAULT_CHAIN.id),
  mainnet,
] as [Chain, ...Chain[]];

const transports = Object.fromEntries(
  chains.map((c) => [c.id, alchemyHttp(c.id)]),
);

export const config = getDefaultConfig({
  appName: "0xSlots",
  projectId: "8d4685db15de09d142d3650e08c90f79",
  chains,
  transports,
  ssr: false,
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
