import { z } from "zod";
import { castAd } from "./ads/cast";
import { linkAd } from "./ads/link";
import { miniappAd } from "./ads/miniapp";
import type { CastAd } from "./ads/cast";
import type { LinkAd } from "./ads/link";
import type { MiniAppAd } from "./ads/miniapp";
import type { TokenAd } from "./ads/token";
import type { FarcasterProfileAd } from "./ads/profile";
import { tokenAd } from "./ads/token";
import { farcasterProfileAd } from "./ads/profile";

/**
 * Union type for all complete ad structures with type, data, and optional metadata
 */
export type AdData = CastAd | LinkAd | MiniAppAd | TokenAd | FarcasterProfileAd;

/**
 * Registry of all ad definitions
 * Each entry is an AdDefinition object
 */
export const ads = {
  link: linkAd,
  cast: castAd,
  miniapp: miniappAd,
  token: tokenAd,
  farcasterProfile: farcasterProfileAd,
} as const;

export const adTypes = [
  "link",
  "cast",
  "miniapp",
  "token",
  "farcasterProfile",
] as const;

/**
 * Type for ad definition keys
 */
export type AdType = keyof typeof ads;

/**
 * Get ad definition by type
 */
export function getAd(type: AdType) {
  return ads[type];
}
/**
 * Validate ad data against any ad definition
 */
export function validateAdData(data: any): {
  success: boolean;
  data?: {
    type: AdType;
    data: unknown;
  };
  error?: z.ZodError | string;
} {
  const dataType = data.type;
  if (!dataType || !adTypes.includes(dataType)) {
    return {
      success: false,
      error: "Data does not match any known ad type",
    };
  }
  const ad = getAd(data.type);

  const result = ad.data.safeParse(data.data);
  if (!result.success) {
    return {
      success: false,
      error: result.error,
    };
  }

  return {
    success: true,
    data: {
      type: dataType,
      data: result.data,
    },
  };
}

// Export all ad definitions
export * from "./ads";

// Export core utilities
export * from "./core/ad-definition";

// Export Farcaster utilities
export * from "./farcaster";

// Backward compatibility aliases
export const adDefinitions = ads;
export const adModels = ads;
