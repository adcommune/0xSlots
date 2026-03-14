import { type SupportedChainId, slotFactoryAddress } from "@0xslots/contracts";
import { useMemo } from "react";
import { usePublicClient, useWalletClient } from "wagmi";
import { type SlotsChain, SlotsClient } from "./client";

export function useSlotsClient(chainId?: SlotsChain): SlotsClient {
  const publicClient = usePublicClient({ chainId });
  const { data: walletClient } = useWalletClient({ chainId });

  return useMemo(() => {
    if (!publicClient) throw new Error("No publicClient available");
    const resolvedChainId = (chainId ?? publicClient.chain.id) as SlotsChain;
    const factoryAddress =
      slotFactoryAddress[resolvedChainId as unknown as SupportedChainId];
    if (!factoryAddress)
      throw new Error(`No factory address for chain ${resolvedChainId}`);

    return new SlotsClient({
      chainId: resolvedChainId,
      factoryAddress,
      publicClient,
      walletClient: walletClient ?? undefined,
    });
  }, [chainId, publicClient, walletClient]);
}
