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
import type {
  ArchetypeManifest,
  DemographicId,
  DemographicPreset,
  Density,
} from '@skeed/contracts';
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
            archetypeManifest: archetype.manifest,
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
  archetypeManifest: ArchetypeManifest;
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

  const manifest = buildManifest({
    id: `${args.demoId}/${args.archetypeId}/${args.density}/${variant}`,
    archetype: args.archetypeManifest,
    preset: args.preset,
    density: args.density,
    variant,
    sourcePath: `data/components/${args.demoId}/${args.archetypeId}/${args.density}/${variant}/component.tsx`,
    cssVariableCount: result.cssVariables.size,
    contentHash: hashStr(args.archetypeSource + tokensCss),
  });
  await writeFile(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
}

function buildManifest(args: {
  id: string;
  archetype: ArchetypeManifest;
  preset: DemographicPreset;
  density: Density;
  variant: string;
  sourcePath: string;
  cssVariableCount: number;
  contentHash: string;
}): Record<string, unknown> {
  const intentPhrases = args.archetype.aiMetadata?.intentPhrases?.length
    ? args.archetype.aiMetadata.intentPhrases
    : [
        `add a ${args.archetype.name.toLowerCase()}`,
        `render a ${args.archetype.name.toLowerCase()}`,
        `${args.archetype.id.replace(/-/g, ' ')} component`,
      ];
  const tags = unique([
    args.archetype.category,
    args.archetype.id,
    args.preset.id,
    args.density,
    ...(args.archetype.aiMetadata?.moodTags ?? []),
    ...args.preset.voice.tone,
  ]);
  const keywords = unique([
    ...tokenize(args.archetype.name),
    ...tokenize(args.archetype.id),
    ...tokenize(args.archetype.category),
    ...tokenize(args.preset.id),
    ...intentPhrases.flatMap(tokenize),
    ...tags.flatMap(tokenize),
  ]);
  const wcagLevel = ['kids', 'education', 'health', 'gov', 'mental_wellness'].includes(
    args.preset.id,
  )
    ? 'AAA'
    : 'AA';
  return {
    id: args.id,
    name: `${titleCase(args.preset.id)} ${args.archetype.name} ${titleCase(args.density)}`,
    version: '0.1.0',
    schemaVersion: 1,
    category: args.archetype.category,
    description: /^TODO\b/i.test(args.archetype.description)
      ? `${args.archetype.name} component tuned for ${titleCase(args.preset.id)} experiences.`
      : args.archetype.description,
    archetypeId: args.archetype.id,
    demographicId: args.preset.id,
    demographics: [{ id: args.preset.id, weight: 1 }],
    density: args.density,
    variant: args.variant,
    framework: 'react',
    frameworks: args.archetype.frameworks,
    tags,
    keywords,
    aiIntentPhrases: intentPhrases,
    exampleIntents: [
      ...(args.archetype.aiMetadata?.useCases ?? []),
      `${args.archetype.name} for ${titleCase(args.preset.id)}`,
    ],
    antiPatterns: args.archetype.demographicAntiPatterns,
    psychologySignals: {
      colorTemp: 'neutral',
      density: args.density,
      formality: args.preset.id === 'legal' || args.preset.id === 'gov' ? 4 : 2,
      motionIntensity: args.preset.motion.profile === 'none' ? 'none' : 'subtle',
      contrast: wcagLevel === 'AAA' ? 'max' : 'high',
      playfulness: args.preset.id === 'kids' ? 4 : args.preset.id === 'teens' ? 3 : 1,
      trustCues: [],
    },
    accessibility: {
      wcagLevel,
      ageAppropriate:
        args.preset.id === 'kids'
          ? { min: 6, max: 12 }
          : args.preset.id === 'teens'
            ? { min: 13, max: 19 }
            : { min: 13, max: 120 },
      cognitiveLoad: 'medium',
      reducedMotionSafe: true,
      screenReaderTested: false,
    },
    variants: [
      {
        id: args.variant,
        label: titleCase(args.variant),
        props: {},
        preview: {
          thumb: `data/previews/${args.preset.id}/${args.archetype.id}/${args.density}/${args.variant}.png`,
        },
      },
    ],
    dependencies: [],
    registryDependencies: [],
    tokensUsed: args.archetype.tokensUsed,
    assetSlots: args.archetype.assetSlots,
    conversionPsychology: [],
    license: args.archetype.license,
    attribution: { source: 'original' },
    source: [{ framework: 'react', path: args.sourcePath }],
    preview: {
      thumb: `data/previews/${args.preset.id}/${args.archetype.id}/${args.density}/${args.variant}.png`,
    },
    cssVariableCount: args.cssVariableCount,
    contentHash: args.contentHash,
    generatedAt: new Date().toISOString(),
  };
}

function hashStr(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(16);
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[_/-]/g, ' ')
    .split(/[^a-z0-9]+/g)
    .filter((token) => token.length > 1);
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function titleCase(value: string): string {
  return value
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

main().catch((err: unknown) => {
  process.stderr.write(
    `codegen failed: ${err instanceof Error ? (err.stack ?? err.message) : String(err)}\n`,
  );
  process.exit(2);
});
