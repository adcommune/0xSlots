import { z } from "zod";
import { defineAd } from "../core/ad-definition";
import { adlandAPI } from "../services/adland.api";

/**
 * Cast Ad Definition
 * Represents a Farcaster cast ad with validation and verification
 */
export const castAd = defineAd({
  type: "cast",
  data: z.object({
    hash: z.string().nonempty("Hash is required"),
  }),
  metadata: z.object({
    username: z.string().optional(),
    pfpUrl: z.string().optional(),
    text: z.string().optional(),
    timestamp: z.number().optional(),
  }),
  async verify({ hash }) {
    if (!/^0x[0-9a-fA-F]{40}$/.test(hash)) {
      throw new Error("Invalid Farcaster cast hash");
    }

    const res = await adlandAPI.verifyCast({ hash });
    if (!res.verified) {
      throw new Error("Cast hash verification failed");
    }
  },
  async getMetadata({ hash }) {
    const cast = await adlandAPI.getCastMetadata({ hash });
    return {
      username: cast.username,
      pfpUrl: cast.pfpUrl,
      text: cast.text,
      timestamp: cast.timestamp,
    };
  },
});

/**
 * Type inference for CastAd data
 */
export type CastAdData = z.infer<typeof castAd.data>;

/**
 * Type inference for CastAd metadata
 */
export type CastAdMetadata = z.infer<NonNullable<typeof castAd.metadata>>;

export type CastAd = {
  type: "cast";
  data: CastAdData;
  metadata: CastAdMetadata;
};
