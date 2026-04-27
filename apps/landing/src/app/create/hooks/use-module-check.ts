"use client";

import { useQuery } from "@tanstack/react-query";
import { type Address, getAddress, isAddress } from "viem";
import { usePublicClient } from "wagmi";

export interface ModuleInfo {
  address: Address;
  hasCode: boolean;
}

/**
 * Verify that a custom module address points to a deployed contract on the
 * current chain. Mirrors `SlotFactory._validateConfig` which rejects modules
 * with no code, so this surfaces the same failure at form-fill time instead
 * of at sign time.
 */
export function useModuleCheck(rawAddress: string) {
  const publicClient = usePublicClient();

  let checksummed: Address | null = null;
  try {
    if (isAddress(rawAddress.trim(), { strict: false })) {
      checksummed = getAddress(rawAddress.trim());
    }
  } catch {
    // invalid
  }

  const query = useQuery<ModuleInfo>({
    queryKey: ["module-check", publicClient?.chain?.id, checksummed],
    enabled: !!checksummed && !!publicClient,
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
    queryFn: async () => {
      if (!checksummed || !publicClient) throw new Error("No address");

      const code = await publicClient.getCode({ address: checksummed });
      const hasCode = !!code && code !== "0x";

      return { address: checksummed, hasCode };
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
