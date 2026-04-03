import { adlandApiUrl } from "../constants";
import type {
  CastMetadata,
  LinkMetadata,
  MiniappMetadata,
  ProfileMetadata,
  TokenMetadata,
  TweetData,
} from "../types";

const baseUrl = `${adlandApiUrl}/adland`;

async function post<T>(url: string, body: object): Promise<T> {
  return fetch(url, {
    method: "POST",
    body: JSON.stringify(body),
  }).then((res) => res.json()) as T;
}

async function get<T>(url: string): Promise<T> {
  return fetch(url).then((res) => res.json()) as T;
}

export const adlandAPI = {
  verify: {
    cast({ hash }: { hash: string }) {
      return post<{ verified: boolean }>(`${baseUrl}/verify/cast`, { hash });
    },

    miniapp({ domain }: { domain: string }) {
      return post<{ verified: boolean }>(`${baseUrl}/verify/miniapp`, {
        domain,
      });
    },

    profile({ fid }: { fid: string }) {
      return post<{ verified: boolean }>(`${baseUrl}/verify/profile`, { fid });
    },

    token({ address, chainId }: { address: string; chainId: number }) {
      return post<{ verified: boolean }>(`${baseUrl}/verify/token`, {
        address,
        chainId,
      });
    },
  },

  metadata: {
    cast({ hash }: { hash: string }): Promise<CastMetadata> {
      return get(`${baseUrl}/metadata/cast?hash=${encodeURIComponent(hash)}`);
    },

    miniapp({ url }: { url: string }): Promise<MiniappMetadata> {
      return get(`${baseUrl}/metadata/miniapp?url=${encodeURIComponent(url)}`);
    },

    link({ url }: { url: string }): Promise<LinkMetadata> {
      return get(`${baseUrl}/metadata/link?url=${encodeURIComponent(url)}`);
    },

    profile({ fid }: { fid: string }): Promise<ProfileMetadata> {
      return get(`${baseUrl}/metadata/profile?fid=${encodeURIComponent(fid)}`);
    },

    token({
      address,
      chainId,
    }: {
      address: string;
      chainId: number;
    }): Promise<TokenMetadata> {
      return get(
        `${baseUrl}/metadata/token?address=${encodeURIComponent(address)}&chainId=${chainId}`,
      );
    },
  },
};
