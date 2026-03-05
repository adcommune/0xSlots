import { formatUnits, parseUnits } from "viem";

export const truncateAddress = (address: string) => {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Format a raw token amount (string) using viem's formatUnits.
 * Trims trailing zeros for clean display.
 */
export function formatPrice(raw: string, decimals: number = 18): string {
  if (!raw || raw === "0") return "0";
  const formatted = formatUnits(BigInt(raw), decimals);
  const num = parseFloat(formatted);
  if (num === 0) return "0";
  if (num < 0.0001) return "<0.0001";
  // Show up to 6 decimal places, trim trailing zeros
  return parseFloat(num.toFixed(Math.min(decimals, 6))).toString();
}

/**
 * Format a bigint balance using viem's formatUnits.
 */
export function formatBalance(value: bigint, decimals: number): string {
  if (value === 0n) return "0";
  const formatted = formatUnits(value, decimals);
  const num = parseFloat(formatted);
  if (num === 0) return "0";
  if (num < 0.0001) return "<0.0001";
  return parseFloat(num.toFixed(Math.min(decimals, 6))).toString();
}

/**
 * Parse a human-readable amount to raw units using viem's parseUnits.
 */
export function toRawUnits(value: string, decimals: number): bigint {
  try {
    return parseUnits(value || "0", decimals);
  } catch {
    return 0n;
  }
}

export function formatDuration(totalSeconds: number): string {
  if (totalSeconds >= 2 ** 128) return "∞";
  const years = Math.floor(totalSeconds / 31_536_000);
  const months = Math.floor((totalSeconds % 31_536_000) / 2_592_000);
  const days = Math.floor((totalSeconds % 2_592_000) / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  if (years > 0) return `${years}y ${months}mo`;
  if (months > 0) return `${months}mo ${days}d`;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  if (mins > 0) return `${mins}m`;
  return `${totalSeconds}s`;
}

export function formatBps(bps: string | number): string {
  return `${Number(bps) / 100}%`;
}
