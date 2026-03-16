import { adlandApiUrl } from "../constants";

class AdlandAPI {
  constructor() {}

  async verifyCast({ hash }: { hash: string }) {
    return this.post<{ verified: boolean }>(`${adlandApiUrl}/verify/cast`, {
      hash,
    });
  }

  async verifyMiniapp({ domain }: { domain: string }) {
    return this.post<{ verified: boolean }>(`${adlandApiUrl}/verify/miniapp`, {
      domain,
    });
  }

  async getMiniappMetadata({ url }: { url: string }): Promise<{
    title: string;
    icon: string;
    description: string;
    imageUrl: string;
  }> {
    return this.get<{
      title: string;
      icon: string;
      description: string;
      imageUrl: string;
    }>(`${adlandApiUrl}/metadata/miniapp?url=${encodeURIComponent(url)}`);
  }

  async getLinkMetadata({ url }: { url: string }): Promise<{
    title: string;
    description: string;
    image: string;
    icon: string;
  }> {
    return this.get<{
      title: string;
      description: string;
      image: string;
      icon: string;
    }>(`${adlandApiUrl}/metadata/link?url=${encodeURIComponent(url)}`);
  }

  async getCastMetadata({ hash }: { hash: string }): Promise<{
    username: string;
    pfpUrl: string;
    text: string;
    timestamp: number;
  }> {
    return this.get<{
      username: string;
      pfpUrl: string;
      text: string;
      timestamp: number;
    }>(`${adlandApiUrl}/metadata/cast?hash=${encodeURIComponent(hash)}`);
  }

  async verifyFarcasterProfile({ fid }: { fid: string }) {
    return this.post<{ verified: boolean }>(`${adlandApiUrl}/verify/profile`, {
      fid,
    });
  }

  async getFarcasterProfile({ fid }: { fid: string }): Promise<{
    pfpUrl: string;
    bio: string;
    username: string;
    displayName?: string;
    followers: number;
    following: number;
    pro: boolean;
  }> {
    return this.get<{
      pfpUrl: string;
      bio: string;
      username: string;
      displayName?: string;
      followers: number;
      following: number;
      pro: boolean;
    }>(`${adlandApiUrl}/metadata/profile?fid=${encodeURIComponent(fid)}`);
  }

  async verifyToken({
    address,
    chainId,
  }: {
    address: string;
    chainId: number;
  }) {
    return this.post<{ verified: boolean }>(`${adlandApiUrl}/verify/token`, {
      address,
      chainId,
    });
  }

  async getTokenMetadata({
    address,
    chainId,
  }: {
    address: string;
    chainId: number;
  }): Promise<{
    name: string;
    symbol: string;
    decimals: number;
    logoURI: string;
  }> {
    return this.get<{
      name: string;
      symbol: string;
      decimals: number;
      logoURI: string;
    }>(
      `${adlandApiUrl}/metadata/token?address=${encodeURIComponent(address)}&chainId=${chainId}`,
    );
  }

  private async post<T>(url: string, body: object): Promise<T> {
    return fetch(url, {
      method: "POST",
      body: JSON.stringify(body),
    }).then((res) => res.json()) as T;
  }

  private async get<T>(url: string): Promise<T> {
    return fetch(url).then((res) => res.json()) as T;
  }
}

export const adlandAPI = new AdlandAPI();
