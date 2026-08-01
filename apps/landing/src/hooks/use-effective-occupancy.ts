"use client";

import {
  type EffectiveOccupancy,
  type OccupancyFields,
  resolveEffectiveOccupancy,
  secondsUntilEffective,
} from "@0xslots/sdk";
import { useEffect, useMemo, useState } from "react";

/**
 * Resolve a slot's TRUE current occupancy.
 *
 * Indexed `slot.occupant` is the last occupant the subgraph saw materialise.
 * When a buy TAKES an epoch slot from someone the handover happens at a clock
 * boundary and is applied lazily on-chain, so between the boundary and the next
 * transaction touching the slot the chain already treats the buyer as occupant
 * while the subgraph still names the seller. That gap can be hours. (Claiming a
 * vacant slot is immediate, so it never opens one.)
 *
 * Never render `slot.occupant` directly, and never gate occupant-only actions
 * on it — during that window it names someone who has already stopped paying
 * tax on the slot, and would hand them controls they no longer have on-chain.
 *
 * The clock only ticks while a transfer is actually pending, so slots with
 * `epochSeconds = 0` (every slot today) cost nothing.
 */
export function useEffectiveOccupancy(
  slot: OccupancyFields | null | undefined,
): EffectiveOccupancy | null {
  const pendingAt = slot?.pendingEffectiveAt
    ? Number(slot.pendingEffectiveAt)
    : null;

  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    if (pendingAt === null) return;
    // Stop ticking once the boundary is behind us — from then on the resolved
    // value is stable until the indexer catches up and the field clears.
    const tick = () => setNow(Math.floor(Date.now() / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [pendingAt]);

  return useMemo(
    () => (slot ? resolveEffectiveOccupancy(slot, now) : null),
    [slot, now],
  );
}

/** Seconds until a buy placed right now would take effect. 0 on instant slots. */
export function useSecondsUntilEffective(
  epochSeconds: string | bigint | null | undefined,
): number {
  const epoch = epochSeconds ? Number(epochSeconds) : 0;
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    if (epoch === 0) return;
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, [epoch]);

  if (epoch === 0) return 0;
  return Number(secondsUntilEffective(epochSeconds, now));
}

/** "1h", "45m", "30s" — compact enough for a badge. */
export function formatDuration(seconds: number): string {
  if (seconds <= 0) return "now";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${Math.floor(seconds / 86400)}d`;
}

/**
 * Ticking wall clock in unix seconds, for time-position visuals.
 *
 * Only ticks while `enabled`, so a slot with no epoch and no tenure re-renders
 * nothing on a timer.
 */
export function useNow(enabled = true, intervalMs = 1000): number {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(
      () => setNow(Math.floor(Date.now() / 1000)),
      intervalMs,
    );
    return () => clearInterval(id);
  }, [enabled, intervalMs]);
  return now;
}
