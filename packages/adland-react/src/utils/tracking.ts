import type { AdAuth } from "../types";

const API_URL = "https://api.0xslots.org";
const UMAMI_URL = "https://umami.api.0xslots.org";
const UMAMI_WEBSITE_ID = "de57f532-8be9-4979-a400-97dae9a0a449";

interface TrackingPayload {
  slot: string;
  chainId: number;
  auth?: AdAuth;
  context?: string;
  cid?: string | null;
  empty?: boolean;
}

interface VerificationPayload {
  verified: boolean;
  fid?: number;
  address?: string;
}

/** Track which slot+url combos have already been counted this session */
const tracked = new Set<string>();

/** Cache the Farcaster auth token per session */
let cachedAuthToken: string | null = null;
let authAttempted = false;

/** Cache the verification result per session */
let cachedVerification: VerificationPayload | null = null;
let verificationAttempted = false;

/**
 * Get a Farcaster Quick Auth token via miniapp SDK.
 */
async function getFarcasterToken(): Promise<string | null> {
  if (cachedAuthToken) return cachedAuthToken;
  if (authAttempted) return null;

  authAttempted = true;
  try {
    const sdk = await import("@farcaster/miniapp-sdk").then((m) => m.default);
    const isInMiniApp = await sdk.isInMiniApp();
    if (!isInMiniApp) return null;

    const result = await sdk.quickAuth.getToken();
    cachedAuthToken = result.token;
    return cachedAuthToken;
  } catch {
    return null;
  }
}

/**
 * Verify a Farcaster token via the API and cache the result.
 */
async function getVerification(
  token: string,
  domain: string,
): Promise<VerificationPayload> {
  if (cachedVerification) return cachedVerification;
  if (verificationAttempted) return { verified: false };

  verificationAttempted = true;
  try {
    const res = await fetch(`${API_URL}/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, domain }),
    });
    if (res.ok) {
      cachedVerification = (await res.json()) as VerificationPayload;
      return cachedVerification;
    }
  } catch {}

  return { verified: false };
}

/**
 * Send a tracking event directly to Umami, enriched with optional verification data.
 */
async function sendEvent(
  eventName: string,
  data: TrackingPayload,
): Promise<void> {
  if (typeof window === "undefined") return;

  const { auth, ...eventData } = data;

  let verification: VerificationPayload = { verified: false };

  if (auth === "farcaster") {
    const token = await getFarcasterToken();
    if (token) {
      verification = await getVerification(token, window.location.hostname);
    }
  }

  const enrichedData: Record<string, string | number | boolean | undefined> = {
    ...eventData,
    hostname: window.location.hostname,
    verified: verification.verified,
    authMethod: auth ?? "none",
    ...(verification.fid !== undefined ? { fid: verification.fid } : {}),
    ...(verification.address ? { userAddress: verification.address } : {}),
  };

  try {
    fetch(`${UMAMI_URL}/api/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "event",
        payload: {
          website: UMAMI_WEBSITE_ID,
          url: window.location.href,
          referrer: document.referrer || undefined,
          hostname: window.location.hostname,
          name: eventName,
          data: enrichedData,
        },
      }),
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

/**
 * Track a unique impression (once per slot per page load).
 */
export function trackImpression(
  element: HTMLElement | null,
  data: TrackingPayload,
): (() => void) | undefined {
  if (!element || typeof window === "undefined") return;

  const key = `impression:${data.slot}:${window.location.href}`;
  if (tracked.has(key)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && !tracked.has(key)) {
          tracked.add(key);
          sendEvent("impression", data);
          observer.disconnect();
        }
      }
    },
    { threshold: 0.5 },
  );

  observer.observe(element);

  return () => observer.disconnect();
}

/**
 * Track a click event.
 */
export function trackClick(eventName: string, data: TrackingPayload): void {
  sendEvent(eventName, data);
}
