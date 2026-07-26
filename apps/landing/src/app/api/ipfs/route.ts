import { unstable_cache } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

const IPFS_GATEWAY = "https://ipfs-gateway.econome.studio";
const CACHE_VERSION = "v2";

function resolveIpfsUri(uri: string): string {
  if (uri.startsWith("ipfs://")) {
    return uri.replace("ipfs://", `${IPFS_GATEWAY}/ipfs/`);
  }
  return uri;
}

const fetchIpfsContent = unstable_cache(
  async (uri: string) => {
    const res = await fetch(resolveIpfsUri(uri));
    if (!res.ok) {
      throw new Error(`Failed to fetch IPFS content: ${res.statusText}`);
    }
    return res.json();
  },
  ["ipfs-content", CACHE_VERSION],
  { revalidate: false }, // cache forever — IPFS content is immutable
);

export async function GET(request: NextRequest) {
  const uri = request.nextUrl.searchParams.get("uri");

  if (!uri) {
    return NextResponse.json(
      { error: "uri parameter is required" },
      { status: 400 },
    );
  }

  try {
    const data = await fetchIpfsContent(uri);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch IPFS content" },
      { status: 502 },
    );
  }
}
