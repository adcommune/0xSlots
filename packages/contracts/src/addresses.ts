import { Address } from "viem";
import { baseSepolia } from "viem/chains";

/**
 * SlotsHub contract addresses by chain ID
 */
export const slotFactoryAddress = {
  [baseSepolia.id]: "0xc44De86e2A5f0C47f1Ba87C36DaBf54275814DEb",
} as const;

export const batchCollectorAddress = {
  [baseSepolia.id]: "0xd3c7090C2F89c5132C3f91DD1da4bCffEAe10e13",
} as const;

export const metadataModuleAddress = {
  [baseSepolia.id]: "0x65392ac6fd773a9bd36c200abf848c8fa3c9f7f8",
} as const;

export const erc721SlotsAddress = {
  [baseSepolia.id]: "0x65e88189ac09527c5F7da0296ef33C77E5a6BE27",
} as const;

export function getMetadataModuleAddress(chainId: number): Address | undefined {
  return metadataModuleAddress[chainId as keyof typeof metadataModuleAddress];
}

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
