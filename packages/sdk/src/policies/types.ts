import type { Address } from "viem";

/**
 * How far a policy moves a slot from plain Harberger.
 *
 * The protocol enforces SAFETY — no policy can block liquidation or stop an
 * occupant leaving, because the core never routes `release` or `liquidate`
 * through one. It deliberately does NOT enforce PURITY, so how much a slot has
 * drifted is something a UI has to tell people rather than something the chain
 * guarantees. This label is that honesty.
 *
 *   near-pure — constrains the TERMS of a buy, never whether one can happen
 *   soft      — meaningfully delays forced sale
 *   unknown   — not recognised; assume nothing
 */
export type PolicyImpact = "near-pure" | "soft" | "unknown";

/** Policy kinds this SDK can identify from an address alone. */
export type PolicyKindId = "tenure" | "price" | "vouched" | "unknown";

/**
 * A policy address, resolved into something a human can read.
 *
 * `kind: "unknown"` is a real answer, not a failure: an address that is not a
 * recognised policy must render as unrecognised rather than silently as safe.
 */
export interface ResolvedPolicy {
  address: Address;
  kind: PolicyKindId;
  label: string;
  description: string;
  impact: PolicyImpact;

  /** Protection window, for tenure policies. Lets a UI draw a meter. */
  tenureSeconds?: number;
  /** Floor, for price policies. Raw units of `currency`. */
  minPrice?: bigint;
  /** Currency a price floor is denominated in. */
  currency?: Address;
}

/**
 * A policy the protocol vouches for by hand.
 *
 * This is EDITORIAL, not derivation — it is the list a UI offers as "verified",
 * which is a judgement no amount of on-chain reading produces. Everything that
 * can be derived is derived; see `resolvePolicy`.
 *
 * A policy with a factory does not need an entry here to be named correctly.
 *
 * When one is listed anyway — to stock a "verified" picker — it must carry the
 * same terms derivation would have produced. `resolvePolicy` checks this list
 * FIRST and returns without touching the network, so a thin entry silently
 * downgrades a policy that could have been read in full.
 */
export interface VouchedPolicy {
  /** Chain this deployment lives on. A policy address is chain-specific. */
  chainId: number;
  label: string;
  description: string;
  impact: PolicyImpact;
  /** Protection window, for tenure policies. Mirrors `ResolvedPolicy`. */
  tenureSeconds?: number;
  /** Floor in raw units, for price policies. Mirrors `ResolvedPolicy`. */
  minPrice?: bigint;
  /** Currency a price floor is denominated in. */
  currency?: Address;
  /**
   * Listed only so it can still be NAMED, never offered as a new choice.
   *
   * This is the difference between the two reasons an entry exists. A policy
   * whose factory has since been superseded can no longer be derived — the
   * current factory predicts a different address, so the provenance check
   * rightly refuses it — but slots already pointing at it must keep rendering
   * a label rather than a bare address.
   *
   * `getVouchedPolicy` still returns these, so naming works. The picker
   * accessors (`vouchedPoliciesForChain`, `searchVouchedPolicies`) omit them,
   * so nobody is offered terms whose replacement already exists at a different
   * address — which would otherwise show the same floor twice.
   */
  superseded?: boolean;
}
