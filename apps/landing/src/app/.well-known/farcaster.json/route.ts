import { NextResponse } from "next/server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.0xslots.org";

/**
 * Farcaster miniapp manifest.
 *
 * `accountAssociation` must be generated for your domain at:
 *   https://farcaster.xyz/~/developers/mini-apps/manifest
 *
 * Replace the placeholder values below once you have them.
 */
export function GET() {
  return NextResponse.json({
    accountAssociation: {
      header: "REPLACE_ME",
      payload: "REPLACE_ME",
      signature: "REPLACE_ME",
    },
    miniapp: {
      version: "1",
      name: "0xSlots",
      iconUrl: `${APP_URL}/logo.png`,
      homeUrl: APP_URL,
      imageUrl: `${APP_URL}/banner.png`,
      buttonTitle: "Explore",
      splashImageUrl: `${APP_URL}/logo.png`,
      splashBackgroundColor: "#ffffffff",
      description: "Taxable Slots",
    },
  });
}
