import { Address } from "viem";
import { baseSepolia } from "viem/chains";

/**
 * SlotsHub contract addresses by chain ID
 */
export const slotFactoryAddress = {
  [baseSepolia.id]: "0x57759A2094cbE24313B826b453d4e7760279f79D",
} as const;

export const batchCollectorAddress = {
  [baseSepolia.id]: "0xDE5B9A3ce6Cbca935E33221909fA261F4EfC4c84",
} as const;

export const metadataModuleAddress = {
  [baseSepolia.id]: "0x6c5A8A7f061bEd94b1b88CFAd4e1a1a8C5c4e527",
} as const;

export const erc721SlotsAddress = {
  [baseSepolia.id]: "0x87138d73345c07142475cb1b599628406743ccd8",
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
