import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

// Docker image copies `.next/standalone`. Vercel needs the default NFT traces.
if (process.env.NEXT_OUTPUT === "standalone") {
  nextConfig.output = "standalone";
}

export default nextConfig;
