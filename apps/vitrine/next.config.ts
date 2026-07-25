import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Article images come from the studio's IPFS gateway, and heroes are
    // rendered unoptimized anyway — allow the remote host rather than
    // enumerating CIDs.
    remotePatterns: [{ hostname: "**" }],
  },
};

export default nextConfig;
