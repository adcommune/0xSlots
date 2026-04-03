import type { Cast } from "@neynar/nodejs-sdk/build/api";

export type CastMetadata = { cast: Cast };

export type MiniappMetadata = {
  title: string;
  icon: string;
  description: string;
  imageUrl: string;
};

export type LinkMetadata = {
  title: string;
  description: string;
  image: string;
  icon: string;
};

export type ProfileMetadata = {
  pfpUrl: string;
  bio: string;
  username: string;
  displayName?: string;
  followers: number;
  following: number;
  pro: boolean;
};

export type TokenMetadata = {
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
};

export type TweetData = {
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
};

export type TweetMetadata = { tweet: TweetData };
