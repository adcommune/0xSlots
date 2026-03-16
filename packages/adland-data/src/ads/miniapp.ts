import { z } from "zod";
import { defineAd } from "../core/ad-definition";
import { adlandAPI } from "../services/adland.api";

/**
 * MiniApp Ad Definition
 * Represents a Farcaster mini app ad with validation and verification
 */
export const miniappAd = defineAd({
  type: "miniapp",

  data: z.object({
    url: z.string().nonempty("URL is required"),
  }),

  metadata: z.object({
    icon: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    imageUrl: z.string().optional(),
  }),

  async verify({ url }) {
    const errorMessage = "Miniapp domain verification failed";
    const domain = url.split("//")[1];
    console.log("verifyMiniapp:domain", domain);
    if (!domain) {
      throw new Error(errorMessage);
    }
    const res = await adlandAPI.verifyMiniapp({ domain });
    console.log("verifyMiniapp:res", res);
    if (!res.verified) {
      throw new Error(errorMessage);
    }
  },
  async getMetadata({ url }) {
    const res = await adlandAPI.getMiniappMetadata({ url });
    console.log("getMetadata:res", res);
    return {
      icon: res.icon,
      title: res.title,
      description: res.description,
      imageUrl: res.imageUrl,
    };
  },
});

/**
 * Type inference for MiniAppAd data
 */
export type MiniAppAdData = z.infer<typeof miniappAd.data>;

/**
 * Type inference for MiniAppAd metadata
 */
export type MiniAppAdMetadata = z.infer<NonNullable<typeof miniappAd.metadata>>;

export type MiniAppAd = {
  type: "miniapp";
  data: MiniAppAdData;
  metadata: MiniAppAdMetadata;
};
