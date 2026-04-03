import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { pinata } from "./services/pinata";
import { slotsClient } from "./services/subgraph";
import { startEventListener } from "./services/events";
import { verifyFarcasterAuth } from "./services/tracking";
import analyticsRoutes from "./routes/analytics";
import adlandRoutes from "./routes/adland";
import {
  parseAccountAssociation,
  type ParsedAccountAssociation,
} from "@adland/data";
import { db } from "./db";
import { events, domains } from "./db/schema";
import { eq } from "drizzle-orm";

const alchemyKey = process.env.ALCHEMY_KEY as string;

const AdDataQueryError = {
  NO_AD: "NO_AD",
  ERROR: "ERROR",
} as const;

const app = new Hono();

// Enable CORS for all routes
app.use("*", cors());

app.get("/", (c) => {
  return c.json({ message: "Hello AdLand API!" });
});

app.get("/ad/slot/:slotAddress", async (c) => {
  const { slotAddress } = c.req.param();

  try {
    const { metadataSlot } = await slotsClient.modules.metadata.getSlot({
      id: slotAddress.toLowerCase(),
    });

    if (!metadataSlot?.uri) {
      return c.json({ error: AdDataQueryError.NO_AD }, 404);
    }

    // Fetch ad content from URI (ipfs://, https://, etc.)
    const uri = metadataSlot.uri.startsWith("ipfs://")
      ? metadataSlot.uri.replace(
          "ipfs://",
          "https://gateway.pinata.cloud/ipfs/",
        )
      : metadataSlot.uri;

    const ad = await fetch(uri).then((res) => res.json());
    return c.json(ad);
  } catch (error) {
    console.error("Error fetching ad data:", error);
    return c.json({ error: AdDataQueryError.ERROR }, 500);
  }
});

app.post("/ipfs/upload", async (c) => {
  try {
    const body = await c.req.json();
    const result = await pinata.upload.public.json(body);
    return c.json({ cid: result.cid, uri: `ipfs://${result.cid}` });
  } catch (error) {
    console.error("IPFS upload error:", error);
    return c.json({ error: "IPFS upload failed" }, 500);
  }
});

// ── Analytics ─────────────────────────────────────────────────────────────────

app.route("/analytics", analyticsRoutes);
app.route("/adland", adlandRoutes);

// ── Event tracking (direct DB insert) ─────────────────────────────────────────

app.post("/track", async (c) => {
  try {
    const body = await c.req.json();
    const { type, slot, cid, domain, auth, token } = body;

    if (!type || !slot) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    if (type !== "view" && type !== "click") {
      return c.json({ error: "Invalid event type" }, 400);
    }

    // Verify Farcaster auth if claimed
    let resolvedAuth: "farcaster" | "none" = "none";
    if (auth === "farcaster" && token && domain) {
      const user = await verifyFarcasterAuth(token, domain);
      if (user) {
        resolvedAuth = "farcaster";
      }
    }

    // Resolve domain on first encounter
    if (domain) {
      const existing = await db
        .select({ domain: domains.domain })
        .from(domains)
        .where(eq(domains.domain, domain))
        .limit(1);

      if (existing.length === 0) {
        let isMiniapp = false;
        let manifest: Record<string, unknown> | null = null;
        let owner:
          | (ParsedAccountAssociation & { username?: string; pfpUrl?: string })
          | null = null;

        try {
          const res = await fetch(
            `https://${domain}/.well-known/farcaster.json`,
          );
          if (res.ok) {
            const json = (await res.json()) as Record<string, unknown>;
            manifest = json;
            isMiniapp = true;

            const accountAssociation = json.accountAssociation as
              | {
                  header: string;
                  payload: string;
                  signature: string;
                }
              | undefined;

            if (accountAssociation) {
              owner = parseAccountAssociation(accountAssociation);
            }
          }
        } catch {
          // Not a miniapp — record as simple domain
        }

        await db.insert(domains).values({
          domain,
          isMiniapp,
          manifest,
          owner,
          lastUpdatedAt: new Date(),
        });
      }
    }

    await db.insert(events).values({
      type,
      authType: resolvedAuth,
      domain: domain || null,
      slotAddress: slot,
      cid: cid || null,
    });

    return c.json({ ok: true });
  } catch (error) {
    console.error("[tracking] Error:", error);
    return c.json({ ok: true });
  }
});

serve(
  {
    fetch: app.fetch,
    port: 3069,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
    startEventListener(alchemyKey);
  },
);
