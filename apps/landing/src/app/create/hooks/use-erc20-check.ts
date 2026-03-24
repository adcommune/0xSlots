"use client";

import { useQuery } from "@tanstack/react-query";
import { type Address, erc20Abi, getAddress, isAddress } from "viem";
import { usePublicClient } from "wagmi";

export interface Erc20Info {
  name: string;
  symbol: string;
  decimals: number;
  address: Address;
}

export function useErc20Check(rawAddress: string) {
  const publicClient = usePublicClient();

  let checksummed: Address | null = null;
  try {
    if (isAddress(rawAddress.trim(), { strict: false })) {
      checksummed = getAddress(rawAddress.trim());
    }
  } catch {
    // invalid
  }

  const query = useQuery<Erc20Info>({
    queryKey: ["erc20-check", checksummed],
    enabled: !!checksummed && !!publicClient,
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
    queryFn: async () => {
      if (!checksummed || !publicClient) throw new Error("No address");

      const [name, symbol, decimals] = await Promise.all([
        publicClient.readContract({
          address: checksummed,
          abi: erc20Abi,
          functionName: "name",
        }),
        publicClient.readContract({
          address: checksummed,
          abi: erc20Abi,
          functionName: "symbol",
        }),
        publicClient.readContract({
          address: checksummed,
          abi: erc20Abi,
          functionName: "decimals",
        }),
      ]);

      return { name, symbol, decimals, address: checksummed };
    },
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading && !!checksummed,
    isError: query.isError,
    error: query.error,
    isValidAddress: !!checksummed,
  };
}
