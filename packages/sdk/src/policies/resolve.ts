import {
  minimumPricePolicyAbi,
  POLICY_FACTORIES,
  policyFactoryAbi,
} from "@0xslots/contracts";
import { type Address, erc20Abi, formatUnits, type PublicClient } from "viem";
import { formatDuration } from "./format";
import type { ResolvedPolicy } from "./types";
import { getVouchedPolicy } from "./vouched";

/**
 * Name an occupancy policy from its address alone.
 *
 * ## Shape
 *
 * Ask every known factory "did you make this?" until one says yes, then format
 * the terms for the kind it reports. Verification is uniform and lives
 * on-chain; only the phrasing is per-kind, and only off-chain.
 *
 * That split is deliberate. Deciding whether an address is a genuine policy is
 * security-critical and used to require per-kind client code — `predict(uint256)`
 * for tenure, `predict(address,uint256)` for price — so every new kind added a
 * branch to the path where a missing branch is most expensive. Behind
 * `IPolicyFactory.verify` a factory knows its own salt scheme and the client
 * knows none of them. Turning "604800" into "7d minimum tenure" is presentation:
 * safe to get wrong, wants translating, stays here.
 *
 * ## Why verification cannot be skipped
 *
 * Reading `tenureSeconds()` off an address and believing it would let any
 * contract wear a trustworthy badge. `verify` recomputes the CREATE2 address
 * from the policy's own immutable terms and compares — and CREATE2 binds an
 * address to the deployer, the init code AND the salt, so only the real policy
 * for those exact terms can sit there.
 *
 * ## Answers, never throws
 *
 * An unrecognised address returns `kind: "unknown"` rather than null, so a
 * caller cannot render it as safe by forgetting a fallback. A factory that
 * reverts is skipped rather than aborting the loop.
 *
 * ## Caching
 *
 * A policy's terms are immutable and its address is derived from them, so the
 * answer for an address can never change. Cache indefinitely.
 */
export async function resolvePolicy(
  client: PublicClient,
  chainId: number,
  address: Address,
): Promise<ResolvedPolicy> {
  // Hand-vouched entries first: no network, and they cover the policies no
  // factory can verify. Chain-checked — an address means nothing on a chain it
  // was not deployed to, and a confident wrong name is worse than no name.
  const vouched = getVouchedPolicy(address, chainId);
  if (vouched) {
    return {
      address,
      kind: "vouched",
      label: vouched.label,
      description: vouched.description,
      impact: vouched.impact,
      tenureSeconds: vouched.tenureSeconds,
    };
  }

  for (const factory of POLICY_FACTORIES[chainId] ?? []) {
    try {
      const mine = (await client.readContract({
        address: factory,
        abi: policyFactoryAbi,
        functionName: "verify",
        args: [address],
      })) as boolean;
      if (!mine) continue;

      const kind = (await client.readContract({
        address: factory,
        abi: policyFactoryAbi,
        functionName: "policyKind",
      })) as string;

      const described = await describe(client, address, kind);
      if (described) return described;
    } catch {
      // A factory that is unreachable or not an IPolicyFactory must not stop
      // the others from being asked.
    }
  }

  return {
    address,
    kind: "unknown",
    label: `Policy ${address.slice(0, 6)}…${address.slice(-4)}`,
    description:
      "An occupancy rule this app doesn't recognise — how easily this slot can be bought out is unknown.",
    impact: "unknown",
  };
}

/**
 * Turn a verified policy's terms into a sentence.
 *
 * Only reached for an address a factory has already vouched for, so the reads
 * below are trusted — this is presentation, not verification.
 */
async function describe(
  client: PublicClient,
  address: Address,
  kind: string,
): Promise<ResolvedPolicy | null> {
  switch (kind) {
    case "MinimumTenurePolicy": {
      const seconds = (await client.readContract({
        address,
        abi: TENURE_ABI,
        functionName: "tenureSeconds",
      })) as bigint;
      const human = formatDuration(Number(seconds));
      return {
        address,
        kind: "tenure",
        tenureSeconds: Number(seconds),
        label: `${human} minimum tenure`,
        impact: "soft",
        description: `Nobody can buy the occupant out for ${human} after they take the slot. Liquidation still works if they stop paying.`,
      };
    }

    case "MinimumPricePolicy": {
      const [minPrice, currency] = (await Promise.all([
        client.readContract({
          address,
          abi: minimumPricePolicyAbi,
          functionName: "minPrice",
        }),
        client.readContract({
          address,
          abi: minimumPricePolicyAbi,
          functionName: "currency",
        }),
      ])) as [bigint, Address];

      const [symbol, decimals] = (await Promise.all([
        client.readContract({
          address: currency,
          abi: erc20Abi,
          functionName: "symbol",
        }),
        client.readContract({
          address: currency,
          abi: erc20Abi,
          functionName: "decimals",
        }),
      ])) as [string, number];

      const human = `${formatUnits(minPrice, decimals)} ${symbol}`;
      return {
        address,
        kind: "price",
        minPrice,
        currency,
        label: `${human} minimum price`,
        // Forced sale is never delayed — only the declared value is floored.
        impact: "near-pure",
        description: `Nobody can declare below ${human} on this slot. Buying is never delayed: anyone can take it at any moment, as long as they declare at least that much.`,
      };
    }

    // A kind this SDK predates. It verified, so it IS a genuine policy from a
    // known factory — say that much rather than pretending it is unrecognised.
    default:
      return {
        address,
        kind: "unknown",
        label: kind,
        description: `A verified ${kind}, but this app is too old to describe its terms. Update to see them.`,
        impact: "unknown",
      };
  }
}

const TENURE_ABI = [
  {
    inputs: [],
    name: "tenureSeconds",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
