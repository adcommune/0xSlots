import { SlotsChain } from "@0xslots/sdk";
import type { AdData } from "@adland/data";
import { useCallback, useEffect, useMemo, useRef } from "react";

import { createReadClient, fetchAdFromURI, fetchMetadataURI } from "../fetch";
import { AdContext, useAd } from "../hooks/useAdContext";
import { useFetch } from "../hooks/useFetch";
import { AdDataQueryError, type AdProps } from "../types";
import { performAdAction, performEmptyAdAction } from "../utils/ad-actions";
import {
  getAdDescription,
  getAdImage,
  getAdTitle,
  getAdType,
} from "../utils/ad-fields";
import { adCardIcon, adCardLabel } from "../utils/constants";
import { trackClick, trackImpression } from "../utils/tracking";

// ─── Root component ──────────────────────────────────────────────────────────

/**
 * Root Ad component — compound pattern.
 *
 * @example
 * ```tsx
 * <Ad slot="0xabc...123" className="rounded-md border p-3">
 *   <AdImage className="size-10 rounded-md" />
 *   <AdTitle className="text-sm font-medium" />
 *   <AdDescription className="text-xs text-muted-foreground" />
 *   <AdBadge />
 * </Ad>
 * ```
 */
export function Ad({
  slot,
  data: staticData,
  chainId = SlotsChain.BASE,
  rpcUrl,
  baseLinkUrl = "https://app.0xslots.org",
  auth = "none",
  context,
  children,
  ...props
}: AdProps) {
  const ref = useRef<HTMLDivElement>(null);

  const client = useMemo(
    () => (slot ? createReadClient(chainId, rpcUrl) : null),
    [slot, chainId, rpcUrl],
  );

  const {
    data: fetchResult,
    isLoading,
    error,
  } = useFetch<{ data: AdData; cid: string | null } | null>(
    `ad-data-${slot}`,
    async () => {
      if (!client || !slot) throw new Error(AdDataQueryError.NO_AD);
      const uri = await fetchMetadataURI(client, slot);
      if (!uri) {
        console.info("[Ad] no metadata URI found for slot", slot);
        return null;
      }
      return fetchAdFromURI(uri);
    },
    { enabled: !!slot && !staticData },
  );

  const adData = staticData ?? fetchResult?.data ?? null;
  const cid = fetchResult?.cid ?? null;

  const isEmpty =
    !adData &&
    !isLoading &&
    (error instanceof Error
      ? error.message === AdDataQueryError.NO_AD
      : !error);

  // Track impression when ad is visible in viewport (once per slot per page load)
  useEffect(() => {
    if (!adData || !slot) return;
    return trackImpression(ref.current, { slot, chainId, auth, context, cid });
  }, [adData, slot, chainId, auth, context, cid]);

  // Track impression for empty slots too
  useEffect(() => {
    if (!isEmpty || !slot) return;
    return trackImpression(ref.current, {
      slot,
      chainId,
      auth,
      context,
      empty: true,
    });
  }, [isEmpty, slot, chainId, auth, context]);

  const onClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      const isInteractive =
        target.tagName === "A" ||
        target.tagName === "BUTTON" ||
        target.closest("a") !== null ||
        target.closest("button") !== null;
      if (isInteractive) return;

      if (adData) {
        if (slot) trackClick("click", { slot, chainId, auth, context, cid });
        performAdAction(adData);
      } else if (isEmpty && slot) {
        trackClick("click-empty", { slot, chainId, auth, context });
        performEmptyAdAction(slot, chainId, baseLinkUrl);
      }
    },
    [adData, isEmpty, slot, chainId, baseLinkUrl, cid],
  );

  return (
    <AdContext.Provider
      value={{
        data: adData ?? null,
        cid,
        isLoading: !!slot && !staticData && isLoading,
        error,
        isEmpty,
        slot,
        baseLinkUrl,
        chainId,
      }}
    >
      <div ref={ref} onClick={onClick} {...props}>
        {children}
      </div>
    </AdContext.Provider>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

export interface AdImageProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: React.ReactNode;
}

export function AdImage({ fallback, ...props }: AdImageProps) {
  const { data } = useAd();
  const src = getAdImage(data);
  if (!src) return fallback ? <>{fallback}</> : null;
  return <img src={src} alt="" {...props} />;
}

export interface AdTitleProps
  extends React.HTMLAttributes<HTMLParagraphElement> {
  fallback?: React.ReactNode;
}

export function AdTitle({ fallback, children, ...props }: AdTitleProps) {
  const { data } = useAd();
  const title = getAdTitle(data);
  if (!title) return fallback ? <>{fallback}</> : null;
  return <p {...props}>{children ?? title}</p>;
}

export interface AdDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {
  fallback?: React.ReactNode;
}

export function AdDescription({
  fallback,
  children,
  ...props
}: AdDescriptionProps) {
  const { data } = useAd();
  const description = getAdDescription(data);
  if (!description) return fallback ? <>{fallback}</> : null;
  return <p {...props}>{children ?? description}</p>;
}

export interface AdBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {}

export function AdBadge({ children, ...props }: AdBadgeProps) {
  const { data } = useAd();
  const type = getAdType(data);
  if (!type) return null;
  const Icon = adCardIcon[type];
  const label = adCardLabel[type];
  return (
    <span {...props}>
      {children ?? (
        <>
          {Icon && <Icon className="size-3" />}
          {label}
        </>
      )}
    </span>
  );
}

export interface AdLabelProps extends React.HTMLAttributes<HTMLSpanElement> {}

export function AdLabel({ children, ...props }: AdLabelProps) {
  return <span {...props}>{children ?? "AD"}</span>;
}

// ─── State components ────────────────────────────────────────────────────────

export interface AdStatusProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export function AdLoading({ children, ...props }: AdStatusProps) {
  const { isLoading } = useAd();
  if (!isLoading) return null;
  return <div {...props}>{children ?? "Loading..."}</div>;
}

export function AdEmpty({ children, ...props }: AdStatusProps) {
  const { isEmpty } = useAd();
  if (!isEmpty) return null;
  return <div {...props}>{children ?? "Your ad here"}</div>;
}

export function AdError({ children, ...props }: AdStatusProps) {
  const { error, isEmpty } = useAd();
  if (!error || isEmpty) return null;
  return <div {...props}>{children ?? "Error loading ad"}</div>;
}

export function AdLoaded({ children, ...props }: AdStatusProps) {
  const { data } = useAd();
  if (!data) return null;
  return <div {...props}>{children}</div>;
}
