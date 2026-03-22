import { SlotsChain } from "@0xslots/sdk";
import type { AdData, AdType } from "@adland/data";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";

import { createReadClient, fetchAdFromURI, fetchMetadataURI } from "../fetch";
import { useFetch } from "../hooks/useFetch";
import { AdDataQueryError, type AdProps } from "../types";
import { getBaseUrl } from "../utils";
import { adCardIcon, adCardLabel } from "../utils/constants";
import { sendTrackRequest } from "../utils/sdk";

// ─── Context ─────────────────────────────────────────────────────────────────

export interface AdContextValue {
  data: AdData | null;
  isLoading: boolean;
  error: unknown;
  isEmpty: boolean;
  slot?: string;
}

const AdContext = createContext<AdContextValue | null>(null);

export function useAd(): AdContextValue {
  const ctx = useContext(AdContext);
  if (!ctx) throw new Error("useAd must be used within an <Ad> component");
  return ctx;
}

// ─── Field extraction helpers ────────────────────────────────────────────────

const IMAGE_KEYS = ["image", "icon", "pfpUrl", "logoURI", "imageUrl"] as const;
const TITLE_KEYS = ["title", "displayName", "username", "name", "symbol"] as const;
const DESC_KEYS = ["description", "bio", "text", "name"] as const;

function flatFields(data: AdData): Record<string, unknown> {
  return { ...data.data, ...(data.metadata ?? {}) };
}

export function getAdImage(data: AdData | null): string | null {
  if (!data) return null;
  const fields = flatFields(data);
  for (const key of IMAGE_KEYS) {
    const v = fields[key];
    if (typeof v === "string" && v) return v;
  }
  return null;
}

export function getAdTitle(data: AdData | null): string | null {
  if (!data) return null;
  const fields = flatFields(data);
  for (const key of TITLE_KEYS) {
    const v = fields[key];
    if (typeof v === "string" && v) return v;
  }
  return null;
}

export function getAdDescription(data: AdData | null): string | null {
  if (!data) return null;
  const fields = flatFields(data);
  const title = getAdTitle(data);
  for (const key of DESC_KEYS) {
    const v = fields[key];
    if (typeof v === "string" && v && v !== title) return v;
  }
  return null;
}

export function getAdType(data: AdData | null): AdType | null {
  if (!data) return null;
  return data.type as AdType;
}

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
  network = "testnet",
  baseUrl,
  rpcUrl,
  children,
  ...props
}: AdProps) {
  const ref = useRef<HTMLDivElement>(null);
  const networkBaseUrl = baseUrl ?? getBaseUrl(network);

  const client = useMemo(
    () => (slot ? createReadClient(chainId, rpcUrl) : null),
    [slot, chainId, rpcUrl],
  );

  const {
    data: fetchedData,
    isLoading,
    error,
  } = useFetch<AdData>(
    `ad-data-${slot}`,
    async () => {
      if (!client || !slot) throw new Error(AdDataQueryError.NO_AD);
      const uri = await fetchMetadataURI(client, slot);
      if (!uri) throw new Error(AdDataQueryError.NO_AD);
      return fetchAdFromURI(uri);
    },
    { enabled: !!slot && !staticData },
  );

  const adData = staticData ?? fetchedData;

  const isEmpty =
    !adData &&
    !isLoading &&
    (error instanceof Error
      ? error.message === AdDataQueryError.NO_AD
      : !error);

  const send = useCallback(
    (type: "view" | "click") => {
      if (!slot) return;
      const trackEndpoint = `${networkBaseUrl}/api/analytics/track`;
      sendTrackRequest(trackEndpoint, { type, slot }).catch(
        (error: unknown) => {
          console.error(`[@adland/react] Failed to track ${type}:`, error);
        },
      );
    },
    [slot, networkBaseUrl],
  );

  useEffect(() => {
    if (!slot) return;
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
      const isInteractive =
        target.tagName === "A" ||
        target.tagName === "BUTTON" ||
        target.closest("a") !== null ||
        target.closest("button") !== null;
      if (!isInteractive) send("click");
    },
    [send],
  );

  const ctx: AdContextValue = {
    data: adData ?? null,
    isLoading: !!slot && !staticData && isLoading,
    error,
    isEmpty,
    slot,
  };

  return (
    <AdContext.Provider value={ctx}>
      <div ref={ref} onClick={onClick} {...props}>
        {children}
      </div>
    </AdContext.Provider>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

export interface AdImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: React.ReactNode;
}

export function AdImage({ fallback, ...props }: AdImageProps) {
  const { data } = useAd();
  const src = getAdImage(data);
  if (!src) return fallback ? <>{fallback}</> : null;
  return <img src={src} alt="" {...props} />;
}

export interface AdTitleProps extends React.HTMLAttributes<HTMLParagraphElement> {
  fallback?: React.ReactNode;
}

export function AdTitle({ fallback, children, ...props }: AdTitleProps) {
  const { data } = useAd();
  const title = getAdTitle(data);
  if (!title) return fallback ? <>{fallback}</> : null;
  return <p {...props}>{children ?? title}</p>;
}

export interface AdDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  fallback?: React.ReactNode;
}

export function AdDescription({ fallback, children, ...props }: AdDescriptionProps) {
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

/** Renders the "AD" disclosure label. Always visible when inside an <Ad>. */
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
  return <div {...props}>{children ?? "No ad"}</div>;
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
