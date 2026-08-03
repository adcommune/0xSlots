import type { VouchedPolicy } from "./types";

/**
 * Policies the protocol vouches for, keyed by lowercase address.
 *
 * Kept small on purpose. This used to be the ONLY way a policy got a name,
 * which stopped working the moment tenure became configurable at slot creation
 * — the address space went open-ended and a hardcoded list could not keep up.
 * `resolvePolicy` derives names on-chain now, so an entry here is only needed
 * for a policy with no factory to verify it against.
 *
 * What it is still for, and both matter:
 *   1. Populating a "verified policy" picker — an editorial judgement.
 *   2. Naming policies `resolvePolicy` cannot derive: one with no factory, or
 *      one deployed outside its factory so the CREATE2 provenance check fails.
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
  // No factory at all, so this is the only way it can be named.
  "0x0c8501c02b88bfcb10d9a2de6a40abce342eb1cd": {
    chainId: 84532,
    label: "Queue priority",
    impact: "near-pure",
    description:
      "When the slot frees up it goes to whoever queued first, rather than to whoever is fastest. Buying an occupied slot is unaffected.",
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

/** Vouched policies available on a given chain, for a picker. */
export function vouchedPoliciesForChain(chainId: number): VouchedPolicyEntry[] {
  return Object.entries(VOUCHED_POLICIES)
    .filter(([, p]) => p.chainId === chainId)
    .map(([address, p]) => ({ ...p, address }));
}

/**
 * Vouched policies on a chain whose label or description matches `query`.
 *
 * Substring, case-insensitive; an empty query returns everything on the chain,
 * so a picker can use this for both its initial list and its filtered one.
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

/** Peripheral contracts, for linking out from slot pages. */
export const SLOT_QUEUE_ADDRESSES: Record<number, string> = {
  84532: "0x83AFEf8eF55B4d624D5f61088FD095603913616d",
};
