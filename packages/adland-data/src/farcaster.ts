import { Manifest } from "@farcaster/miniapp-sdk";

/**
 * Utility functions to parse accountAssociation from Mini App manifest
 *
 * The accountAssociation is a JSON Farcaster Signature (JFS) that contains:
 * - header: base64url encoded JSON with FID, type, and key (address)
 * - payload: base64url encoded JSON with domain
 * - signature: base64url encoded signature
 */

interface AccountAssociationHeader {
  fid: number;
  type: "custody" | "auth";
  key: string; // The address (e.g., "0x...")
}

interface AccountAssociationPayload {
  domain: string;
}

interface AccountAssociation {
  header: string; // base64url encoded
  payload: string; // base64url encoded
  signature: string; // base64url encoded
}

export interface ParsedAccountAssociation {
  fid: number;
  address: string; // Ethereum address (0x...)
  type: "custody" | "auth";
  domain: string;
}

/**
 * Decode base64url encoded string to JSON object
 */
function decodeBase64Url<T>(encoded: string): T {
  // Replace URL-safe characters with standard base64 characters
  let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");

  // Add padding if needed
  while (base64.length % 4) {
    base64 += "=";
  }

  // Node.js environment
  const decoded = Buffer.from(base64, "base64").toString("utf-8");
  return JSON.parse(decoded) as T;
}

/**
 * Parse accountAssociation to extract FID and address
 *
 * @param accountAssociation - The accountAssociation object from manifest
 * @returns Parsed object with FID, address, type, and domain
 */
export function parseAccountAssociation(
  accountAssociation: AccountAssociation,
): ParsedAccountAssociation {
  try {
    // Decode the header to get FID, type, and key (address)
    const header: AccountAssociationHeader = decodeBase64Url(
      accountAssociation.header,
    );

    // Decode the payload to get domain
    const payload: AccountAssociationPayload = decodeBase64Url(
      accountAssociation.payload,
    );

    return {
      fid: header.fid,
      address: header.key, // The key is the Ethereum address
      type: header.type,
      domain: payload.domain,
    };
  } catch (error) {
    throw new Error(
      `Failed to parse accountAssociation: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Fetch and parse accountAssociation from a manifest URL
 *
 * @param manifestUrl - URL to the manifest (e.g., "https://example.com/.well-known/farcaster.json")
 * @returns Parsed accountAssociation
 */
export async function fetchAndParseAccountAssociation(
  manifestUrl: string,
): Promise<ParsedAccountAssociation> {
  try {
    const response = await fetch(manifestUrl);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch manifest: ${response.status} ${response.statusText}`,
      );
    }

    const manifest = (await response.json()) as any;

    if (!manifest.accountAssociation) {
      throw new Error("Manifest does not contain accountAssociation");
    }

    return parseAccountAssociation(manifest.accountAssociation);
  } catch (error) {
    throw new Error(
      `Failed to fetch and parse accountAssociation: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export class FarcasterAPI {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getDomainManifest(domain: string) {
    const response = await fetch(
      `https://client.farcaster.xyz/v1/domain-manifest?domain=${domain}`,
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      },
    );
    if (!response.ok) {
      throw new Error(
        `Failed to fetch domain manifest: ${response.status} ${response.statusText}`,
      );
    }
    const data = (await response.json()) as {
      result: {
        state: {
          verified: boolean;
          updatedAt: number; // timestamp
          manifest: string;
        };
      };
    };

    console.log("FarcasterAPI:data", data);

    return {
      ...data.result.state,
      manifest: JSON.parse(data.result.state.manifest) as Manifest.Manifest,
    };
  }
}
