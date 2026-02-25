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
  [baseSepolia.id]: "0xc9d6bdaf9e807be880509b05c5c5216ff1c63603",
  [arbitrum.id]: "0xf46bb96b7d978170f75dd8bc39578a771e03b325",
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
