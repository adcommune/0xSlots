import { Address } from "viem";
import { base, baseSepolia } from "viem/chains";

/**
 * SlotsHub contract addresses by chain ID.
 *
 * These MUST match `apps/contracts/deployments/<chainId>/SlotFactoryV3.json`
 * and the factory datasources in `packages/subgraph/config/<network>.json`.
 * A slot created through a factory the subgraph does not index is invisible to
 * every consumer of this SDK, and fails silently — the transaction succeeds.
 */
export const slotFactoryAddress = {
  [base.id]: "0xbf2F890E8F5CCCB3A1D7c5030dBC1843B9E36B0e",
  [baseSepolia.id]: "0x6D87C1647f228Baf8DE0374FCd7FdEBF6900fdFF",
} as const;

export const batchCollectorAddress = {
  [baseSepolia.id]: "0xd3c7090C2F89c5132C3f91DD1da4bCffEAe10e13",
} as const;

export const erc721SlotsAddress = {
  [baseSepolia.id]: "0x65e88189ac09527c5F7da0296ef33C77E5a6BE27",
} as const;

export const feedModuleAddress = {
  [baseSepolia.id]: "0x17b663b7C779B64f339ab916aB734A6a4f0b075E",
  [base.id]: "0xe92BE44E3D77be84E2aC4D6da9FFDaC0FCa67f72",
} as const;

export const feedRouterAddress = {
  [baseSepolia.id]: "0x93E67283Cbb4bE7b86FeBbb9620e72777715C710",
  [base.id]: "0xCfFA953EfC77591463a9560211bC783b5aaF3A4a",
} as const;

export const feedSocialGroupAddress = {
  [baseSepolia.id]: "0xC664a125F58cEc92d041c73c58388e58b7b5fE5D",
  [base.id]: "0x5b524d7A1E7449963c42aEaFfAE751573e22F314",
} as const;

/**
 * FeedHub — beacon factory + registry for on-chain Feed contracts. The default
 * feed is `feeds(0)`. base (mainnet) is pending its deploy.
 */
export const feedHubAddress = {
  [baseSepolia.id]: "0xE4c0c374E3233b5174a1600AF1321cDa9b6B5cF8",
} as const;

/**
 * Supported chain IDs for 0xSlots protocol
 */
export type SupportedChainId = keyof typeof slotFactoryAddress;

/**
 * Get the SlotsHub address for a given chain ID
 * @param chainId - The chain ID
 * @returns The SlotsHub address or undefined if not deployed on the chain
 */
export function getSlotsHubAddress(chainId: number): Address | undefined {
  return slotFactoryAddress[chainId as SupportedChainId];
}

/**
 * Check if SlotsHub is deployed on a given chain
 * @param chainId - The chain ID
 * @returns True if deployed, false otherwise
 */
export function isSlotsHubDeployed(chainId: number): boolean {
  return chainId in slotFactoryAddress;
}

/**
 * Get all supported chain IDs
 * @returns Array of supported chain IDs
 */
export function getSupportedChainIds(): SupportedChainId[] {
  return Object.keys(slotFactoryAddress).map(Number) as SupportedChainId[];
}
