import type { AdAuth } from "../types";

const API_URL = "https://api.0xslots.org";

interface TrackingPayload {
  slot: string;
  chainId: number;
  auth?: AdAuth;
  context?: string;
  cid?: string | null;
  empty?: boolean;
}

/** Track which slot+url combos have already been counted this session */
const tracked = new Set<string>();

/** Cache the auth token per session */
let cachedAuthToken: string | null = null;
let authAttempted = false;

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
 * Send a tracking event through the API proxy.
 */
async function sendEvent(
  eventName: string,
  data: TrackingPayload,
): Promise<void> {
  if (typeof window === "undefined") return;

  const { auth, ...eventData } = data;
  let authToken: string | null = null;

  if (auth === "farcaster") {
    authToken = await getFarcasterToken();
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  try {
    fetch(`${API_URL}/events/track`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        event: eventName,
        url: window.location.href,
        referrer: document.referrer || undefined,
        hostname: window.location.hostname,
        data: eventData,
        authMethod: auth || "none",
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

  const eventName = data.empty ? "impression-empty" : "impression";
  const key = `${eventName}:${data.slot}:${window.location.href}`;
  if (tracked.has(key)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && !tracked.has(key)) {
          tracked.add(key);
          sendEvent(eventName, data);
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
