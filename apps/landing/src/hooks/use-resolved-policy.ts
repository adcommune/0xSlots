"use client";

import { type ResolvedPolicy, resolvePolicy } from "@0xslots/sdk";
import { useQuery } from "@tanstack/react-query";
import type { Address, PublicClient } from "viem";
import { usePublicClient } from "wagmi";

/**
 * React wrapper around the SDK's `resolvePolicy`.
 *
 * All the knowledge — which factories exist, how to read a policy's terms, how
 * to verify its CREATE2 provenance, how to phrase it — lives in the SDK so a
 * bot or a second frontend gets the same answer. This adds caching, nothing
 * else.
 *
 * Cached forever: a policy's terms are immutable constructor args and its
 * address is derived from them, so the answer for an address can never change.
 * Rows sharing a policy share one query.
 */
export function useResolvedPolicy(
  policyAddress: string | null | undefined,
  chainId: number,
): { policy: ResolvedPolicy | undefined; isLoading: boolean } {
  const publicClient = usePublicClient({ chainId });
  const address = policyAddress?.toLowerCase() ?? null;
  const enabled = !!address && !!publicClient;

  const { data, isLoading } = useQuery({
    queryKey: ["occupancy-policy", chainId, address],
    enabled,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
    retry: false,
    queryFn: () =>
      resolvePolicy(publicClient as PublicClient, chainId, address as Address),
  });

  return { policy: data, isLoading: enabled && isLoading };
}
