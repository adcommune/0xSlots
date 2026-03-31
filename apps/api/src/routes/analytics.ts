import { Hono } from "hono";
import { db } from "../db";
import { events, domains } from "../db/schema";
import { eq, and, gte, sql, count } from "drizzle-orm";

const app = new Hono();

// ── Helpers ─────────────────────────────────────────────────────────────────

type Period = "24h" | "7d" | "30d";

function periodToDays(period: Period): number {
  switch (period) {
    case "24h":
      return 1;
    case "7d":
      return 7;
    case "30d":
      return 30;
  }
}

function parsePeriod(raw: string | undefined): Period {
  if (raw === "24h" || raw === "7d" || raw === "30d") return raw;
  return "7d";
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

function prefillDays(numDays: number) {
  const map = new Map<string, { views: number; clicks: number }>();
  for (let i = numDays - 1; i >= 0; i--) {
    const key = daysAgo(i).toISOString().slice(0, 10);
    map.set(key, { views: 0, clicks: 0 });
  }
  return map;
}

function aggregateRows(
  rows: { date: string; type: "view" | "click" | null; count: number }[],
  dayMap: Map<string, { views: number; clicks: number }>,
) {
  for (const row of rows) {
    const entry = dayMap.get(row.date) ?? { views: 0, clicks: 0 };
    if (row.type === "view") entry.views = row.count;
    if (row.type === "click") entry.clicks = row.count;
    dayMap.set(row.date, entry);
  }

  const series = Array.from(dayMap.entries()).map(([date, counts]) => ({
    date,
    ...counts,
  }));

  const totals = series.reduce(
    (acc, d) => ({ views: acc.views + d.views, clicks: acc.clicks + d.clicks }),
    { views: 0, clicks: 0 },
  );

  return { series, totals };
}

// ── Domains ─────────────────────────────────────────────────────────────────

/** List all known domains with their metadata. */
app.get("/domains", async (c) => {
  try {
    const rows = await db.select().from(domains);
    return c.json(rows);
  } catch (error) {
    console.error("[analytics] Error listing domains:", error);
    return c.json({ error: "Failed to list domains" }, 500);
  }
});

/** Single domain stats: daily views + clicks. ?period=24h|7d|30d */
app.get("/domains/:domain", async (c) => {
  try {
    const { domain } = c.req.param();
    const period = parsePeriod(c.req.query("period"));
    const numDays = periodToDays(period);
    const since = daysAgo(numDays);

    const rows = await db
      .select({
        date: sql<string>`date_trunc('day', ${events.createdAt})::date::text`,
        type: events.type,
        count: count(),
      })
      .from(events)
      .where(and(eq(events.domain, domain), gte(events.createdAt, since)))
      .groupBy(sql`date_trunc('day', ${events.createdAt})::date`, events.type);

    const { series, totals } = aggregateRows(rows, prefillDays(numDays));

    return c.json({ domain, period, series, totals });
  } catch (error) {
    console.error("[analytics] Error fetching domain detail:", error);
    return c.json({ error: "Failed to fetch domain detail" }, 500);
  }
});

// ── Slots ───────────────────────────────────────────────────────────────────

/** Single slot stats: daily views + clicks. ?period=24h|7d|30d */
app.get("/slots/:slot", async (c) => {
  try {
    const { slot } = c.req.param();
    const period = parsePeriod(c.req.query("period"));
    const numDays = periodToDays(period);
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

    const { series, totals } = aggregateRows(rows, prefillDays(numDays));

    return c.json({ slot, period, series, totals });
  } catch (error) {
    console.error("[analytics] Error fetching slot stats:", error);
    return c.json({ error: "Failed to fetch slot stats" }, 500);
  }
});

export default app;
