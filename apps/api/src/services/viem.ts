import { createPublicClient } from "viem";
import { constants, transports } from "@adland/common";
import { alchemyKey } from "../constants";

export const client = createPublicClient({
  chain: constants.chain,
  transport: transports(alchemyKey)[constants.chain.id]!,
});

export const getChainClient = (chainId: number) =>
  createPublicClient({
    chain: constants.chain,
    transport: transports(alchemyKey)[chainId]!,
  });
