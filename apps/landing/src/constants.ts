import type { SlotsChain } from "@0xslots/sdk";

export const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;

/** 30 days in seconds (used for tax-rate calculations). */
export const MONTH_SECONDS = 30n * 24n * 60n * 60n;

export const useTunnel = process.env.NEXT_PUBLIC_USE_TUNNEL === "true";

export const APP_URL = useTunnel
  ? "https://really-intense-guppy.ngrok-free.app"
  : (process.env.NEXT_PUBLIC_APP_URL ?? "https://app.0xslots.org");

export const AD_SLOTS: Partial<Record<SlotsChain, string[]>> = {
  // Slot addresses will be provided — using placeholders
  // [8453 as SlotsChain]: [
  //   "0x...",
  //   "0x...",
  //   "0x...",
  // ],
};
