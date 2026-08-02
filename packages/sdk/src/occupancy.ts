/**
 * Occupancy helpers.
 *
 * ## What used to live here
 *
 * Epoch scheduling deferred a buy to the next clock boundary, and nothing ran
 * at that boundary — the handover was applied lazily by whichever transaction
 * came next. `Slot.sol` covered for that by resolving its own getters, but an
 * indexer could not: GraphQL has no notion of "now" at query time, so the
 * subgraph exposed the raw pending fields and every caller had to reconcile
 * them. That reconciliation (`resolveEffectiveOccupancy` and friends) lived
 * here, and had to be repeated by every UI that read a slot.
 *
 * Epoch scheduling was removed in v4: `buy()` always transfers immediately, so
 * indexed occupancy is simply correct and there is nothing to resolve.
 *
 * A transfer scheduled before that upgrade still materialises on-chain —
 * `_materialize` was deliberately retained so no buyer's escrow is stranded —
 * which is why `canAttemptBuy` still looks for one. There were none outstanding
 * at upgrade time, so in practice it always passes.
 */

/** The subset of subgraph `Slot` fields this module needs. */
export interface OccupancyFields {
  pendingBuyer?: string | null;
}

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function normalizeAddress(v: string | null | undefined): string | null {
  if (!v) return null;
  return v.toLowerCase() === ZERO_ADDRESS ? null : v;
}

/**
 * Whether a buy is worth attempting right now.
 *
 * Not authoritative — the slot's occupancy policy is the only real gate, and it
 * is fail-closed. This is for disabling a button, not for deciding safety.
 */
export function canAttemptBuy(slot: OccupancyFields): {
  ok: boolean;
  reason?: string;
} {
  const pendingBuyer = normalizeAddress(slot.pendingBuyer);
  if (pendingBuyer !== null) {
    return {
      ok: false,
      reason:
        "This slot still has a transfer scheduled from before epochs were removed. It completes on the next interaction — try again in a moment.",
    };
  }
  return { ok: true };
}
