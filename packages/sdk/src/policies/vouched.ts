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

/** Vouched policies available on a given chain, for a picker. */
export function vouchedPoliciesForChain(
  chainId: number,
): Array<[string, VouchedPolicy]> {
  return Object.entries(VOUCHED_POLICIES).filter(
    ([, p]) => p.chainId === chainId,
  );
}

/** Peripheral contracts, for linking out from slot pages. */
export const SLOT_QUEUE_ADDRESSES: Record<number, string> = {
  84532: "0x83AFEf8eF55B4d624D5f61088FD095603913616d",
};
