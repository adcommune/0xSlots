import { createClient, Errors } from "@farcaster/quick-auth";

const quickAuthClient = createClient();

export interface VerifiedUser {
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
      console.info("[auth] Invalid Farcaster token:", e.message);
    }
    return null;
  }
}
