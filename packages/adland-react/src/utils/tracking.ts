import type { AdAuth } from "../types";
import { adlandApiUrl } from "./constants";

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

/** Cache the Farcaster auth token per session */
let cachedAuthToken: string | null = null;
let authAttempted = false;

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
 * Send a tracking event to the API.
 */
async function sendEvent(
  eventType: "view" | "click",
  data: TrackingPayload,
): Promise<void> {
  if (typeof window === "undefined") return;

  let token: string | null = null;
  if (data.auth === "farcaster") {
    token = await getFarcasterToken();
  }

  try {
    fetch(`${adlandApiUrl}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: eventType,
        slot: data.slot,
        cid: data.cid ?? null,
        domain: window.location.hostname,
        auth: data.auth ?? "none",
        ...(token ? { token } : {}),
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
          sendEvent("view", data);
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
export function trackClick(
  _eventName: string,
  data: TrackingPayload,
): Promise<void> {
  return sendEvent("click", data);
}
