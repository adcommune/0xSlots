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
      header:
        "eyJmaWQiOjE3MzMsInR5cGUiOiJhdXRoIiwia2V5IjoiMHhjMGU1RTBFODIzYURmMTQ4YjRjMzliOTZiMjA4NDhkMjlDQ0FFMTg4In0",
      payload: "eyJkb21haW4iOiJhcHAuMHhzbG90cy5vcmcifQ",
      signature:
        "d08zVBRPzHbs4RBTqNU4SNWhP1iigwf3uiP9ARY/1ekpQYFi1XCoPVGY1ndjeSEmK1bINes++pRmFd4vNeG1+Rw=",
    },
    miniapp: {
      version: "1",
      name: "0xSlots",
      iconUrl: `${APP_URL}/logo.png`,
      homeUrl: APP_URL,
      imageUrl: `${APP_URL}/api/og`,
      buttonTitle: "Explore",
      splashImageUrl: `${APP_URL}/logo.png`,
      splashBackgroundColor: "#ffffff",
      description: "Taxable Slots",
    },
  });
}
