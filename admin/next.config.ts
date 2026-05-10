import type { NextConfig } from 'next';

/** Next 16 typings omit some runtime-supported keys (e.g. eslint); keep runtime config and satisfy the exported type. */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  output: 'standalone' as const,
  outputFileTracing: false,
} as NextConfig;

export default nextConfig;
