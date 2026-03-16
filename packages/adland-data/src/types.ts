/**
 * Ad type literals
 */
export const adTypes = ["link", "cast", "miniapp"] as const;

/**
 * Union type of all ad type strings
 */
export type AdType = (typeof adTypes)[number];
