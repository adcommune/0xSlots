/**
 * "1h", "45m", "30s" — compact enough for a badge.
 *
 * Duplicated rather than imported from the app: this is SDK-level, and a policy
 * label must read the same for any consumer, not just this frontend.
 */
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
