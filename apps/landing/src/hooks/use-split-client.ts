import { SplitV2Client } from "@0xsplits/splits-sdk";
import { useMemo } from "react";
import { usePublicClient, useWalletClient } from "wagmi";
import { useChain } from "@/context/chain";

export function useSplitClient(): SplitV2Client {
  const { chainId } = useChain();
  const publicClient = usePublicClient({ chainId });
  const { data: walletClient } = useWalletClient({ chainId });

  return useMemo(() => {
    return new SplitV2Client({
      chainId,
      publicClient,
      walletClient,
      apiConfig: {
        apiKey: process.env.NEXT_PUBLIC_0xSPLITS_API_KEY as string,
      },
    });
  }, [chainId, publicClient, walletClient]);
}
