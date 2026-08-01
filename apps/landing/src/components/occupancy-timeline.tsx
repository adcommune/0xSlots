"use client";

import { formatDuration } from "@/hooks/use-effective-occupancy";

/**
 * Occupancy, drawn instead of explained.
 *
 * Both facts here are positions in time — how far through the current epoch we
 * are, and how much protection is left — which a reader takes in from a picture
 * far faster than from a paragraph.
 *
 * Deliberately not a chart library: two shapes, and every number that matters is
 * also written as text beside it.
 */

function clockLabel(unixSeconds: number, epochSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  // Sub-day epochs read as a time; longer ones as a date.
  return epochSeconds < 86400
    ? d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * The current epoch, filling live, with any committed buy marked on it.
 *
 * One epoch rather than several: the useful question is "how far through are
 * we", and a single filling bar answers that at a glance. The commit marker is
 * a second colour because it is a different kind of fact — something that
 * happened, versus time passing.
 */
export function EpochTimeline({
  epochSeconds,
  committedAt,
  now,
}: {
  epochSeconds: number;
  /** When a buy was committed, if one is waiting. */
  committedAt?: number | null;
  now: number;
}) {
  const start = Math.floor(now / epochSeconds) * epochSeconds;
  const end = start + epochSeconds;
  const pct = Math.min(Math.max(((now - start) / epochSeconds) * 100, 0), 100);

  // Only mark a commit made inside the epoch being drawn.
  const commitPct =
    committedAt != null && committedAt >= start && committedAt < end
      ? ((committedAt - start) / epochSeconds) * 100
      : null;

  return (
    <div className="space-y-1.5">
      <div
        className="relative h-2.5 w-full rounded-full bg-muted overflow-hidden"
        role="img"
        aria-label={`Sales on this slot complete in ${formatDuration(end - now)}`}
      >
        <div
          className="h-full bg-sky-500/70 transition-[width] duration-1000 ease-linear"
          style={{ width: `${pct}%` }}
        />
        {commitPct !== null && (
          <span
            className="absolute inset-y-0 w-[3px] -translate-x-1/2 rounded-full bg-amber-500"
            style={{ left: `${commitPct}%` }}
          />
        )}
      </div>

      <div className="flex items-baseline justify-between text-[11px]">
        <span className="text-muted-foreground">
          {clockLabel(start, epochSeconds)}
        </span>
        <span>
          completes{" "}
          <span className="font-medium">{clockLabel(end, epochSeconds)}</span>
          <span className="text-muted-foreground">
            {" "}
            · {formatDuration(Math.max(end - now, 0))}
          </span>
        </span>
      </div>

      {commitPct !== null && committedAt != null && (
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="inline-block h-2 w-[3px] shrink-0 rounded-full bg-amber-500" />
          Sold at {clockLabel(committedAt, epochSeconds)} — completes when the
          bar fills.
        </p>
      )}
    </div>
  );
}

/**
 * How much of the occupant's protected window is left.
 *
 * A meter rather than a countdown: "3d left" means something different on a
 * 7-day protection than on a 30-day one, and the bar carries that comparison
 * for free.
 */
export function TenureMeter({
  tenureSeconds,
  occupiedSince,
  now,
}: {
  tenureSeconds: number;
  occupiedSince: number;
  now: number;
}) {
  const elapsed = Math.max(now - occupiedSince, 0);
  const remaining = Math.max(tenureSeconds - elapsed, 0);
  const pct = Math.min((elapsed / tenureSeconds) * 100, 100);
  const over = remaining === 0;

  return (
    <div className="space-y-1.5">
      <div
        className="h-2.5 w-full rounded-full bg-muted overflow-hidden"
        role="img"
        aria-label={
          over
            ? "Protection has ended; the slot can be bought"
            : `Protected for another ${formatDuration(remaining)} of ${formatDuration(tenureSeconds)}`
        }
      >
        <div
          className={`h-full transition-[width] duration-1000 ease-linear ${
            over ? "bg-muted-foreground/40" : "bg-violet-500/70"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-baseline justify-between text-[11px]">
        <span className="text-muted-foreground">
          held {formatDuration(elapsed)}
        </span>
        <span className={over ? "text-muted-foreground" : "text-violet-600"}>
          {over ? (
            "can be bought"
          ) : (
            <>
              protected{" "}
              <span className="font-medium">{formatDuration(remaining)}</span>{" "}
              more
            </>
          )}
        </span>
      </div>
    </div>
  );
}
