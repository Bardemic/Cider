import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow long-running SSE streams from agent route
  serverExternalPackages: [],
};

export default nextConfig;
