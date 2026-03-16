import { z } from "zod";
import { defineAd } from "../core/ad-definition";
import { adlandAPI } from "../services/adland.api";

export const farcasterProfileAd = defineAd({
  type: "farcasterProfile",
  data: z.object({
    fid: z.string().nonempty("Fid is required"),
  }),
  metadata: z.object({
    pfpUrl: z.string().optional(),
    bio: z.string().optional(),
    username: z.string().optional(),
    displayName: z.string().optional(),
    followers: z.number().optional(),
    following: z.number().optional(),
    pro: z.boolean().optional(),
  }),
  async verify({ fid }) {
    const res = await adlandAPI.verifyFarcasterProfile({ fid });
    if (!res.verified) {
      throw new Error("Farcaster profile verification failed");
    }
  },
  async getMetadata({ fid }) {
    const res = await adlandAPI.getFarcasterProfile({ fid });
    return {
      pfpUrl: res.pfpUrl,
      bio: res.bio,
      username: res.username,
      displayName: res.displayName,
      followers: res.followers,
      following: res.following,
      pro: res.pro,
    };
  },
});

export type FarcasterProfileAdData = z.infer<typeof farcasterProfileAd.data>;
export type FarcasterProfileAdMetadata = z.infer<
  NonNullable<typeof farcasterProfileAd.metadata>
>;
export type FarcasterProfileAd = {
  type: "farcasterProfile";
  data: FarcasterProfileAdData;
  metadata: FarcasterProfileAdMetadata;
};
