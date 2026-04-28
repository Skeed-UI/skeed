#!/usr/bin/env tsx
/**
 * Skeed codegen CLI — emit data/components/<demo>/<archetype>/<density>/{component.tsx,manifest.json,tokens.css}
 *
 * Usage:
 *   tsx packages/codegen/src/cli.ts                # full sweep
 *   tsx packages/codegen/src/cli.ts --demo kids    # one demographic
 *   tsx packages/codegen/src/cli.ts --max 30       # cap total entries (dev)
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadArchetypes } from '@skeed/archetypes-loader';
import { findRepoData } from '@skeed/asset-logo-svg';
import type { DemographicId, Density } from '@skeed/contracts';
import { loadDemographics } from '@skeed/demographics-loader';
import { applyDensity } from './density-applier.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
void __dirname;

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const demoFlag = argv.indexOf('--demo');
  const onlyDemo = demoFlag >= 0 ? argv[demoFlag + 1] : undefined;
  const maxFlag = argv.indexOf('--max');
  const maxCount = maxFlag >= 0 ? Number(argv[maxFlag + 1]) : Number.POSITIVE_INFINITY;

  const dataRoot = findRepoData();
  const archetypesRoot = resolve(dataRoot, '..', 'archetypes');
  const componentsRoot = resolve(dataRoot, '..', 'components');

  const [demos, archetypes] = await Promise.all([
    loadDemographics({ dataRoot }),
    loadArchetypes({ dataRoot: archetypesRoot }),
  ]);

  const targetDemos = onlyDemo
    ? new Map([...demos.demographics].filter(([id]) => id === onlyDemo))
    : demos.demographics;

  if (targetDemos.size === 0) {
    process.stderr.write(`No demographics matched ${onlyDemo ?? '(all)'}\n`);
    process.exit(1);
  }

  const densities: Density[] = ['compact', 'cozy', 'comfy'];
  let emitted = 0;
  let skipped = 0;
  const failures: Array<{ demo: string; archetype: string; density: Density; reason: string }> = [];

  for (const [demoId, demo] of targetDemos) {
    if (emitted >= maxCount) break;
    // Skip demos with no real psychology / primitives content
    if (
      demo.psychology.size === 0 &&
      demo.logoPrimitives.marks.length + demo.logoPrimitives.shapes.length === 0
    ) {
      skipped += 1;
      continue;
    }
    for (const [, archetype] of archetypes.archetypes) {
      if (emitted >= maxCount) break;
      for (const density of densities) {
        if (emitted >= maxCount) break;
        try {
          await emitOne({
            componentsRoot,
            demoId: demoId as DemographicId,
            preset: demo.preset,
            archetypeId: archetype.manifest.id,
            archetypeSource: archetype.source,
            density,
          });
          emitted += 1;
        } catch (err) {
          failures.push({
            demo: demoId,
            archetype: archetype.manifest.id,
            density,
            reason: err instanceof Error ? err.message : String(err),
          });
        }
      }
    }
  }

  process.stdout.write(
    `\nCodegen done. emitted=${emitted} skipped_demos=${skipped} failures=${failures.length}\n`,
  );
  if (failures.length > 0) {
    for (const f of failures.slice(0, 5)) {
      process.stdout.write(`  fail ${f.demo}/${f.archetype}/${f.density} → ${f.reason}\n`);
    }
    if (failures.length > 5) process.stdout.write(`  ... ${failures.length - 5} more\n`);
  }
}

interface EmitArgs {
  componentsRoot: string;
  demoId: DemographicId;
  preset: Parameters<typeof applyDensity>[0]['preset'];
  archetypeId: string;
  archetypeSource: string;
  density: Density;
}

async function emitOne(args: EmitArgs): Promise<void> {
  const variant = 'default';
  const outDir = join(
    args.componentsRoot,
    String(args.demoId),
    args.archetypeId,
    args.density,
    variant,
  );
  await mkdir(outDir, { recursive: true });

  const result = applyDensity({
    preset: args.preset,
    density: args.density,
  });

  const tokensCss = `:root {\n${[...result.cssVariables.entries()].map(([k, v]) => `  ${k}: ${v};`).join('\n')}\n}\n`;
  await writeFile(join(outDir, 'tokens.css'), tokensCss, 'utf8');
  await writeFile(join(outDir, 'component.tsx'), args.archetypeSource, 'utf8');

  const manifest = {
    id: `${args.demoId}/${args.archetypeId}/${args.density}/${variant}`,
    archetypeId: args.archetypeId,
    demographicId: args.demoId,
    density: args.density,
    variant,
    framework: 'react',
    cssVariableCount: result.cssVariables.size,
    contentHash: hashStr(args.archetypeSource + tokensCss),
    generatedAt: new Date().toISOString(),
  };
  await writeFile(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
}

function hashStr(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(16);
}

main().catch((err: unknown) => {
  process.stderr.write(
    `codegen failed: ${err instanceof Error ? (err.stack ?? err.message) : String(err)}\n`,
  );
  process.exit(2);
});
