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
}

/** Keyed by lowercase address. Same policy can be deployed per chain. */
export const KNOWN_POLICIES: Record<string, KnownPolicy> = {
  // Base Sepolia — deployed 2026-07-29, block 44825297
  "0xb7a0c71a6ab1293732216540e8321bda1f986622": {
    label: "7d minimum tenure",
    impact: "soft",
    description:
      "The occupant cannot be bought out for 7 days after acquiring the slot. They pay for that protection up front — the full window's tax must be escrowed — and cannot cut their price while protected. Forced sale is delayed, not removed: a dishonestly low price is still punished, just later. Liquidation still works throughout, so insolvency always ends the tenure.",
  },
  "0x0c8501c02b88bfcb10d9a2de6a40abce342eb1cd": {
    label: "Queue priority",
    impact: "near-pure",
    description:
      "While the slot is vacant and its queue has live bids, only the queue may claim it — so the first bidder in line cannot be front-run the instant it frees up. It does not restrict buying an occupied slot, and it orders who may act rather than who sets the price.",
  },
};

/** Peripheral contracts, for linking out from slot pages. */
export const SLOT_QUEUE_ADDRESSES: Record<number, string> = {
  84532: "0x83AFEf8eF55B4d624D5f61088FD095603913616d",
};
