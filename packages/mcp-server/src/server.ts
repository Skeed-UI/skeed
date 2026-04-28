#!/usr/bin/env tsx
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server-core.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(__dirname, '..');

const registryPath =
  process.env.SKEED_REGISTRY_PATH ?? resolve(pkgRoot, '..', 'indexer', 'dist', 'registry.db');

async function main(): Promise<void> {
  const { server } = createServer({ registryPath });
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write(`skeed-mcp connected (registry: ${registryPath})\n`);
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? (err.stack ?? err.message) : String(err);
  process.stderr.write(`skeed-mcp failed: ${message}\n`);
  process.exit(1);
});
