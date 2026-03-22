/**
 * Formats a timestamp as a relative time string (e.g., "2 days ago", "55 minutes ago")
 * @param timestamp - Unix timestamp in seconds or milliseconds
 * @returns Formatted relative time string
 */
export function formatRelativeTime(timestamp: number): string {
  // Convert to milliseconds if timestamp is in seconds (less than year 2000 in ms)
  const timestampMs = timestamp < 946684800000 ? timestamp * 1000 : timestamp;
  const now = Date.now();
  const diffMs = now - timestampMs;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 60) {
    return diffSeconds <= 1 ? "just now" : `${diffSeconds} seconds ago`;
  }

  if (diffMinutes < 60) {
    return diffMinutes === 1 ? "1 minute ago" : `${diffMinutes} minutes ago`;
  }

  if (diffHours < 24) {
    return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
  }

  if (diffDays < 7) {
    return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
  }

  if (diffWeeks < 4) {
    return diffWeeks === 1 ? "1 week ago" : `${diffWeeks} weeks ago`;
  }

  if (diffMonths < 12) {
    return diffMonths === 1 ? "1 month ago" : `${diffMonths} months ago`;
  }

  return diffYears === 1 ? "1 year ago" : `${diffYears} years ago`;
}
