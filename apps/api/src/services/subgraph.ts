import { createSlotsClient, SlotsChain } from "@0xslots/sdk";

export const slotsClient = createSlotsClient({
  chainId: SlotsChain.BASE_SEPOLIA,
});
