import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.covalenthq.com" },
      { protocol: "https", hostname: "**.goldrush.dev" },
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
