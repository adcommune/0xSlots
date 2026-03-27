/**
 * Umami analytics query client.
 *
 * Self-hosted Umami exposes a REST API behind a Bearer JWT obtained via
 * POST /api/auth/login.  We cache the token and refresh on 401.
 *
 * Relevant upstream endpoints used here:
 *   GET /api/websites/:id/metrics          – aggregated dimension metrics
 *   GET /api/websites/:id/events/series    – time-bucketed event counts
 *   GET /api/websites/:id/event-data/values – custom property value counts
 */

const UMAMI_URL = process.env.UMAMI_URL || "https://umami.api.0xslots.org";
const UMAMI_WEBSITE_ID =
  process.env.UMAMI_WEBSITE_ID || "de57f532-8be9-4979-a400-97dae9a0a449";
const UMAMI_USERNAME = process.env.UMAMI_USERNAME || "admin";
const UMAMI_PASSWORD = process.env.UMAMI_PASSWORD || "";

// ── Auth ────────────────────────────────────────────────────────────────────

let cachedToken: string | null = null;

async function getToken(): Promise<string> {
  if (cachedToken) return cachedToken;
  const res = await fetch(`${UMAMI_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: UMAMI_USERNAME,
      password: UMAMI_PASSWORD,
    }),
  });
  if (!res.ok) throw new Error(`Umami auth failed: ${res.status}`);
  const { token } = (await res.json()) as { token: string };
  cachedToken = token;
  return token;
}

async function umamiGet<T>(
  path: string,
  params: Record<string, string | number | undefined>,
): Promise<T> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) qs.set(k, String(v));
  }
  const url = `${UMAMI_URL}${path}?${qs}`;

  const doFetch = async (token: string) =>
    fetch(url, { headers: { Authorization: `Bearer ${token}` } });

  let token = await getToken();
  let res = await doFetch(token);

  // Refresh token on 401
  if (res.status === 401) {
    cachedToken = null;
    token = await getToken();
    res = await doFetch(token);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Umami ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function daysAgo(n: number): number {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d.getTime();
}

function now(): number {
  return Date.now();
}

const ws = (path: string) => `/api/websites/${UMAMI_WEBSITE_ID}${path}`;

interface DailyWindow {
  date: string;
  startAt: number;
  endAt: number;
}

function buildDailyWindows(numDays: number): DailyWindow[] {
  const windows: DailyWindow[] = [];
  for (let i = numDays - 1; i >= 0; i--) {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    start.setUTCDate(start.getUTCDate() - i);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    windows.push({
      date: start.toISOString().slice(0, 10),
      startAt: start.getTime(),
      endAt: end.getTime(),
    });
  }
  return windows;
}

// ── Types ───────────────────────────────────────────────────────────────────

export interface DomainSummary {
  domain: string;
  impressions: number;
  clicks: number;
}

export interface DomainDetail {
  domain: string;
  /** Per-day breakdown for the past 7 days */
  days: {
    date: string;
    impressions: number;
    clicks: number;
  }[];
  totals: { impressions: number; clicks: number };
}

export interface SlotSummary {
  slot: string;
  impressions: number;
  clicks: number;
}

export interface SlotSeries {
  slot: string;
  period: "7d" | "30d";
  /** One entry per day */
  series: {
    date: string;
    impressions: number;
    clicks: number;
  }[];
  totals: { impressions: number; clicks: number };
}

// ── Public API ──────────────────────────────────────────────────────────────

interface EventDataValue {
  value: string;
  total: number;
}

/**
 * List all domains that have sent events, with total impression + click counts.
 * Queries the event-data/values endpoint using the "hostname" custom property.
 */
export async function listDomains(): Promise<DomainSummary[]> {
  const startAt = daysAgo(90);
  const endAt = now();

  const [impressionHosts, clickHosts] = await Promise.all([
    umamiGet<EventDataValue[]>(ws("/event-data/values"), {
      startAt,
      endAt,
      eventName: "impression",
      propertyName: "hostname",
    }),
    umamiGet<EventDataValue[]>(ws("/event-data/values"), {
      startAt,
      endAt,
      eventName: "click",
      propertyName: "hostname",
    }),
  ]);

  const map = new Map<string, DomainSummary>();

  for (const row of impressionHosts) {
    const entry = map.get(row.value) || { domain: row.value, impressions: 0, clicks: 0 };
    entry.impressions = row.total;
    map.set(row.value, entry);
  }

  for (const row of clickHosts) {
    const entry = map.get(row.value) || { domain: row.value, impressions: 0, clicks: 0 };
    entry.clicks = row.total;
    map.set(row.value, entry);
  }

  return Array.from(map.values()).sort(
    (a, b) => b.impressions + b.clicks - (a.impressions + a.clicks),
  );
}

/**
 * Get a single domain's daily impression + click breakdown for the past 7 days.
 * Uses daily windowed queries on event-data/values filtered by hostname value.
 */
export async function getDomainDetail(domain: string): Promise<DomainDetail> {
  const windows = buildDailyWindows(7);

  const days = await Promise.all(
    windows.map(async (w) => {
      const [impValues, clickValues] = await Promise.all([
        umamiGet<EventDataValue[]>(ws("/event-data/values"), {
          startAt: w.startAt,
          endAt: w.endAt,
          eventName: "impression",
          propertyName: "hostname",
        }),
        umamiGet<EventDataValue[]>(ws("/event-data/values"), {
          startAt: w.startAt,
          endAt: w.endAt,
          eventName: "click",
          propertyName: "hostname",
        }),
      ]);

      return {
        date: w.date,
        impressions: impValues.find((v) => v.value === domain)?.total ?? 0,
        clicks: clickValues.find((v) => v.value === domain)?.total ?? 0,
      };
    }),
  );

  const totals = days.reduce(
    (acc, d) => ({
      impressions: acc.impressions + d.impressions,
      clicks: acc.clicks + d.clicks,
    }),
    { impressions: 0, clicks: 0 },
  );

  return { domain, days, totals };
}

/**
 * Get a single slot's impression + click totals for the past 7 days.
 * Filters on the custom event-data property "slot".
 */
export async function getSlotSummary(slot: string): Promise<SlotSummary> {
  const startAt = daysAgo(7);
  const endAt = now();

  const [impressionValues, clickValues] = await Promise.all([
    umamiGet<{ value: string; total: number }[]>(ws("/event-data/values"), {
      startAt,
      endAt,
      eventName: "impression",
      propertyName: "slot",
    }),
    umamiGet<{ value: string; total: number }[]>(ws("/event-data/values"), {
      startAt,
      endAt,
      eventName: "click",
      propertyName: "slot",
    }),
  ]);

  const impressions =
    impressionValues.find((v) => v.value === slot)?.total ?? 0;
  const clicks = clickValues.find((v) => v.value === slot)?.total ?? 0;

  return { slot, impressions, clicks };
}

/**
 * Get chartable time-series data for a single slot (7d or 30d).
 *
 * Because Umami's events/series endpoint doesn't natively filter by custom
 * event-data properties, we query the event-data/values endpoint per-day
 * in a batched manner. We split the period into daily windows and fire all
 * requests in parallel.
 */
export async function getSlotSeries(
  slot: string,
  period: "7d" | "30d" = "7d",
): Promise<SlotSeries> {
  const windows = buildDailyWindows(period === "7d" ? 7 : 30);

  // Fire all daily queries in parallel (2 per day: impression + click)
  const results = await Promise.all(
    windows.map(async (w) => {
      const [impValues, clickValues] = await Promise.all([
        umamiGet<{ value: string; total: number }[]>(ws("/event-data/values"), {
          startAt: w.startAt,
          endAt: w.endAt,
          eventName: "impression",
          propertyName: "slot",
        }),
        umamiGet<{ value: string; total: number }[]>(ws("/event-data/values"), {
          startAt: w.startAt,
          endAt: w.endAt,
          eventName: "click",
          propertyName: "slot",
        }),
      ]);

      return {
        date: w.date,
        impressions: impValues.find((v) => v.value === slot)?.total ?? 0,
        clicks: clickValues.find((v) => v.value === slot)?.total ?? 0,
      };
    }),
  );

  const totals = results.reduce(
    (acc, d) => ({
      impressions: acc.impressions + d.impressions,
      clicks: acc.clicks + d.clicks,
    }),
    { impressions: 0, clicks: 0 },
  );

  return { slot, period, series: results, totals };
}
