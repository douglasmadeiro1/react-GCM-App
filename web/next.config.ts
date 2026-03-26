import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // Desabilita Strict Mode
  transpilePackages: ['@gcm/shared'],
};

export default nextConfig;