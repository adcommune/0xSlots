import { createSlotsClient, SlotsChain } from "@0xslots/sdk";

// Defaults to Base Sepolia; set CHAIN_ID=8453 for mainnet.
const chainId =
  Number(process.env.CHAIN_ID) === SlotsChain.BASE
    ? SlotsChain.BASE
    : SlotsChain.BASE_SEPOLIA;

export const slotsClient = createSlotsClient({
  chainId,
  // Required: the gateway answers unauthenticated queries with an `errors`
  // payload ("missing authorization header"), which graphql-request throws on.
  subgraphApiKey: process.env.NEXT_PUBLIC_SUBGRAPH_API_KEY,
});
