import { createClient, Errors } from "@farcaster/quick-auth";

const UMAMI_URL = process.env.UMAMI_URL || "https://umami.api.0xslots.org";
const UMAMI_WEBSITE_ID =
  process.env.UMAMI_WEBSITE_ID || "de57f532-8be9-4979-a400-97dae9a0a449";

const quickAuthClient = createClient();

interface TrackEventRequest {
  event: string;
  url: string;
  referrer?: string;
  hostname: string;
  data: Record<string, string | number | boolean | undefined>;
  authMethod: "farcaster" | "none";
}

interface VerifiedUser {
  fid: number;
  primaryAddress?: string;
}

/**
 * Verify a Farcaster Quick Auth JWT and resolve user info.
 */
export async function verifyFarcasterAuth(
  token: string,
  domain: string,
): Promise<VerifiedUser | null> {
  try {
    const payload = await quickAuthClient.verifyJwt({ token, domain });

    // Resolve primary Ethereum address
    let primaryAddress: string | undefined;
    try {
      const res = await fetch(
        `https://api.farcaster.xyz/fc/primary-address?fid=${payload.sub}&protocol=ethereum`,
      );
      if (res.ok) {
        const { result } = (await res.json()) as {
          result: { address: { address: string } };
        };
        primaryAddress = result.address.address;
      }
    } catch {}

    return { fid: payload.sub, primaryAddress };
  } catch (e) {
    if (e instanceof Errors.InvalidTokenError) {
      console.info("[tracking] Invalid Farcaster token:", e.message);
    }
    return null;
  }
}

/**
 * Forward a tracking event to Umami with verification metadata.
 */
export async function forwardToUmami(
  req: TrackEventRequest,
  verified: boolean,
  user?: VerifiedUser | null,
): Promise<void> {
  const eventData: Record<string, string | number | boolean | undefined> = {
    ...req.data,
    verified,
    authMethod: req.authMethod,
  };

  if (user) {
    eventData.fid = user.fid;
    if (user.primaryAddress) {
      eventData.userAddress = user.primaryAddress;
    }
  }

  try {
    const res = await fetch(`${UMAMI_URL}/api/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "AdLand-API/1.0",
      },
      body: JSON.stringify({
        type: "event",
        payload: {
          website: UMAMI_WEBSITE_ID,
          url: req.url,
          referrer: req.referrer,
          hostname: req.hostname,
          name: req.event,
          data: eventData,
        },
      }),
    });
    const text = await res.text().catch(() => "");
    if (!res.ok) {
      console.error(`[tracking] Umami responded ${res.status}: ${text}`);
    } else {
      console.info(`[tracking] Umami accepted (${res.status}): ${text}`);
    }
  } catch (e) {
    console.error("[tracking] Failed to forward to Umami:", e);
  }
}
