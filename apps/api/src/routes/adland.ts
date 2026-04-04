import { Hono } from "hono";
import { FarcasterAPI } from "@adland/data";
import { erc20Abi } from "viem";
import { neynar } from "../services/neynar";
import { getChainClient } from "@0xslots/config";
import { extractTweetId, fetchTweet } from "../services/twitter";
import { Cast } from "@neynar/nodejs-sdk/build/api";

const alchemyKey = process.env.ALCHEMY_KEY as string;

const app = new Hono();

// ── Tweet ────────────────────────────────────────────────────────────────────

/** GET /adland/tweet?url=https://x.com/user/status/123 */
app.get("/tweet", async (c) => {
  try {
    const { url } = c.req.query();

    if (!url) {
      return c.json({ error: "URL query parameter is required" }, 400);
    }

    const tweetId = extractTweetId(url);
    if (!tweetId) {
      return c.json(
        {
          error:
            "Invalid Twitter/X URL. Expected format: https://x.com/user/status/123456",
        },
        400,
      );
    }

    const tweet = await fetchTweet(tweetId, url);
    return c.json(tweet);
  } catch (error) {
    console.error("[adland] Error fetching tweet:", error);
    return c.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch tweet",
      },
      500,
    );
  }
});

// ── Verify ───────────────────────────────────────────────────────────────────

app.post("/verify/cast", async (c) => {
  try {
    const { hash, url } = await c.req.json();

    if (!hash && !url) {
      return c.json({ verified: false });
    }

    let cast: Cast | undefined;
    if (url) {
      const response = await neynar.lookupCastByHashOrUrl({
        identifier: url,
        type: "url",
      });
      cast = response?.cast;
    } else {
      const response = await neynar.fetchBulkCasts({ casts: [hash] });
      cast = response.result?.casts?.[0];
    }

    if (!cast) {
      return c.json({ verified: false });
    }

    return c.json({ verified: true });
  } catch (error) {
    console.log("error", error);
    return c.json({ verified: false });
  }
});

app.post("/verify/miniapp", async (c) => {
  const { domain } = await c.req.json();
  const farcasterAPI = new FarcasterAPI(
    process.env.FARCASTER_API_KEY as string,
  );

  if (!domain) {
    return c.json({ verified: false });
  }

  try {
    const manifest = await farcasterAPI.getDomainManifest(domain);
    return c.json({ verified: manifest.verified });
  } catch (error) {
    return c.json({ verified: false });
  }
});

app.post("/verify/profile", async (c) => {
  try {
    const { fid } = await c.req.json();

    if (!fid) {
      return c.json({ verified: false });
    }

    const fidNumber = parseInt(fid);
    if (isNaN(fidNumber)) {
      return c.json({ verified: false });
    }

    const response = await neynar.fetchBulkUsers({ fids: [fidNumber] });
    const user = response.users?.[0];

    if (!user) {
      return c.json({ verified: false });
    }

    return c.json({ verified: true });
  } catch (error) {
    console.log("error", error);
    return c.json({ verified: false });
  }
});

app.post("/verify/token", async (c) => {
  try {
    const { address, chainId } = await c.req.json();

    if (!address || !chainId) {
      return c.json({ verified: false });
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return c.json({ verified: false });
    }

    try {
      const [{ result: name }, { result: symbol }, { result: decimals }] =
        await getChainClient(chainId, alchemyKey).multicall({
          contracts: [
            {
              abi: erc20Abi,
              functionName: "name",
              address: address as `0x${string}`,
            },
            {
              abi: erc20Abi,
              functionName: "symbol",
              address: address as `0x${string}`,
            },
            {
              abi: erc20Abi,
              functionName: "decimals",
              address: address as `0x${string}`,
            },
          ],
        });

      if (
        typeof name === "string" &&
        typeof symbol === "string" &&
        typeof decimals === "number"
      ) {
        return c.json({ verified: true });
      }
    } catch (error) {
      console.log("Token verification error:", error);
      return c.json({ verified: false });
    }

    return c.json({ verified: false });
  } catch (error) {
    console.log("error", error);
    return c.json({ verified: false });
  }
});

app.post("/verify/tweet", async (c) => {
  try {
    const { url } = await c.req.json();

    if (!url) {
      return c.json({ verified: false });
    }

    const tweetId = extractTweetId(url);
    if (!tweetId) {
      return c.json({ verified: false });
    }

    const tweet = await fetchTweet(tweetId, url);
    if (!tweet || !tweet.id) {
      return c.json({ verified: false });
    }

    return c.json({ verified: true });
  } catch (error) {
    console.log("Tweet verification error:", error);
    return c.json({ verified: false });
  }
});

