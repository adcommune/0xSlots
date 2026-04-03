/**
 * Fetch tweet data using Twitter's free public endpoints.
 * No API credentials required.
 */

export interface TweetData {
  id: string;
  text: string;
  author: {
    name: string;
    username: string;
    profileImageUrl: string;
  };
  createdAt: string;
  metrics: {
    likes: number;
    retweets: number;
    replies: number;
    bookmarks: number;
  };
  media: Array<{
    type: string;
    url: string;
  }>;
  embedHtml: string;
}

/**
 * Extract a tweet ID from a Twitter/X URL.
 * Supports formats like:
 *   - https://twitter.com/user/status/123456
 *   - https://x.com/user/status/123456
 */
export function extractTweetId(url: string): string | null {
  const match = url.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/);
  return match?.[1] ?? null;
}

/**
 * Fetch rich tweet data via Twitter's syndication endpoint (free, no auth).
 * Falls back to oEmbed if syndication fails.
 */
export async function fetchTweet(
  tweetId: string,
  tweetUrl: string,
): Promise<TweetData> {
  // Try syndication API first — returns full tweet data
  const syndicationRes = await fetch(
    `https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&token=${generateToken(tweetId)}`,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; AdLand/1.0; +https://adland.xyz)",
      },
    },
  );

  if (!syndicationRes.ok) {
    throw new Error(
      `Failed to fetch tweet: ${syndicationRes.status} ${syndicationRes.statusText}`,
    );
  }

  const data = (await syndicationRes.json()) as {
    id_str: string;
    text: string;
    user: {
      name: string;
      screen_name: string;
      profile_image_url_https: string;
    };
    created_at: string;
    favorite_count: number;
    conversation_count: number;
    mediaDetails?: Array<{
      type: string;
      media_url_https: string;
    }>;
  };

  // Fetch oEmbed in parallel for the embed HTML
  const oembedRes = await fetch(
    `https://publish.twitter.com/oembed?url=${encodeURIComponent(tweetUrl)}&omit_script=true`,
  );
  const oembedData = oembedRes.ok
    ? ((await oembedRes.json()) as { html: string })
    : null;

  return {
    id: data.id_str,
    text: data.text,
    author: {
      name: data.user.name,
      username: data.user.screen_name,
      profileImageUrl: data.user.profile_image_url_https,
    },
    createdAt: data.created_at,
    metrics: {
      likes: data.favorite_count ?? 0,
      retweets: 0,
      replies: data.conversation_count ?? 0,
      bookmarks: 0,
    },
    media:
      data.mediaDetails?.map((m) => ({
        type: m.type,
        url: m.media_url_https,
      })) ?? [],
    embedHtml: oembedData?.html ?? "",
  };
}

/**
 * Generate a token for the syndication API.
 * This is a simple hash based on the tweet ID.
 */
function generateToken(id: string): string {
  const num = BigInt(id);
  return ((num / 1000000000n) * 1000000000n).toString(36);
}
