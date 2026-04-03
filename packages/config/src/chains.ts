import type { Chain } from "viem";
import { base, baseSepolia } from "viem/chains";

/**
 * All chains for the app: DEFAULT_CHAIN first, then remaining protocol chains.
 * ENS resolution uses a standalone mainnet client (see apps/landing/src/lib/ens.ts).
 */
export const appChains = [base, baseSepolia] as [Chain, ...Chain[]];
