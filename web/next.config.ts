import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remover reactCompiler - não suportado nesta versão
  transpilePackages: ['@gcm/shared'],
};

export default nextConfig;