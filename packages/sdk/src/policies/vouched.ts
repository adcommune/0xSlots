import type { Address } from "viem";
import { NATIVE_CURRENCY_ADDRESS } from "../native";
import type { VouchedPolicy } from "./types";

/** Circle USDC on Base — what the mainnet price floors are denominated in. */
const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as Address;

/** The native-ETH sentinel, for floors denominated in ETH rather than a token. */
const NATIVE_CURRENCY = NATIVE_CURRENCY_ADDRESS as Address;

/**
 * Policies the protocol vouches for, keyed by lowercase address.
 *
 * Kept small on purpose. This used to be the ONLY way a policy got a name,
 * which stopped working the moment tenure became configurable at slot creation
 * — the address space went open-ended and a hardcoded list could not keep up.
 * `resolvePolicy` derives names on-chain now, so an entry here is only needed
 * for a policy with no factory to verify it against.
 *
 * What it is still for:
 *   1. Populating a "verified policy" picker — an editorial judgement.
 *   2. Naming a policy `resolvePolicy` cannot derive — one deployed outside its
 *      factory, so the CREATE2 provenance check rightly refuses it.
 *
 * Note what is NOT a reason any more: a policy with no factory at all. Those
 * were "pointer" policies, holding no terms of their own and forwarding every
 * decision to some other contract. They have been removed — see the commit that
 * deleted QueueExclusivityPolicy. Every policy now carries its own terms, which
 * is what makes its address derivable and this list nearly empty.
 */
export const VOUCHED_POLICIES: Record<string, VouchedPolicy> = {
  // Base Sepolia — deployed 2026-07-29, block 44825297.
  //
  // A 7-day tenure that CANNOT be derived: it was deployed by the upgrade
  // script rather than through MinimumTenurePolicyFactory, so it sits at a
  // different address than `predict(604800)` (which is 0xd0ccD26a…) and the
  // provenance check in resolvePolicy correctly refuses to name it. Same rule,
  // two addresses in the world — an artefact of it predating the factory.
  //
  // Removing this entry makes every slot using it render as an unnamed
  // address. Verified: that regression is exactly what happened when it was
  // dropped.
  "0xb7a0c71a6ab1293732216540e8321bda1f986622": {
    chainId: 84532,
    tenureSeconds: 604800,
    label: "7d minimum tenure",
    impact: "soft",
    description:
      "Nobody can buy the occupant out for 7 days after they take the slot. Liquidation still works if they stop paying.",
  },

  // ── Base mainnet — the starter set deployed with the policy factories ────
  //
  // The TENURE entries below are present for reason 1, not reason 2: they are
  // derivable, and `resolvePolicy` names them from the chain without help.
  // They are listed so the create form's "Verified policy" picker has
  // something to offer on mainnet. Deleting them costs the picker, never a
  // label. `MinimumTenurePolicyFactory` has not been redeployed, so they are
  // unaffected by the price-factory move below.
  "0x45b848850b386f1356ee95024a87cf42fbcd6f59": {
    chainId: 8453,
    tenureSeconds: 3600,
    label: "1h minimum tenure",
    impact: "soft",
    description:
      "Nobody can buy the occupant out for 1 hour after they take the slot. Liquidation still works if they stop paying.",
  },
  "0xb7a4156cb15a60f2dafb7a3edf0ed2defb12ab52": {
    chainId: 8453,
    tenureSeconds: 86400,
    label: "1d minimum tenure",
    impact: "soft",
    description:
      "Nobody can buy the occupant out for 1 day after they take the slot. Liquidation still works if they stop paying.",
  },
  "0xadbf68ba445dc8869249c90f23f58adb19e03749": {
    chainId: 8453,
    tenureSeconds: 604800,
    label: "7d minimum tenure",
    impact: "soft",
    description:
      "Nobody can buy the occupant out for 7 days after they take the slot. Liquidation still works if they stop paying.",
  },
  // ── Price floors from the SUPERSEDED factory (0xF1cA0Fe7…) ───────────────
  //
  // These two flipped from reason 1 to reason 2 on 2026-08-08. The price
  // factory was redeployed to accept `address(0)`, and since a factory is the
  // CREATE2 deployer for everything it makes, the current factory predicts
  // different addresses and `resolvePolicy`'s provenance check correctly
  // refuses to name these.
  //
  // The policy contracts themselves are unchanged and still deployed, so any
  // slot pointing at one keeps working. Removing these entries does not break
  // those slots — it makes them render as bare addresses, which is the same
  // regression already documented for the Base Sepolia tenure policy above.
  "0x0e1cdb54224b0ad085a1ef875783425f5cb84b89": {
    chainId: 8453,
    minPrice: 1_000_000n,
    currency: USDC_BASE,
    superseded: true,
    label: "$1 minimum price (USDC)",
    impact: "near-pure",
    description:
      "Nobody may declare below 1 USDC on this slot. Forced sale is not delayed at all — anyone can still take it at any moment, provided they declare at least the floor.",
  },
  "0xe19bf9a474eedf83a92efb1605eaf8ef9c259638": {
    chainId: 8453,
    minPrice: 10_000_000n,
    currency: USDC_BASE,
    superseded: true,
    label: "$10 minimum price (USDC)",
    impact: "near-pure",
    description:
      "Nobody may declare below 10 USDC on this slot. Forced sale is not delayed at all — anyone can still take it at any moment, provided they declare at least the floor.",
  },

  // ── Price floors from the CURRENT factory (0xe218F2e7…), Base mainnet ────
  //
  // Reason 1, like the tenure policies: all four are derivable and
  // `resolvePolicy` names them unaided. Listed for the picker.
  "0x6e5d1a33311ffbeceb58ad6f37e2161ced7ae95b": {
    chainId: 8453,
    minPrice: 1_000_000n,
    currency: USDC_BASE,
    label: "$1 minimum price (USDC)",
    impact: "near-pure",
    description:
      "Nobody may declare below 1 USDC on this slot. Forced sale is not delayed at all — anyone can still take it at any moment, provided they declare at least the floor.",
  },
  "0xe6e0d13d7e7153842ccf5faadb8ae019b61a2cba": {
    chainId: 8453,
    minPrice: 10_000_000n,
    currency: USDC_BASE,
    label: "$10 minimum price (USDC)",
    impact: "near-pure",
    description:
      "Nobody may declare below 10 USDC on this slot. Forced sale is not delayed at all — anyone can still take it at any moment, provided they declare at least the floor.",
  },
  "0x3eebb2aa85df93cb043c3262374bee785e2e8fe8": {
    chainId: 8453,
    minPrice: 1_000_000_000_000_000n,
    currency: NATIVE_CURRENCY,
    label: "0.001 ETH minimum price",
    impact: "near-pure",
    description:
      "Nobody may declare below 0.001 ETH on this slot. Forced sale is not delayed at all — anyone can still take it at any moment, provided they declare at least the floor.",
  },
  "0xd758f62d2edf4b0d8dc4444847ed45f913621eff": {
    chainId: 8453,
    minPrice: 10_000_000_000_000_000n,
    currency: NATIVE_CURRENCY,
    label: "0.01 ETH minimum price",
    impact: "near-pure",
    description:
      "Nobody may declare below 0.01 ETH on this slot. Forced sale is not delayed at all — anyone can still take it at any moment, provided they declare at least the floor.",
  },
};

