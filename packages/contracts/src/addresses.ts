import { Address } from "viem";
import { base, baseSepolia } from "viem/chains";

/**
 * SlotsHub contract addresses by chain ID
 */
export const slotFactoryAddress = {
  [base.id]: "0xbf2F890E8F5CCCB3A1D7c5030dBC1843B9E36B0e",
  [baseSepolia.id]: "0xc44De86e2A5f0C47f1Ba87C36DaBf54275814DEb",
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
  [baseSepolia.id]: "0x31D6eE9028f5C102c2116e9552Fc20f3aA468194",
  [base.id]: "0x0000000000000000000000000000000000000000", // not deployed yet
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
