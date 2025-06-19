import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ['@modelcontextprotocol/sdk'],
  env: {
    SKIP_ENV_VALIDATION: 'true',
    VERCEL: '1',
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Prevent AI training systems from running during build on Vercel
      config.externals = [...(config.externals || []), 'canvas', 'jsdom'];
    }
    return config;
  },
  output: 'standalone',
};

export default nextConfig;
