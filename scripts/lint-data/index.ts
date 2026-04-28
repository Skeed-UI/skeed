#!/usr/bin/env tsx
import { readFile, readdir, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadArchetypes } from '@skeed/archetypes-loader';
import { loadDemographics } from '@skeed/demographics-loader';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');
const dataRoot = resolve(repoRoot, 'data');

const STRICT = process.argv.includes('--strict');

interface CheckResult {
  name: string;
  errors: Array<{ path: string; message: string }>;
  warnings: Array<{ path: string; message: string }>;
}

/**
 * Detect demographic folders that are still scaffold-only stubs.
 * A demographic counts as a stub when EITHER:
 *   - preset.json contains the literal `_TODO` field, OR
 *   - psychology/ has zero `.json` files AND logo-primitives/{shapes,marks} are empty.
 * Empty-content detection lets us skip mutating preset.json files (sandbox-friendly).
 */
async function listStubDemographics(): Promise<Set<string>> {
  const stubs = new Set<string>();
  const demoDir = resolve(dataRoot, 'demographics');
  let entries: string[] = [];
  try {
    entries = await readdir(demoDir);
  } catch {
    return stubs;
  }
  for (const entry of entries) {
    const presetPath = resolve(demoDir, entry, 'preset.json');
    let hasTodo = false;
    try {
      const stats = await stat(presetPath);
      if (!stats.isFile()) continue;
      const json = JSON.parse(await readFile(presetPath, 'utf8')) as Record<string, unknown>;
      hasTodo = '_TODO' in json;
    } catch {
      continue;
    }
    if (hasTodo) {
      stubs.add(entry);
      continue;
    }
    const psyCount = await countJsonFiles(resolve(demoDir, entry, 'psychology'));
    const shapesCount = await countFiles(resolve(demoDir, entry, 'logo-primitives', 'shapes'));
    const marksCount = await countFiles(resolve(demoDir, entry, 'logo-primitives', 'marks'));
    if (psyCount === 0 && shapesCount === 0 && marksCount === 0) {
      stubs.add(entry);
    }
  }
  return stubs;
}

async function countJsonFiles(dir: string): Promise<number> {
  try {
    return (await readdir(dir)).filter((f) => f.endsWith('.json')).length;
  } catch {
    return 0;
  }
}

async function countFiles(dir: string): Promise<number> {
  try {
    return (await readdir(dir)).length;
  } catch {
    return 0;
  }
}

async function main(): Promise<void> {
  const checks: CheckResult[] = [];
  const stubs = await listStubDemographics();

  // 1. Demographics — separate stub-related errors into warnings (unless --strict)
  const demos = await loadDemographics({ dataRoot: resolve(dataRoot, 'demographics') });
  const demoCheck: CheckResult = { name: 'demographics', errors: [], warnings: [] };
  for (const err of demos.errors) {
    const isStub = [...stubs].some(
      (s) => err.path.endsWith(`demographics\\${s}`) || err.path.endsWith(`demographics/${s}`),
    );
    if (isStub && !STRICT) {
      demoCheck.warnings.push({ path: err.path, message: 'STUB — fill in per AGENTS.md' });
    } else {
      demoCheck.errors.push(err);
    }
  }
  checks.push(demoCheck);

  // 2. Archetypes
  const arch = await loadArchetypes({ dataRoot: resolve(dataRoot, 'archetypes') });
  checks.push({ name: 'archetypes', errors: arch.errors, warnings: [] });

  // 3. Cross-checks (skip stubs unless strict)
  const crossErrors: Array<{ path: string; message: string }> = [];
  const crossWarnings: Array<{ path: string; message: string }> = [];
  for (const [demoId, demo] of demos.demographics) {
    const sink = stubs.has(demoId) && !STRICT ? crossWarnings : crossErrors;
    if (demo.psychology.size === 0) {
      sink.push({
        path: `data/demographics/${demoId}/psychology/`,
        message: 'demographic has zero psychology profiles — at least one niche is required',
      });
    }
    if (demo.logoPrimitives.shapes.length + demo.logoPrimitives.marks.length === 0) {
      sink.push({
        path: `data/demographics/${demoId}/logo-primitives/`,
        message:
          'demographic has no logo shape or mark primitives — composer cannot generate logos',
      });
    }
  }
  if (arch.archetypes.size === 0) {
    crossErrors.push({ path: 'data/archetypes/', message: 'no archetypes found' });
  }
  checks.push({ name: 'cross-checks', errors: crossErrors, warnings: crossWarnings });

  // Report
  let totalErrors = 0;
  let totalWarnings = 0;
  for (const check of checks) {
    if (check.errors.length === 0 && check.warnings.length === 0) {
      process.stdout.write(`  ok    ${check.name}\n`);
    } else if (check.errors.length === 0) {
      process.stdout.write(`  warn  ${check.name} — ${check.warnings.length} warning(s)\n`);
    } else {
      process.stdout.write(
        `  fail  ${check.name} — ${check.errors.length} error(s), ${check.warnings.length} warning(s)\n`,
      );
      for (const err of check.errors) {
        const line = err.message.length > 200 ? `${err.message.slice(0, 200)}…` : err.message;
        process.stdout.write(`        ${err.path}\n          → ${line}\n`);
      }
    }
    totalErrors += check.errors.length;
    totalWarnings += check.warnings.length;
  }
  process.stdout.write(
    `\nLoaded ${demos.demographics.size} demographic(s) (${stubs.size} stub), ${arch.archetypes.size} archetype(s).\n`,
  );

  if (totalErrors > 0) {
    process.stdout.write(
      `\nFAILED: ${totalErrors} validation error(s), ${totalWarnings} warning(s).\n`,
    );
    process.exit(1);
  }
  if (totalWarnings > 0 && STRICT) {
    process.stdout.write(`\nFAILED (strict): ${totalWarnings} warning(s).\n`);
    process.exit(1);
  }
  process.stdout.write(
    `\nAll data files valid${totalWarnings > 0 ? ` (${totalWarnings} stub warnings — see --strict to fail on)` : ''}.\n`,
  );
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? (err.stack ?? err.message) : String(err);
  process.stderr.write(`lint-data crashed: ${message}\n`);
  process.exit(2);
});
