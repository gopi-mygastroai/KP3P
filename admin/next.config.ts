import type { NextConfig } from 'next';

const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  output: 'standalone' as const,
  /** pdf-parse / pdfjs-dist must not be webpack-bundled (breaks with Object.defineProperty). */
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist'],
  turbopack: {
    root: process.cwd(),
  },
} satisfies NextConfig;

export default nextConfig;
