import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Allow production builds even if TypeScript reports errors
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
