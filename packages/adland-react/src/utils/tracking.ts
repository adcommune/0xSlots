const UMAMI_URL = "https://umami.api.0xslots.org";
const WEBSITE_ID = "b02a0a73-70c1-44cd-b4ae-cd70fa3d632f";

interface TrackingPayload {
  slot: string;
  chainId: number;
  [key: string]: string | number | boolean | undefined;
}

/** Track which slot+url combos have already been counted this session */
const tracked = new Set<string>();

/**
 * Send an event to Umami's collect endpoint.
 * Fires and forgets — never blocks rendering.
 */
function sendEvent(eventName: string, data: TrackingPayload): void {
  if (typeof window === "undefined") return;

  const url = window.location.href;
  const referrer = document.referrer || undefined;
  const hostname = window.location.hostname;

  try {
    fetch(`${UMAMI_URL}/api/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "event",
        payload: {
          website: WEBSITE_ID,
          url,
          referrer,
          hostname,
          name: eventName,
          data,
        },
      }),
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

/**
 * Track a unique impression (once per slot per page load).
 * Returns a cleanup function for the IntersectionObserver.
 */
export function trackImpression(
  element: HTMLElement | null,
  data: TrackingPayload,
): (() => void) | undefined {
  if (!element || typeof window === "undefined") return;

  const key = `${data.slot}:${window.location.href}`;
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
    { threshold: 0.5 }, // 50% visible
  );

  observer.observe(element);

  return () => observer.disconnect();
}

/**
 * Track a click event (no dedup — every click counts).
 */
export function trackClick(eventName: string, data: TrackingPayload): void {
  sendEvent(eventName, data);
}
