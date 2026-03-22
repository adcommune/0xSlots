import { useEffect, useRef, useCallback } from "react";
import { sendTrackRequest } from "../utils/sdk";
import sdk from "@farcaster/miniapp-sdk";
import { FileWarningIcon, Loader, SquareDashed } from "lucide-react";
import { type AdData } from "@adland/data";
import { useFetch } from "../hooks/useFetch";
import BasicAdBody from "./BasicAdBody";
import LinkAdContent from "./content/LinkAdContent";
import MiniappAdContent from "./content/MiniappAdContent";
import CastAdContent from "./content/CastAdContent";
import TokenAdContent from "./content/TokenAdContent";
import FarcasterProfileAdContent from "./content/FarcasterProfileAdContent";
import { AdDataQueryError, AdProps } from "../types";
import { getBaseUrl } from "../utils";
import { fetchAdFromURI, fetchMetadataURI } from "../fetch";

const DEFAULT_RPC = "https://sepolia.base.org";
const DEFAULT_METADATA_MODULE = "0x6c5A8A7f061bEd94b1b88CFAd4e1a1a8C5c4e527";

/**
 * Ad component powered by 0xSlots v3 MetadataModule.
 * Fetches ad content URI from on-chain, then fetches content from IPFS/HTTP.
 *
 * @example
 * ```tsx
 * <Ad slot="0xabc...123" />
 * ```
 */
export function Ad({
  slot,
  metadataModule = DEFAULT_METADATA_MODULE,
  network = "testnet",
  baseUrl,
  rpcUrl = DEFAULT_RPC,
  ...props
}: AdProps) {
  const ref = useRef<HTMLDivElement>(null);
  const networkBaseUrl = baseUrl ?? getBaseUrl(network);

  const {
    data: adData,
    isLoading,
    error,
  } = useFetch<AdData>(
    `ad-data-${slot}`,
    async () => {
      const uri = await fetchMetadataURI(rpcUrl, metadataModule, slot);
      if (!uri) throw new Error(AdDataQueryError.NO_AD);
      return fetchAdFromURI(uri);
    },
    { enabled: !!slot },
  );

  const send = useCallback(
    (type: "view" | "click") => {
      const trackEndpoint = `${networkBaseUrl}/api/analytics/track`;

      sendTrackRequest(trackEndpoint, {
        type,
        slot,
      }).catch((error: unknown) => {
        console.error(`[@adland/react] Failed to track ${type}:`, error);
      });
    },
    [slot, networkBaseUrl],
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const key = `ad_view_${slot}`;

    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;

        const already = sessionStorage.getItem(key);
        if (already) {
          obs.unobserve(el);
          return;
        }

        sessionStorage.setItem(key, "1");
        send("view");
        obs.unobserve(el);
      },
      { threshold: 0.15 },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [slot, send]);

  const onClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      const isInteractiveElement =
        target.tagName === "A" ||
        target.tagName === "BUTTON" ||
        target.closest("a") !== null ||
        target.closest("button") !== null;

      if (!isInteractiveElement) {
        send("click");
      }
    },
    [send],
  );

  return (
    <div ref={ref} onClick={onClick} {...props}>
      {(() => {
        if (isLoading) return <LoadingAdContent />;
        if (error) {
          if (error instanceof Error) {
            if (error.message === AdDataQueryError.NO_AD) {
              return <EmtpyAdContent slot={slot} baseUrl={networkBaseUrl} />;
            }
          }
          return <ErrorAdContent error={error} />;
        }
        if (adData) {
          return (
            <>
              {adData.type === "link" && <LinkAdContent data={adData} />}
              {adData.type === "cast" && <CastAdContent data={adData} />}
              {adData.type === "miniapp" && <MiniappAdContent data={adData} />}
              {adData.type === "token" && <TokenAdContent data={adData} />}
              {adData.type === "farcasterProfile" && (
                <FarcasterProfileAdContent data={adData} />
              )}
            </>
          );
        }
        return <EmtpyAdContent slot={slot} baseUrl={networkBaseUrl} />;
      })()}
    </div>
  );
}

function ErrorAdContent({ error }: { error: unknown }) {
  return (
    <BasicAdBody>
      <div className="flex flex-row items-center gap-2">
        <FileWarningIcon className="w-5 h-5 md:w-7 md:h-7" />
        <p className="font-bold text-primary">ERROR</p>
      </div>
    </BasicAdBody>
  );
}

function LoadingAdContent() {
  return (
    <BasicAdBody>
      <div className="flex flex-row items-center gap-2">
        <Loader className="w-5 h-5 md:w-7 md:h-7 animate-spin" />
        <p className="font-bold text-primary">LOADING...</p>
      </div>
    </BasicAdBody>
  );
}

function EmtpyAdContent({ slot, baseUrl }: { slot: string; baseUrl: string }) {
  return (
    <BasicAdBody
      onClick={() => {
        sdk.actions.openMiniApp({
          url: `${baseUrl}/slots/${slot}`,
        });
      }}
    >
      <div className="flex flex-row items-center gap-2">
        <SquareDashed className="w-5 h-5 md:w-7 md:h-7" />
        <p className="font-bold text-primary">
          NO AD{" "}
          <span className="text-xs text-muted-foreground/80 font-normal">
            (Your ad here)
          </span>
        </p>
      </div>
    </BasicAdBody>
  );
}