/**
 * ── Accessors ─────────────────────────────────────────────────────────────
 *
 * Reach for these rather than indexing `VOUCHED_POLICIES` directly. The record
 * is keyed by LOWERCASE address, so every raw read needs its own
 * `.toLowerCase()` and silently misses if you forget — and, worse, carries no
 * chain check even though a policy address means nothing on another chain.
 * That is why `VOUCHED_POLICIES` is not exported from the package root.
 */

/** An address paired with its entry, which is what a picker wants. */
export interface VouchedPolicyEntry extends VouchedPolicy {
  address: string;
}

/**
 * Look up one vouched policy.
 *
 * Case-insensitive, and chain-checked: an entry only matches on the chain it
 * was deployed to. Two different chains can reuse an address, and naming a
 * Base Sepolia policy on mainnet would be worse than leaving it unnamed.
 */
export function getVouchedPolicy(
  address: string | null | undefined,
  chainId: number,
): VouchedPolicyEntry | undefined {
  if (!address) return undefined;
  const key = address.toLowerCase();
  const entry = VOUCHED_POLICIES[key];
  if (!entry || entry.chainId !== chainId) return undefined;
  return { ...entry, address: key };
}

/**
 * Vouched policies available on a given chain, for a picker.
 *
 * Superseded entries are omitted: they exist so old slots keep their labels,
 * not so anyone picks them again. `getVouchedPolicy` still resolves them.
 */
export function vouchedPoliciesForChain(chainId: number): VouchedPolicyEntry[] {
  return Object.entries(VOUCHED_POLICIES)
    .filter(([, p]) => p.chainId === chainId && !p.superseded)
    .map(([address, p]) => ({ ...p, address }));
}

/**
 * Vouched policies on a chain whose label or description matches `query`.
 *
 * Substring, case-insensitive; an empty query returns everything offerable on
 * the chain, so a picker can use this for both its initial list and its
 * filtered one. Superseded entries are excluded, inherited from
 * `vouchedPoliciesForChain`.
 */
export function searchVouchedPolicies(
  chainId: number,
  query: string,
): VouchedPolicyEntry[] {
  const q = query.trim().toLowerCase();
  const all = vouchedPoliciesForChain(chainId);
  if (!q) return all;
  return all.filter(
    (p) =>
      p.label.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.address.includes(q),
  );
}
