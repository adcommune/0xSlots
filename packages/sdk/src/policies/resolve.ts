import {
  MINIMUM_PRICE_POLICY_FACTORY,
  MINIMUM_TENURE_POLICY_FACTORY,
  minimumPricePolicyAbi,
  minimumPricePolicyFactoryAbi,
  minimumTenurePolicyFactoryAbi,
} from "@0xslots/contracts";
import { type Address, erc20Abi, formatUnits, type PublicClient } from "viem";
import { formatDuration } from "./format";
import type { ResolvedPolicy } from "./types";
import { VOUCHED_POLICIES } from "./vouched";

/**
 * Name an occupancy policy from its address alone.
 *
 * ## Why this is derived rather than listed
 *
 * A policy keeps its configuration in immutable constructor args, so its terms
 * ARE its address, and the factory that made it can recompute that address from
 * those terms. That means any policy — including ones deployed after this code
 * shipped — can be identified without a registry, a subgraph field, or a
 * release. Adding a tenure duration or a price floor needs no change here.
 *
 * ## The provenance check is the whole point
 *
 * Reading `tenureSeconds()` off an address and believing it would let any
 * contract exposing that name wear a trustworthy-looking badge. Every resolver
 * below reads the terms, then asks the factory to recompute the address from
 * them, and only trusts the answer when it matches. CREATE2 binds an address to
 * the init code AND the salt, so only the genuine policy for those exact terms
 * can sit there.
 *
 * A mismatch, a revert, or an unrecognised shape all return `kind: "unknown"` —
 * which a UI must render as unrecognised, never as safe.
 *
 * ## Caching
 *
 * The answer for an address can never change: the terms are immutable and the
 * address is derived from them. Callers should cache indefinitely.
 */
export async function resolvePolicy(
  client: PublicClient,
  chainId: number,
  address: Address,
): Promise<ResolvedPolicy> {
  const key = address.toLowerCase();

  // Hand-vouched entries first: no network, and they cover policies that have
  // no factory to verify against.
  const vouched = VOUCHED_POLICIES[key];
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

  const tenure = await resolveTenure(client, chainId, address);
  if (tenure) return tenure;

  const price = await resolvePrice(client, chainId, address);
  if (price) return price;

  return {
    address,
    kind: "unknown",
    label: `Policy ${address.slice(0, 6)}…${address.slice(-4)}`,
    description:
      "An occupancy rule this app doesn't recognise — how easily this slot can be bought out is unknown.",
    impact: "unknown",
  };
}

async function resolveTenure(
  client: PublicClient,
  chainId: number,
  address: Address,
): Promise<ResolvedPolicy | null> {
  const factory = MINIMUM_TENURE_POLICY_FACTORY[chainId];
  if (!factory) return null;

  try {
    const tenureSeconds = (await client.readContract({
      address,
      abi: TENURE_SECONDS_ABI,
      functionName: "tenureSeconds",
    })) as bigint;
    if (tenureSeconds <= 0n) return null;

    const predicted = (await client.readContract({
      address: factory,
      abi: minimumTenurePolicyFactoryAbi,
      functionName: "predict",
      args: [tenureSeconds],
    })) as Address;
    if (predicted.toLowerCase() !== address.toLowerCase()) return null;

    const human = formatDuration(Number(tenureSeconds));
    return {
      address,
      kind: "tenure",
      tenureSeconds: Number(tenureSeconds),
      label: `${human} minimum tenure`,
      impact: "soft",
      description: `Nobody can buy the occupant out for ${human} after they take the slot. Liquidation still works if they stop paying.`,
    };
  } catch {
    return null;
  }
}

async function resolvePrice(
  client: PublicClient,
  chainId: number,
  address: Address,
): Promise<ResolvedPolicy | null> {
  const factory = MINIMUM_PRICE_POLICY_FACTORY[chainId];
  if (!factory) return null;

  try {
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
    if (minPrice <= 0n) return null;

    const predicted = (await client.readContract({
      address: factory,
      abi: minimumPricePolicyFactoryAbi,
      functionName: "predict",
      args: [currency, minPrice],
    })) as Address;
    if (predicted.toLowerCase() !== address.toLowerCase()) return null;

    // Read from the policy's OWN bound currency, not the slot's — the policy is
    // the thing being named, and it reverts on a mismatched slot anyway.
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
  } catch {
    return null;
  }
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
