import { z } from "zod";
import { defineAd } from "../core/ad-definition";
import { adlandAPI } from "../services/adland.api";

export const tokenAd = defineAd({
  type: "token",
  data: z.object({
    address: z.string().nonempty("Address is required"),
    chainId: z
      .number()
      .int()
      .positive("Chain ID is required")
      .refine((chainId) => [8453].includes(chainId), "Invalid chain ID"),
  }),
  metadata: z.object({
    name: z.string().optional(),
    symbol: z.string().optional(),
    decimals: z.number().optional(),
    logoURI: z.string().optional(),
  }),
  async verify({ address, chainId }) {
    const res = await adlandAPI.verifyToken({ address, chainId });
    if (!res.verified) {
      throw new Error("Token verification failed");
    }
  },
  async getMetadata({ address, chainId }) {
    const token = await adlandAPI.getTokenMetadata({ address, chainId });
    return {
      name: token.name,
      symbol: token.symbol,
      decimals: token.decimals,
      logoURI: token.logoURI,
    };
  },
});

export type TokenAdData = z.infer<typeof tokenAd.data>;
export type TokenAdMetadata = z.infer<NonNullable<typeof tokenAd.metadata>>;
export type TokenAd = {
  type: "token";
  data: TokenAdData;
  metadata: TokenAdMetadata;
};
