"use client";

import { useSplitsClient } from "@0xsplits/splits-sdk-react";
import { usePublicClient } from "wagmi";
import { useChain } from "@/context/chain";

export function SplitsClientSync() {
  const { chainId } = useChain();
  const publicClient = usePublicClient({ chainId });

  useSplitsClient({
    chainId,
    publicClient,
    apiConfig: {
      apiKey: process.env.NEXT_PUBLIC_0xSPLITS_API_KEY as string,
    },
  });

  return null;
}