// ── Metadata ─────────────────────────────────────────────────────────────────

app.get("/metadata/cast", async (c) => {
  try {
    const { hash, url } = c.req.query();

    if (!hash && !url) {
      return c.json({ error: "Hash or url is required" }, 400);
    }

    let cast: Cast | undefined;
    if (url) {
      const response = await neynar.lookupCastByHashOrUrl({
        identifier: url,
        type: "url",
      });
      cast = response?.cast;
    } else {
      const response = await neynar.fetchBulkCasts({ casts: [hash] });
      cast = response.result?.casts?.[0];
    }

    if (!cast) {
      return c.json({ error: "Cast not found" }, 404);
    }
    return c.json({ cast });
  } catch (error) {
    console.log("error", error);
    return c.json({ error: "Failed to fetch cast metadata" }, 500);
  }
});

app.get("/metadata/miniapp", async (c) => {
  const { url } = c.req.query();
  const farcasterAPI = new FarcasterAPI(
    process.env.FARCASTER_API_KEY as string,
  );
  const domain = url.split("//")[1];
  const manifest = await farcasterAPI.getDomainManifest(domain);
  return c.json({
    icon:
      manifest.manifest.frame?.iconUrl || manifest.manifest.miniapp?.iconUrl,
    title: manifest.manifest.frame?.name || manifest.manifest.miniapp?.name,
    description:
      // @ts-ignore
      manifest.manifest.frame?.subtitle || manifest.manifest.miniapp?.subtitle,
    imageUrl:
      manifest.manifest.frame?.imageUrl || manifest.manifest.miniapp?.imageUrl,
  });
});

app.get("/metadata/profile", async (c) => {
  try {
    const { fid } = c.req.query();

    if (!fid) {
      return c.json({ error: "FID is required" }, 400);
    }

    const fidNumber = parseInt(fid);
    if (isNaN(fidNumber)) {
      return c.json({ error: "Invalid FID" }, 400);
    }

    const response = await neynar.fetchBulkUsers({ fids: [fidNumber] });
    const user = response.users?.[0];

    if (!user) {
      return c.json({ error: "Profile not found" }, 404);
    }

    return c.json({
      pfpUrl: user.pfp_url || null,
      bio: user.profile?.bio?.text || null,
      username: user.username || null,
      displayName: user.display_name || null,
      followers: user.follower_count || null,
      following: user.following_count || null,
      pro: (user as any).power_badge || false,
    });
  } catch (error) {
    console.log("error", error);
    return c.json({ error: "Failed to fetch profile metadata" }, 500);
  }
});

app.get("/metadata/token", async (c) => {
  try {
    const { address, chainId } = c.req.query();

    if (!address || !chainId) {
      return c.json({ error: "Address and chainId are required" }, 400);
    }

    const chainIdNumber = parseInt(chainId as string);
    if (isNaN(chainIdNumber)) {
      return c.json({ error: "Invalid chainId" }, 400);
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(address as string)) {
      return c.json({ error: "Invalid token address" }, 400);
    }

    const metadata = await fetchTokenMetadata(address as string, chainIdNumber);

    return c.json({
      name: metadata.name || null,
      symbol: metadata.symbol || null,
      decimals: metadata.decimals || null,
      logoURI: metadata.logoURI || null,
    });
  } catch (error) {
    console.error("Error fetching token metadata:", error);
    return c.json({ error: "Failed to fetch token metadata" }, 500);
  }
});

