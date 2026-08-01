/**
 * Occupancy policies this app can describe by name.
 *
 * Deliberately a static map rather than an on-chain lookup: a policy's ADDRESS
 * is its configuration (MinimumTenurePolicy bakes its window into an immutable
 * constructor arg), so a given address always means exactly one thing and can
 * be described without a call.
 *
 * `impact` is the honesty label. The protocol enforces safety — no policy can
 * block liquidation or stop an occupant leaving — but it deliberately does NOT
 * enforce purity, so how far a slot has drifted from plain Harberger is
 * something the UI has to tell people rather than something the chain
 * guarantees.
 *
 *   near-pure — changes only when a transfer lands, not whether one can
 *   soft     — meaningfully delays forced sale
 *
 * An address absent from this map renders as "unrecognised" rather than
 * silently as safe.
 */
export type PolicyImpact = "near-pure" | "soft";

export interface KnownPolicy {
  label: string;
  impact: PolicyImpact;
  description: string;
  /** Chain this deployment lives on. A policy address is chain-specific. */
  chainId: number;
  /**
   * Protection window, for policies that have one. Lets the UI draw a meter
   * instead of describing the rule in a paragraph. Absent for policies whose
   * behaviour is not a duration.
   */
  tenureSeconds?: number;
}

/** Keyed by lowercase address. Same policy can be deployed per chain. */
export const KNOWN_POLICIES: Record<string, KnownPolicy> = {
  // Base Sepolia — deployed 2026-07-29, block 44825297
  "0xb7a0c71a6ab1293732216540e8321bda1f986622": {
    chainId: 84532,
    tenureSeconds: 604800,
    label: "7d minimum tenure",
    impact: "soft",
    description:
      "Nobody can buy the occupant out for 7 days after they take the slot. Liquidation still works if they stop paying.",
  },
  "0x0c8501c02b88bfcb10d9a2de6a40abce342eb1cd": {
    chainId: 84532,
    label: "Queue priority",
    impact: "near-pure",
    description:
      "When the slot frees up it goes to whoever queued first, rather than to whoever is fastest. Buying an occupied slot is unaffected.",
  },
};

/** Peripheral contracts, for linking out from slot pages. */
export const SLOT_QUEUE_ADDRESSES: Record<number, string> = {
  84532: "0x83AFEf8eF55B4d624D5f61088FD095603913616d",
};

/** Verified policies deployed on a given chain, for the create form. */
export function knownPoliciesForChain(
  chainId: number,
): Array<[string, KnownPolicy]> {
  return Object.entries(KNOWN_POLICIES).filter(
    ([, p]) => p.chainId === chainId,
  );
}
