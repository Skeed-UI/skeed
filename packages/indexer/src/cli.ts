#!/usr/bin/env tsx
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildIndex } from './build-index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(__dirname, '..');
const repoRoot = resolve(pkgRoot, '..', '..');

const dataRoot = resolve(repoRoot, 'data');
const migrationsDir = resolve(pkgRoot, 'migrations');
const outPath = resolve(pkgRoot, 'dist', 'registry.db');

async function main(): Promise<void> {
  const result = await buildIndex({
    dataRoot,
    migrationsDir,
    outPath,
    registryVersion: process.env.SKEED_REGISTRY_VERSION ?? '0.1.0-dev',
    commit: process.env.SKEED_COMMIT ?? 'local',
    clean: true,
  });
  process.stdout.write(
    `Built ${result.outPath}\n` +
      `  registry version : ${result.registryVersion}\n` +
      `  demographics     : ${result.demographicsIndexed}\n` +
      `  archetypes       : ${result.archetypesIndexed}\n` +
      `  components       : ${result.componentsIndexed}\n` +
      `  logo primitives  : ${result.logoPrimitivesIndexed}\n` +
      `  duration         : ${result.durationMs}ms\n`,
  );
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? (err.stack ?? err.message) : String(err);
  process.stderr.write(`build-index failed: ${message}\n`);
  process.exit(1);
});
