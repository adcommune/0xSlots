// Main entry point for @0xslots/contracts

import type { Chain } from "viem";
import { arbitrum, baseSepolia } from "viem/chains";
import { slotFactoryAddress } from "./addresses";

// Re-export ABIs
export { batchCollectorAbi, slotAbi, slotFactoryAbi } from "./abis";
export { metadataModuleAbi } from "./abis/metadata-module";

// Re-export addresses and utilities
export {
  batchCollectorAddress,
  metadataModuleAddress,
  getMetadataModuleAddress,
  getSlotsHubAddress,
  getSupportedChainIds,
  isSlotsHubDeployed,
  type SupportedChainId,
  slotFactoryAddress,
} from "./addresses";

/** Viem chain objects for known 0xSlots networks — add here when deploying to new chains */
const CHAIN_MAP: Record<number, Chain> = {
  [baseSepolia.id]: baseSepolia,
  [arbitrum.id]: arbitrum,
};

/** Chains with deployed 0xSlots contracts (derived from slotFactoryAddress) */
export const CHAINS = Object.keys(slotFactoryAddress)
  .map((id) => CHAIN_MAP[Number(id)])
  .filter((c): c is Chain => c !== undefined);

/** Default chain — first chain with a deployed contract */
export const DEFAULT_CHAIN = CHAINS[0] ?? baseSepolia;
