import { Address } from "viem";
import { arbitrum, baseSepolia } from "viem/chains";

/**
 * Supported chain IDs for 0xSlots protocol
 */
export type SupportedChainId = typeof baseSepolia.id | typeof arbitrum.id;

/**
 * SlotsHub contract addresses by chain ID
 */
export const slotsHubAddress = {
  [baseSepolia.id]: "0x21871C87aB8f3616715E34db0474A3b5f186E174",
  [arbitrum.id]: "0x268cfab9ddddf6a326458ae79d55592516f382ef",
} as const satisfies Record<SupportedChainId, Address>;

/**
 * Get the SlotsHub address for a given chain ID
 * @param chainId - The chain ID
 * @returns The SlotsHub address or undefined if not deployed on the chain
 */
export function getSlotsHubAddress(
  chainId: number
): Address | undefined {
  return slotsHubAddress[chainId as SupportedChainId];
}

/**
 * Check if SlotsHub is deployed on a given chain
 * @param chainId - The chain ID
 * @returns True if deployed, false otherwise
 */
export function isSlotsHubDeployed(chainId: number): boolean {
  return chainId in slotsHubAddress;
}

/**
 * Get all supported chain IDs
 * @returns Array of supported chain IDs
 */
export function getSupportedChainIds(): SupportedChainId[] {
  return Object.keys(slotsHubAddress).map(Number) as SupportedChainId[];
}
