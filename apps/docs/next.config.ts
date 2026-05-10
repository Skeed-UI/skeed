import { resolve } from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: [
    '@skeed/pipeline',
    '@skeed/llm-provider-local',
    'better-sqlite3',
    'node-llama-cpp',
  ],
  turbopack: {
    root: resolve(import.meta.dirname, '../..'),
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/',
          has: [
            {
              type: 'header',
              key: 'accept',
              value: '(.*)application/vnd\\.shadcn\\.v1\\+json(.*)',
            },
          ],
          destination: '/r/registry.json',
        },
      ],
    };
  },
};

export default nextConfig;
