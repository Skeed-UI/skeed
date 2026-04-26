#!/usr/bin/env tsx
/**
 * One-shot helper: generate the 17 stage stubs under packages/pipeline/src/stages/.
 * Idempotent: skips files that already exist.
 */
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');
const stagesDir = resolve(repoRoot, 'packages', 'pipeline', 'src', 'stages');

interface StageDef {
  number: string;
  slug: string;
  description: string;
  cacheable: boolean;
}

const STAGES: StageDef[] = [
  { number: '01', slug: 'intent', description: 'Extract structured Intent from raw prompt', cacheable: true },
  { number: '02', slug: 'classify', description: 'Demographic + niche classifier with clarification', cacheable: true },
  { number: '03', slug: 'pain-points', description: 'Probe pain points and JTBD', cacheable: true },
  { number: '04', slug: 'score-l1', description: '5-axis Level-1 idea score', cacheable: true },
  { number: '05', slug: 'gate-1', description: 'User pivot/persist decision', cacheable: false },
  { number: '06', slug: 'research', description: 'AutoResearchClaw deep research', cacheable: true },
  { number: '07', slug: 'score-l2', description: '9-axis Level-2 score with research', cacheable: true },
  { number: '08', slug: 'gate-2', description: 'User final approval', cacheable: false },
  { number: '09', slug: 'psychology', description: 'Deterministic psychology preset lookup', cacheable: true },
  { number: '10', slug: 'brand-logo', description: 'Brand attrs + SVG logo candidates', cacheable: true },
  { number: '11', slug: 'design-system', description: 'Resolve DS preset + overrides + naming', cacheable: true },
  { number: '12', slug: 'user-stories', description: 'Per-persona prioritized backlog', cacheable: true },
  { number: '13', slug: 'landing-options', description: '2-3 landing page candidates', cacheable: true },
  { number: '14', slug: 'ia', description: 'SiteMap + rule-based nav', cacheable: true },
  { number: '15', slug: 'compose', description: 'MCP search + Layout DSL composition', cacheable: true },
  { number: '16', slug: 'assets', description: 'Asset router populates slots', cacheable: true },
  { number: '17', slug: 'emit', description: 'Templated Next.js scaffold manifest', cacheable: true },
];

async function main(): Promise<void> {
  await mkdir(stagesDir, { recursive: true });
  let created = 0;
  let skipped = 0;
  for (const def of STAGES) {
    const file = resolve(stagesDir, `${def.number}-${def.slug}.ts`);
    if (await exists(file)) {
      skipped++;
      continue;
    }
    await writeFile(file, makeStub(def));
    created++;
  }
  process.stdout.write(`stub-stages: ${created} created, ${skipped} skipped\n`);
}

async function exists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

function makeStub(def: StageDef): string {
  const stageName = `${def.number}-${def.slug}`;
  const exportName = `stage_${def.number}_${def.slug.replace(/-/g, '_')}`;
  return `import { z } from 'zod';
import type { Stage } from '@skeed/contracts';

/**
 * Stage ${def.number} — ${def.description}.
 *
 * AGENTS: read packages/pipeline/src/stages/AGENTS.md before editing.
 * Replace TODOs with: real input/output schemas (extend pipeline-types.ts if new),
 * a real run() body, and a sibling test file.
 */

const Input = z.unknown(); // TODO: replace with real input schema
const Output = z.unknown(); // TODO: replace with real output schema

export const ${exportName}: Stage<unknown, unknown> = {
  name: '${stageName}',
  version: '0.1.0',
  inputSchema: Input,
  outputSchema: Output,
  cacheable: ${def.cacheable},
  async run(input, _ctx) {
    // TODO: implement
    return input;
  },
};
`;
}

main().catch((err: unknown) => {
  process.stderr.write(`stub-stages failed: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
