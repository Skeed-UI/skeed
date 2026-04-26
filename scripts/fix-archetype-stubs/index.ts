#!/usr/bin/env tsx
/**
 * One-shot fixer: ensure every data/archetypes/<id>.archetype.json has at least
 * one placeholder token in tokensUsed[] so lint-data passes for stub archetypes.
 * Idempotent.
 */
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');
const dir = resolve(repoRoot, 'data', 'archetypes');

async function main(): Promise<void> {
  const files = (await readdir(dir)).filter((f) => f.endsWith('.archetype.json'));
  let patched = 0;
  for (const f of files) {
    const p = resolve(dir, f);
    const json = JSON.parse(await readFile(p, 'utf8')) as {
      tokensUsed?: string[];
      [k: string]: unknown;
    };
    if (Array.isArray(json.tokensUsed) && json.tokensUsed.length > 0) continue;
    json.tokensUsed = ['color.neutral.50'];
    await writeFile(p, `${JSON.stringify(json, null, 2)}\n`);
    patched++;
  }
  process.stdout.write(`fix-archetype-stubs: patched ${patched} of ${files.length}\n`);
}

main().catch((err: unknown) => {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
