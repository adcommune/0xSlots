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
