import { db } from "../db";
import { events } from "../db/schema";
import { eq, and, gte, sql, count } from "drizzle-orm";

// ── Types ───────────────────────────────────────────────────────────────────

export interface DomainSummary {
  domain: string;
  impressions: number;
  clicks: number;
}

export interface DomainDetail {
  domain: string;
  days: { date: string; impressions: number; clicks: number }[];
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
  series: { date: string; impressions: number; clicks: number }[];
  totals: { impressions: number; clicks: number };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function daysAgo(n: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

// ── Public API ──────────────────────────────────────────────────────────────

export async function listDomains(): Promise<DomainSummary[]> {
  const since = daysAgo(90);

  const rows = await db
    .select({
      domain: events.domain,
      type: events.type,
      count: count(),
    })
    .from(events)
    .where(gte(events.createdAt, since))
    .groupBy(events.domain, events.type);

  const map = new Map<string, DomainSummary>();

  for (const row of rows) {
    const domain = row.domain ?? "unknown";
    const entry = map.get(domain) ?? { domain, impressions: 0, clicks: 0 };
    if (row.type === "view") entry.impressions = row.count;
    if (row.type === "click") entry.clicks = row.count;
    map.set(domain, entry);
  }

  return Array.from(map.values()).sort(
    (a, b) => b.impressions + b.clicks - (a.impressions + a.clicks),
  );
}

export async function getDomainDetail(domain: string): Promise<DomainDetail> {
  const since = daysAgo(7);

  const rows = await db
    .select({
      date: sql<string>`date_trunc('day', ${events.createdAt})::date::text`,
      type: events.type,
      count: count(),
    })
    .from(events)
    .where(and(eq(events.domain, domain), gte(events.createdAt, since)))
    .groupBy(sql`date_trunc('day', ${events.createdAt})::date`, events.type);

  // Build a map of date -> { impressions, clicks }
  const dayMap = new Map<string, { impressions: number; clicks: number }>();

  // Pre-fill 7 days
  for (let i = 6; i >= 0; i--) {
    const d = daysAgo(i);
    const key = d.toISOString().slice(0, 10);
    dayMap.set(key, { impressions: 0, clicks: 0 });
  }

  for (const row of rows) {
    const entry = dayMap.get(row.date) ?? { impressions: 0, clicks: 0 };
    if (row.type === "view") entry.impressions = row.count;
    if (row.type === "click") entry.clicks = row.count;
    dayMap.set(row.date, entry);
  }

  const days = Array.from(dayMap.entries()).map(([date, counts]) => ({
    date,
    ...counts,
  }));

  const totals = days.reduce(
    (acc, d) => ({
      impressions: acc.impressions + d.impressions,
      clicks: acc.clicks + d.clicks,
    }),
    { impressions: 0, clicks: 0 },
  );

  return { domain, days, totals };
}

export async function getSlotSummary(slot: string): Promise<SlotSummary> {
  const since = daysAgo(7);

  const rows = await db
    .select({
      type: events.type,
      count: count(),
    })
    .from(events)
    .where(and(eq(events.slotAddress, slot), gte(events.createdAt, since)))
    .groupBy(events.type);

  let impressions = 0;
  let clicks = 0;
  for (const row of rows) {
    if (row.type === "view") impressions = row.count;
    if (row.type === "click") clicks = row.count;
  }

  return { slot, impressions, clicks };
}

export async function getSlotSeries(
  slot: string,
  period: "7d" | "30d" = "7d",
): Promise<SlotSeries> {
  const numDays = period === "7d" ? 7 : 30;
  const since = daysAgo(numDays);

  const rows = await db
    .select({
      date: sql<string>`date_trunc('day', ${events.createdAt})::date::text`,
      type: events.type,
      count: count(),
    })
    .from(events)
    .where(and(eq(events.slotAddress, slot), gte(events.createdAt, since)))
    .groupBy(sql`date_trunc('day', ${events.createdAt})::date`, events.type);

  // Pre-fill days
  const dayMap = new Map<string, { impressions: number; clicks: number }>();
  for (let i = numDays - 1; i >= 0; i--) {
    const d = daysAgo(i);
    const key = d.toISOString().slice(0, 10);
    dayMap.set(key, { impressions: 0, clicks: 0 });
  }

  for (const row of rows) {
    const entry = dayMap.get(row.date) ?? { impressions: 0, clicks: 0 };
    if (row.type === "view") entry.impressions = row.count;
    if (row.type === "click") entry.clicks = row.count;
    dayMap.set(row.date, entry);
  }

  const series = Array.from(dayMap.entries()).map(([date, counts]) => ({
    date,
    ...counts,
  }));

  const totals = series.reduce(
    (acc, d) => ({
      impressions: acc.impressions + d.impressions,
      clicks: acc.clicks + d.clicks,
    }),
    { impressions: 0, clicks: 0 },
  );

  return { slot, period, series, totals };
}
