import type { SlotsChain } from "@0xslots/sdk";
import type { AdData } from "@adland/data";
import sdk from "@farcaster/miniapp-sdk";
import { getAddress } from "viem";

// Cache the miniapp check at module level — resolved once, sync thereafter
let _isMiniApp: boolean | null = null;
const _miniAppPromise = sdk
  .isInMiniApp()
  .then((v) => {
    _isMiniApp = v;
    return v;
  })
  .catch(() => {
    _isMiniApp = false;
    return false;
  });

async function isMiniApp(): Promise<boolean> {
  if (_isMiniApp !== null) return _isMiniApp;
  return _miniAppPromise;
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
      case "token": {
        const address = adData.data.address;
        const chainId = adData.data.chainId;
        const buyToken = `eip155:${chainId}/erc20:${getAddress(address)}`;
        sdk.actions.swapToken({ buyToken });
        break;
      }
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
