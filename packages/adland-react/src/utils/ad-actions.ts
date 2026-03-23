import type { AdData } from "@adland/data";
import sdk from "@farcaster/miniapp-sdk";

export function performAdAction(adData: AdData) {
  try {
    switch (adData.type) {
      case "link":
        sdk.actions.openUrl(adData.data.url);
        break;
      case "cast":
        sdk.actions.viewCast({ hash: adData.data.hash });
        break;
      case "miniapp":
        sdk.actions.openMiniApp({ url: adData.data.url });
        break;
      case "token":
        sdk.actions.viewToken({ token: adData.data.address });
        break;
      case "farcasterProfile":
        sdk.actions.viewProfile({ fid: Number.parseInt(adData.data.fid, 10) });
        break;
    }
  } catch (err) {
    console.error("[@adland/react] Failed to perform ad action:", err);
  }
}
