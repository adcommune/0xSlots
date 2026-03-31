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

/**
 * Send a tracking event to the API.
 */
function sendEvent(
  eventType: "view" | "click",
  data: TrackingPayload,
): void {
  if (typeof window === "undefined") return;

  try {
    fetch(`${API_URL}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: eventType,
        slot: data.slot,
        cid: data.cid ?? null,
        domain: window.location.hostname,
        auth: data.auth ?? "none",
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
export function trackClick(_eventName: string, data: TrackingPayload): void {
  sendEvent("click", data);
}
