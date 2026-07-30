/**
 * Effective occupancy resolution.
 *
 * ## Why this exists
 *
 * On a slot with `epochSeconds > 0`, a buy *commits* and takes effect at the
 * next clock boundary. The handover is applied **lazily** on-chain — nothing
 * runs at the boundary itself. `Slot.sol` compensates by resolving its own
 * getters (`occupant()`, `price()`, `deposit()`, `taxOwed()`), so the contract
 * always reports the truth.
 *
 * Indexers cannot do that. The subgraph only learns of the handover when some
 * transaction materialises it and `Bought` fires, which may be hours later or
 * never. In between, the chain says the buyer occupies while the subgraph still
 * says the seller does.
 *
 * The subgraph can't fix this itself either: GraphQL has no notion of "now" at
 * query time, so it cannot evaluate `now >= effectiveAt`. It therefore exposes
 * the raw pending fields and leaves the resolution to callers — this module.
 *
 * ## Rule
 *
 * **Anything user-facing must go through `resolveEffectiveOccupancy`.** Reading
 * `slot.occupant` straight from a subgraph response will, during that window,
 * name the wrong person — the one who has already stopped paying tax on it.
 */

/** The subset of subgraph `Slot` fields this module needs. */
export interface OccupancyFields {
  occupant?: string | null;
  price?: string | bigint | null;
  deposit?: string | bigint | null;
  occupiedSince?: string | bigint | null;
  epochSeconds?: string | bigint | null;
  pendingBuyer?: string | null;
  pendingEffectiveAt?: string | bigint | null;
  pendingPrice?: string | bigint | null;
  pendingDeposit?: string | bigint | null;
}

export interface EffectiveOccupancy {
  /** Who the chain considers the occupant right now. `null` when vacant. */
  occupant: string | null;
  price: bigint;
  deposit: bigint;
  /** When the current occupancy began — what tenure policies measure from. */
  occupiedSince: bigint;
  /**
   * True when a scheduled transfer has matured but the indexer has not yet seen
   * it materialise. The values above already account for it; this flag exists so
   * a UI can say "just changed hands, settling" rather than looking stale or
   * flickering when the indexer catches up.
   */
  isResolvedAhead: boolean;
  /** A transfer is committed but its boundary has not passed yet. */
  hasPendingTransfer: boolean;
  /** Boundary of the pending transfer, if any. */
  pendingEffectiveAt: bigint | null;
  /** Incoming occupant of the pending transfer, if any. */
  pendingBuyer: string | null;
}

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function toBigInt(v: string | bigint | null | undefined): bigint {
  if (v === null || v === undefined) return 0n;
  return typeof v === "bigint" ? v : BigInt(v);
}

function normalizeAddress(v: string | null | undefined): string | null {
  if (!v) return null;
  return v.toLowerCase() === ZERO_ADDRESS ? null : v;
}

/**
 * Resolve a slot's true current occupancy from indexed data.
 *
 * @param slot  Slot fields as returned by the subgraph.
 * @param nowSeconds  Unix seconds to evaluate against. Defaults to the client
 *   clock. Pass an explicit value in tests, in SSR, or when rendering against a
 *   known block timestamp — client clocks drift, and a fast clock will show a
 *   handover before the chain agrees.
 */
export function resolveEffectiveOccupancy(
  slot: OccupancyFields,
  nowSeconds: number | bigint = Math.floor(Date.now() / 1000)
): EffectiveOccupancy {
  const now = typeof nowSeconds === "bigint" ? nowSeconds : BigInt(nowSeconds);

  const pendingBuyer = normalizeAddress(slot.pendingBuyer);
  const pendingEffectiveAt = slot.pendingEffectiveAt
    ? toBigInt(slot.pendingEffectiveAt)
    : null;

  const hasPending = pendingBuyer !== null && pendingEffectiveAt !== null;
  const matured = hasPending && now >= (pendingEffectiveAt as bigint);

  if (matured) {
    // The boundary has passed. On-chain, `occupant()` already returns the
    // buyer and tax already accrues to them — mirror that.
    return {
      occupant: pendingBuyer,
      price: toBigInt(slot.pendingPrice),
      deposit: toBigInt(slot.pendingDeposit),
      occupiedSince: pendingEffectiveAt as bigint,
      isResolvedAhead: true,
      hasPendingTransfer: false,
      pendingEffectiveAt: null,
      pendingBuyer: null,
    };
  }

  return {
    occupant: normalizeAddress(slot.occupant),
    price: toBigInt(slot.price),
    deposit: toBigInt(slot.deposit),
    occupiedSince: toBigInt(slot.occupiedSince),
    isResolvedAhead: false,
    hasPendingTransfer: hasPending,
    pendingEffectiveAt,
    pendingBuyer,
  };
}

/**
 * Next epoch boundary for a slot, mirroring `Slot.nextBoundary()`.
 * Returns `now` when epochs are off, so callers can treat both modes uniformly.
 */
export function nextBoundary(
  epochSeconds: string | bigint | null | undefined,
  nowSeconds: number | bigint = Math.floor(Date.now() / 1000)
): bigint {
  const epoch = toBigInt(epochSeconds);
  const now = typeof nowSeconds === "bigint" ? nowSeconds : BigInt(nowSeconds);
  if (epoch === 0n) return now;
  return (now / epoch + 1n) * epoch;
}

/**
 * Seconds until a buy placed now would take effect. `0` on an instant-buy slot.
 *
 * This is the number worth surfacing to an agent deciding whether to bid: it is
 * the whole point of epochs that this window is the same for everyone and
 * nobody gets to choose theirs, so speed stops being an edge.
 */
export function secondsUntilEffective(
  epochSeconds: string | bigint | null | undefined,
  nowSeconds: number | bigint = Math.floor(Date.now() / 1000)
): bigint {
  const now = typeof nowSeconds === "bigint" ? nowSeconds : BigInt(nowSeconds);
  return nextBoundary(epochSeconds, now) - now;
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
        "A transfer is already scheduled on this slot. First commit wins, and commits cannot be cancelled — wait for it to land.",
    };
  }
  return { ok: true };
}
