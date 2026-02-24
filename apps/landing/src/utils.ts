export const truncateAddress = (address: string) => {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export function formatPrice(wei: string, decimals: number = 18): string {
  const value = Number(wei) / 10 ** decimals;
  if (value === 0) return "0";
  if (value < 0.0001) return "<0.0001";
  return value.toFixed(decimals <= 6 ? decimals : 6);
}

export function formatBalance(value: bigint, decimals: number): string {
  const num = Number(value) / 10 ** decimals;
  if (num === 0) return "0";
  if (num < 0.0001) return "<0.0001";
  return num.toFixed(decimals <= 6 ? decimals : 6);
}

export function formatDuration(totalSeconds: number): string {
  if (totalSeconds >= 2 ** 128) return "∞";
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  if (mins > 0) return `${mins}m`;
  return `${totalSeconds}s`;
}