app.get("/metadata/link", async (c) => {
  try {
    const { url } = c.req.query();

    if (!url) {
      return c.json({ error: "URL is required" }, 400);
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; AdLand/1.0; +https://adland.xyz)",
      },
    });

    if (!response.ok) {
      return c.json(
        { error: `Failed to fetch URL: ${response.statusText}` },
        400,
      );
    }

    const html = await response.text();

    const ogTitleMatch = html.match(
      /<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i,
    );
    const ogDescriptionMatch = html.match(
      /<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i,
    );
    const ogImageMatch = html.match(
      /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i,
    );

    const titleMatch =
      ogTitleMatch ||
      html.match(/<title>([^<]+)<\/title>/i) ||
      html.match(/<meta\s+name=["']title["']\s+content=["']([^"']+)["']/i);
    const descriptionMatch =
      ogDescriptionMatch ||
      html.match(
        /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i,
      );
    const imageMatch =
      ogImageMatch ||
      html.match(/<meta\s+name=["']image["']\s+content=["']([^"']+)["']/i);

    const appleTouchIconMatch = html.match(
      /<link\s+rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i,
    );
    const iconMatch = html.match(
      /<link\s+rel=["'](?:icon|shortcut\s+icon)["'][^>]*href=["']([^"']+)["']/i,
    );
    const maskIconMatch = html.match(
      /<link\s+rel=["']mask-icon["'][^>]*href=["']([^"']+)["']/i,
    );

    const resolveUrl = (urlString: string, baseUrl: string): string => {
      if (urlString.startsWith("http://") || urlString.startsWith("https://")) {
        return urlString;
      } else if (urlString.startsWith("//")) {
        return new URL(urlString, baseUrl).href;
      } else if (urlString.startsWith("/")) {
        const base = new URL(baseUrl);
        return `${base.protocol}//${base.host}${urlString}`;
      } else {
        return new URL(urlString, baseUrl).href;
      }
    };

    const result: {
      title?: string;
      description?: string;
      image?: string;
      icon?: string;
    } = {};

    if (titleMatch) {
      result.title = titleMatch[1].trim();
    }

    if (descriptionMatch) {
      result.description = descriptionMatch[1].trim();
    }

    if (imageMatch) {
      result.image = resolveUrl(imageMatch[1].trim(), url);
    }

    const iconHref =
      appleTouchIconMatch?.[1] || iconMatch?.[1] || maskIconMatch?.[1];

    if (iconHref) {
      result.icon = resolveUrl(iconHref.trim(), url);
    } else {
      const baseUrl = new URL(url);
      result.icon = `${baseUrl.protocol}//${baseUrl.host}/favicon.ico`;
    }

    return c.json(result);
  } catch (error) {
    console.error("Error fetching link metadata:", error);
    return c.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch metadata",
      },
      500,
    );
  }
});

app.get("/metadata/tweet", async (c) => {
  try {
    const { url } = c.req.query();

    if (!url) {
      return c.json({ error: "URL query parameter is required" }, 400);
    }

    const tweetId = extractTweetId(url);
    if (!tweetId) {
      return c.json(
        {
          error:
            "Invalid Twitter/X URL. Expected format: https://x.com/user/status/123456",
        },
        400,
      );
    }

    const tweet = await fetchTweet(tweetId, url);
    return c.json(tweet);
  } catch (error) {
    console.error("[adland] Error fetching tweet metadata:", error);
    return c.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch tweet metadata",
      },
      500,
    );
  }
});

// ── Helpers ──────────────────────────────────────────────────────────────────

async function fetchTokenMetadata(
  address: string,
  chainId: number,
): Promise<{
  name: string | null;
  symbol: string | null;
  decimals: number | null;
  logoURI: string | null;
}> {
  // Try 1inch token list API first (supports multiple chains)
  try {
    const response = await fetch(`https://tokens.1inch.io/v1.2/${chainId}`);
    if (response.ok) {
      const tokens = (await response.json()) as Array<{
        address: string;
        name: string;
        symbol: string;
        decimals: number;
        logoURI?: string;
      }>;
      const token = tokens.find(
        (t) => t.address.toLowerCase() === address.toLowerCase(),
      );
      if (token) {
        return {
          name: token.name || null,
          symbol: token.symbol || null,
          decimals: token.decimals || null,
          logoURI: token.logoURI || null,
        };
      }
    }
  } catch (error) {
    console.log("1inch API error:", error);
  }

  // Fallback: Try CoinGecko API for popular tokens
  try {
    const chainMap: Record<number, string> = {
      1: "ethereum",
      8453: "base",
      42161: "arbitrum-one",
      10: "optimistic-ethereum",
      137: "polygon-pos",
    };

    const chainName = chainMap[chainId];
    if (chainName) {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${chainName}/contract/${address.toLowerCase()}`,
      );
      if (response.ok) {
        const data = (await response.json()) as {
          name: string;
          symbol: string;
          detail_platforms?: Record<string, { decimal_place: number }>;
          image?: { small?: string; large?: string };
        };
        return {
          name: data.name || null,
          symbol: data.symbol?.toUpperCase() || null,
          decimals: data.detail_platforms?.[chainName]?.decimal_place || null,
          logoURI: data.image?.large || data.image?.small || null,
        };
      }
    }
  } catch (error) {
    console.log("CoinGecko API error:", error);
  }

  return {
    name: null,
    symbol: null,
    decimals: null,
    logoURI: null,
  };
}

export default app;
