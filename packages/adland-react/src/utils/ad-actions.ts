import type { SlotsChain } from "@0xslots/sdk";
import type { AdData } from "@adland/data";
import sdk from "@farcaster/miniapp-sdk";

async function isMiniApp(): Promise<boolean> {
  try {
    const context = await Promise.race([
      sdk.context,
      new Promise((r) => setTimeout(r, 500)),
    ]);
    return !!context;
  } catch {
    return false;
  }
}

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
        sdk.actions.viewProfile({
          fid: Number.parseInt(adData.data.fid, 10),
        });
        break;
    }
  } catch (err) {
    // Fallback for web (non-miniapp) context
    if (adData.type === "link" || adData.type === "miniapp") {
      window.open(adData.data.url, "_blank");
    } else {
      console.error("[@adland/react] Failed to perform ad action:", err);
    }
  }
}

export async function performEmptyAdAction(
  slot: string,
  chainId: SlotsChain,
  baseLinkUrl: string,
) {
  const url = `${baseLinkUrl}/slots/${slot}?chain=${chainId}`;
  if (await isMiniApp()) {
    sdk.actions.openMiniApp({ url });
  } else {
    window.open(url, "_blank");
  }
}
