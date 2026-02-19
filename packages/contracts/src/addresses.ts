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
  [baseSepolia.id]: "0x62882e33374ff18b8f9fcf5aee44b102a2c2245a",
  [arbitrum.id]: "0x50b9111b44cf2f8eb5a2b21bf58dcf7cba583dd3",
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
