import type { Chain } from "viem";
import { baseSepolia, mainnet } from "viem/chains";

/**
 * All chains for the app: DEFAULT_CHAIN first, then remaining protocol chains, plus mainnet for ENS.
 */
export const appChains = [
  mainnet,
  baseSepolia,
] as [Chain, ...Chain[]];

