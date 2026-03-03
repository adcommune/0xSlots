import { Address } from "viem";
import { baseSepolia } from "viem/chains";

/**
 * SlotsHub contract addresses by chain ID
 */
export const slotFactoryAddress = {
  [baseSepolia.id]: "0x14cf0e785d2635c60f8a2bd473ce4f08a0e85a57",
} as const;

export const batchCollectorAddress = {
  [baseSepolia.id]: "0x316cd70c96bd413eE088E74BddE02B2F6515cD58",
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
