// Main entry point for @0xslots/contracts
// Re-export ABIs
export { slotsAbi, slotsHubAbi } from "./abis";

// Re-export addresses and utilities
export {
  slotsHubAddress,
  getSlotsHubAddress,
  isSlotsHubDeployed,
  getSupportedChainIds,
  type SupportedChainId,
} from "./addresses";
