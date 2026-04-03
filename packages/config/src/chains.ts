import type { Chain } from "viem";
import { base, baseSepolia, mainnet } from "viem/chains";

/**
 * All chains for the app: DEFAULT_CHAIN first, then remaining protocol chains, plus mainnet for ENS.
 */
export const appChains = [
  base,
  baseSepolia,
  mainnet, // Last — only here for ENS resolution
] as [Chain, ...Chain[]];

