#!/usr/bin/env tsx
/**
 * Bootstrap a new archetype skeleton under data/archetypes/<id>.archetype.{tsx,json}.
 * Usage: pnpm new:archetype <id>
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');

async function main(): Promise<void> {
  const id = process.argv[2];
  if (!id || !/^[a-z0-9-]+$/.test(id)) {
    process.stderr.write('Usage: pnpm new:archetype <id>  (lowercase-kebab)\n');
    process.exit(1);
  }
  const dir = resolve(repoRoot, 'data', 'archetypes');
  await mkdir(dir, { recursive: true });
  const tsxPath = resolve(dir, `${id}.archetype.tsx`);
  const jsonPath = resolve(dir, `${id}.archetype.json`);

  const Pascal = id
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');

  await writeFile(
    jsonPath,
    `${JSON.stringify(
      {
        id,
        name: Pascal,
        schemaVersion: 1,
        category: 'molecule',
        description: `TODO: describe ${Pascal}`,
        tokensUsed: ['color.neutral.50'],
        assetSlots: [],
        defaultVariantsPerDensity: 1,
        frameworks: ['react'],
        license: 'MIT',
        demographicAntiPatterns: [],
      },
      null,
      2,
    )}\n`,
  );
  await writeFile(
    tsxPath,
    `import { type HTMLAttributes, forwardRef } from 'react';\nimport { cn } from '@skeed/core/cn';\n\nexport interface ${Pascal}Props extends HTMLAttributes<HTMLDivElement> {}\n\nexport const ${Pascal} = forwardRef<HTMLDivElement, ${Pascal}Props>(function ${Pascal}(\n  { className, ...rest },\n  ref,\n) {\n  // TODO: implement using only token-based classes (color.*, radius.*, spacing.*, density.*).\n  // No literal hex/px/rem allowed — eslint-plugin-skeed/no-literal-tokens will fail PR.\n  return <div ref={ref} className={cn('', className)} {...rest} />;\n});\n`,
  );

  process.stdout.write(`Scaffolded data/archetypes/${id}.archetype.{tsx,json}\n`);
  process.stdout.write('Next: fill in the manifest tokensUsed[] and the TSX implementation.\n');
}

main().catch((err: unknown) => {
  process.stderr.write(`new-archetype failed: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
