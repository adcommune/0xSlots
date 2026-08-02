"use client";

import {
  MINIMUM_TENURE_POLICY_FACTORY,
  minimumTenurePolicyFactoryAbi,
} from "@0xslots/contracts";
import { useQuery } from "@tanstack/react-query";
import type { Address } from "viem";
import { usePublicClient } from "wagmi";
import { KNOWN_POLICIES, type KnownPolicy } from "@/config/policies";
import { formatDuration } from "@/hooks/use-duration";

/**
 * Name an occupancy policy the static map doesn't know.
 *
 * `KNOWN_POLICIES` was written when policies were deployed by hand, so a short
 * hardcoded list could cover them. Tenure is now chosen at slot creation and
 * the policy deployed on demand at a CREATE2 address derived from the duration,
 * so the address space is open-ended and no list can keep up — two slots with
 * the same rule were rendering as "7d minimum tenure" and "Policy 0xd0cc…"
 * purely by which one predated the factory.
 *
 * So ask the chain instead.
 *
 * ## Why the second call
 *
 * Reading `tenureSeconds()` alone would let any contract exposing that name
 * claim a trustworthy-looking "2d minimum tenure" badge while doing something
 * else entirely. Checking `factory.predict(tenureSeconds) == policy` closes
 * that: CREATE2 binds the address to the init code AND the salt, so only the
 * genuine MinimumTenurePolicy for that exact duration can sit there. A
 * mismatch — or a revert — leaves the policy unrecognised, which is the safe
 * reading rather than a flattering one.
 *
 * Results are cached forever: `tenureSeconds` is an immutable constructor arg,
 * so an answer for an address can never go stale, and every row sharing a
 * policy shares one query.
 */
export function useResolvedPolicy(
  policyAddress: string | null | undefined,
  chainId: number,
): { policy: KnownPolicy | undefined; isLoading: boolean } {
  const publicClient = usePublicClient({ chainId });
  const address = policyAddress?.toLowerCase() ?? null;
  const known = address ? KNOWN_POLICIES[address] : undefined;
  const factory = MINIMUM_TENURE_POLICY_FACTORY[chainId];

  // Skip the network entirely for the hand-curated entries and when there is
  // no policy at all — the common cases.
  const enabled = !!address && !known && !!factory && !!publicClient;

  const { data, isLoading } = useQuery({
    queryKey: ["occupancy-policy", chainId, address],
    enabled,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
    retry: false,
    queryFn: async (): Promise<KnownPolicy | null> => {
      try {
        const tenureSeconds = (await publicClient!.readContract({
          address: address as Address,
          abi: TENURE_SECONDS_ABI,
          functionName: "tenureSeconds",
        })) as bigint;

        if (tenureSeconds <= 0n) return null;

        const predicted = (await publicClient!.readContract({
          address: factory as Address,
          abi: minimumTenurePolicyFactoryAbi,
          functionName: "predict",
          args: [tenureSeconds],
        })) as Address;

        // Provenance check — see above.
        if (predicted.toLowerCase() !== address) return null;

        const human = formatDuration(Number(tenureSeconds));
        return {
          chainId,
          tenureSeconds: Number(tenureSeconds),
          label: `${human} minimum tenure`,
          impact: "soft",
          description: `Nobody can buy the occupant out for ${human} after they take the slot. Liquidation still works if they stop paying.`,
        };
      } catch {
        // Not a tenure policy, or not readable. Stays unrecognised.
        return null;
      }
    },
  });

  return {
    policy: known ?? data ?? undefined,
    isLoading: enabled && isLoading,
  };
}

const TENURE_SECONDS_ABI = [
  {
    inputs: [],
    name: "tenureSeconds",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
