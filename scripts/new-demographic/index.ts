#!/usr/bin/env tsx
/**
 * Bootstrap a new demographic skeleton under data/demographics/<id>/.
 * Usage: pnpm new:demographic <id>
 */
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');

const VALID_DEMOGRAPHIC_IDS = new Set([
  'kids',
  'teens',
  'working_class',
  'education',
  'religious',
  'mental_wellness',
  'health',
  'legal',
  'erp',
  'sales_crm',
  'hightech',
  'social',
  'monitoring',
  'classic',
  'fintech',
  'ai_apps',
  'marketplace',
  'listings',
  'gov',
  'military',
  'productivity',
]);

const AAA_STRICT = new Set(['kids', 'education', 'health', 'gov', 'mental_wellness']);

async function main(): Promise<void> {
  const id = process.argv[2];
  if (!id) {
    process.stderr.write('Usage: pnpm new:demographic <id>\n');
    process.stderr.write(`Valid ids: ${[...VALID_DEMOGRAPHIC_IDS].join(', ')}\n`);
    process.exit(1);
  }
  if (!VALID_DEMOGRAPHIC_IDS.has(id)) {
    process.stderr.write(`unknown demographic id: ${id}\n`);
    process.stderr.write(`must be one of: ${[...VALID_DEMOGRAPHIC_IDS].join(', ')}\n`);
    process.exit(1);
  }
  const target = resolve(repoRoot, 'data', 'demographics', id);
  await mkdir(target, { recursive: true });
  await mkdir(resolve(target, 'psychology'), { recursive: true });
  await mkdir(resolve(target, 'pain-points'), { recursive: true });
  await mkdir(resolve(target, 'logo-primitives', 'shapes'), { recursive: true });
  await mkdir(resolve(target, 'logo-primitives', 'marks'), { recursive: true });
  await mkdir(resolve(target, 'logo-primitives', 'wordmarks'), { recursive: true });
  await mkdir(resolve(target, 'logo-primitives', 'containers'), { recursive: true });

  const skeletonDir = resolve(repoRoot, 'data', '_skeleton', 'demographic');
  await copyFile(resolve(skeletonDir, 'AGENTS.md'), resolve(target, 'AGENTS.md'));
  const presetTpl = await readFile(resolve(skeletonDir, 'preset.json'), 'utf8');
  await writeFile(resolve(target, 'preset.json'), presetTpl.replace(/REPLACE_ME/g, id));

  await writeFile(
    resolve(target, 'README.md'),
    `# ${id}\n\n> TODO: Describe this demographic, its niches, and design rationale.\n\nSee \`AGENTS.md\` in this folder for the agent brief and required artifacts.\n`,
  );
  await writeFile(
    resolve(target, 'owners.md'),
    AAA_STRICT.has(id)
      ? `# ${id} — Maintainers\n\nThis is an **AAA-strict** demographic. PRs require **two reviewers**, including at least one domain lead.\n\n## Domain leads\n\n- _vacant_\n`
      : `# ${id} — Maintainers\n\n## Domain leads\n\n- _vacant_\n`,
  );

  process.stdout.write(`Scaffolded data/demographics/${id}/\n`);
  process.stdout.write(
    `Next: read AGENTS.md inside that folder, then fill out preset.json + at least one niche.\n`,
  );
}

main().catch((err: unknown) => {
  process.stderr.write(
    `new-demographic failed: ${err instanceof Error ? err.message : String(err)}\n`,
  );
  process.exit(1);
});
