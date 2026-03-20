import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['shared'],
  experimental: {
    optimizePackageImports: ['shared'],
  },
};

export default nextConfig;