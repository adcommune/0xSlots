import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: "**",
      },
    ],
  },
  allowedDevOrigins: ["really-intense-guppy.ngrok-free.app"],
};

export default nextConfig;
