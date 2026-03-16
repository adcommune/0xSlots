import "dotenv/config";
import { FarcasterAPI } from "@adland/data";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { erc20Abi } from "viem";
import { neynar } from "./services/neynar";
import { slotsClient } from "./services/subgraph";
import { getChainClient } from "@0xslots/config";

const alchemyKey = process.env.ALCHEMY_KEY as string

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

app.post("/verify/miniapp", async (c) => {
  const { domain } = await c.req.json();
  const farcasterAPI = new FarcasterAPI(
    process.env.FARCASTER_API_KEY as string,
  );
  try {
    const manifest = await farcasterAPI.getDomainManifest(domain);
    return c.json({ verified: manifest.verified });
  } catch (error) {
    return c.json({ verified: false });
  }
});

app.post("/verify/cast", async (c) => {
  try {
    const { hash } = await c.req.json();
    console.log("hash", hash);

    if (!hash) {
      console.log("No hash provided");
      return c.json({ verified: false });
    }

    const response = await neynar.fetchBulkCasts({ casts: [hash] });
    console.log("neynar response", response);

    const cast = response.result?.casts?.[0];
    console.log("cast", cast);

    if (!cast) {
      console.log("Cast not found");
      return c.json({ verified: false });
    }

    console.log("Cast verified successfully");
    return c.json({ verified: true });
  } catch (error) {
    console.log("error", error);
    return c.json({ verified: false });
  }
});

app.get("/metadata/cast", async (c) => {
  try {
    const { hash } = c.req.query();
    const response = await neynar.fetchBulkCasts({ casts: [hash] });
    const cast = response.result?.casts?.[0];
    if (!cast) {
      return c.json({ error: "Cast not found" }, 404);
    }
    return c.json({
      text: cast.text,
      pfpUrl: cast.author?.pfp_url,
      username: cast.author?.username,
      timestamp: cast.timestamp,
    });
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

app.post("/verify/token", async (c) => {
  try {
    const { address, chainId } = await c.req.json();

    if (!address || !chainId) {
      return c.json({ verified: false });
    }

    // Basic validation: check if address is a valid Ethereum address
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return c.json({ verified: false });
    }

    // Try to fetch token metadata to verify it exists
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

// Helper function to fetch token metadata
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
    // CoinGecko uses chain identifiers differently
    const chainMap: Record<number, string> = {
      1: "ethereum",
      8453: "base",
      42161: "arbitrum-one",
      10: "optimistic-ethereum",
      137: "polygon-pos",
    };

    const chainName = chainMap[chainId];
    if (chainName) {
      // Note: CoinGecko API requires API key for production use
      // This is a basic implementation that may need API key
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

  // If all else fails, return null values
  return {
    name: null,
    symbol: null,
    decimals: null,
    logoURI: null,
  };
}

app.get("/metadata/link", async (c) => {
  try {
    const { url } = c.req.query();

    if (!url) {
      return c.json({ error: "URL is required" }, 400);
    }

    // Fetch the HTML from the URL
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

    // Extract Open Graph metadata
    const ogTitleMatch = html.match(
      /<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i,
    );
    const ogDescriptionMatch = html.match(
      /<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i,
    );
    const ogImageMatch = html.match(
      /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i,
    );

    // Fallback to regular meta tags if OG tags are not found
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

    // Extract icon/favicon
    // Try apple-touch-icon first (usually higher quality)
    const appleTouchIconMatch = html.match(
      /<link\s+rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i,
    );
    // Try standard icon
    const iconMatch = html.match(
      /<link\s+rel=["'](?:icon|shortcut\s+icon)["'][^>]*href=["']([^"']+)["']/i,
    );
    // Try mask-icon (SVG icons)
    const maskIconMatch = html.match(
      /<link\s+rel=["']mask-icon["'][^>]*href=["']([^"']+)["']/i,
    );

    // Helper function to resolve relative URLs to absolute
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

    // Extract icon (prefer apple-touch-icon, then standard icon, then mask-icon)
    const iconHref =
      appleTouchIconMatch?.[1] || iconMatch?.[1] || maskIconMatch?.[1];

    if (iconHref) {
      result.icon = resolveUrl(iconHref.trim(), url);
    } else {
      // Fallback to default favicon location
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

serve(
  {
    fetch: app.fetch,
    port: 3069,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
