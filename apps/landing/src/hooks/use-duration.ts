"use client";

import { useEffect, useState } from "react";

/**
 * Time formatting and a ticking clock, for the tenure meter.
 *
 * This file used to also resolve "effective occupancy" — reconciling indexed
 * `slot.occupant` against a scheduled transfer whose boundary had passed but
 * which no transaction had written yet. Epoch scheduling was removed in v4, so
 * buys apply immediately and indexed occupancy is simply correct. Read
 * `slot.occupant` directly.
 */

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
 * Only ticks while `enabled`, so a slot with no tenure policy re-renders
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
