import { z } from "zod";
import { defineAd } from "../core/ad-definition";
import { adlandAPI } from "../services/adland.api";

/**
 * Link Ad Definition
 * Represents a basic link ad with validation and verification
 */
export const linkAd = defineAd({
  type: "link",

  data: z.object({
    url: z.string().nonempty("URL is required"),
  }),
  metadata: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    image: z.string().optional(),
    icon: z.string().optional(),
  }),
  async verify({ url }) {
    if (!url.startsWith("http")) {
      throw new Error("Invalid link");
    }
  },
  async getMetadata({ url }) {
    const metadata = await adlandAPI.getLinkMetadata({ url });
    return {
      title: metadata.title,
      description: metadata.description,
      image: metadata.image,
      icon: metadata.icon,
    };
  },
});

/**
 * Type inference for LinkAd data
 */
export type LinkAdData = z.infer<typeof linkAd.data>;

/**
 * Type inference for LinkAd metadata
 */
export type LinkAdMetadata = z.infer<NonNullable<typeof linkAd.metadata>>;

export type LinkAd = {
  type: "link";
  data: LinkAdData;
  metadata: LinkAdMetadata;
};
