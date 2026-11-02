import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Workspace packages ship TypeScript source.
  transpilePackages: [
    '@mitdrone/ui',
    '@mitdrone/sdk',
    '@mitdrone/auth',
    '@mitdrone/types',
    '@mitdrone/utils',
    '@mitdrone/mocks',
    '@mitdrone/data',
  ],
  // MSW's Node server must not be bundled.
  serverExternalPackages: ['msw'],
  experimental: { optimizePackageImports: ['lucide-react'] },
};

export default config;
