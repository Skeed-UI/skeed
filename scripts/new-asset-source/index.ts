#!/usr/bin/env tsx
/**
 * Bootstrap a new packages/asset-source-<id>/ package implementing AssetSource.
 * Usage: pnpm new:asset-source <id>
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');

async function main(): Promise<void> {
  const id = process.argv[2];
  if (!id || !/^[a-z0-9-]+$/.test(id)) {
    process.stderr.write('Usage: pnpm new:asset-source <id>  (lowercase-kebab)\n');
    process.exit(1);
  }
  const pkgDir = resolve(repoRoot, 'packages', `asset-source-${id}`);
  const srcDir = resolve(pkgDir, 'src');
  await mkdir(srcDir, { recursive: true });

  await writeFile(
    resolve(pkgDir, 'package.json'),
    `${JSON.stringify(
      {
        name: `@skeed/asset-source-${id}`,
        version: '0.1.0',
        description: `Skeed AssetSource adapter for ${id}.`,
        license: 'MIT',
        type: 'module',
        main: './src/index.ts',
        types: './src/index.ts',
        exports: { '.': './src/index.ts' },
        scripts: {
          build: 'tsc -p tsconfig.json',
          typecheck: 'tsc -p tsconfig.json --noEmit',
          test: 'vitest run --passWithNoTests',
        },
        dependencies: { '@skeed/contracts': 'workspace:*' },
        devDependencies: {
          '@types/node': '^22.10.0',
          typescript: '^5.7.2',
          vitest: '^2.1.8',
        },
      },
      null,
      2,
    )}\n`,
  );
  await writeFile(
    resolve(pkgDir, 'tsconfig.json'),
    `${JSON.stringify(
      {
        extends: '../../tsconfig.base.json',
        compilerOptions: { outDir: './dist', rootDir: './src' },
        include: ['src/**/*'],
      },
      null,
      2,
    )}\n`,
  );
  await writeFile(
    resolve(srcDir, 'index.ts'),
    `import type { AssetRequest, AssetResult, AssetSource } from '@skeed/contracts/asset-source';\n\nexport class ${pascal(id)}AssetSource implements AssetSource {\n  readonly id = '${id}';\n\n  match(_req: AssetRequest): { score: number; reason: string } {\n    // TODO: return a 0..1 score for whether this source can satisfy the slot.\n    return { score: 0, reason: 'not implemented' };\n  }\n\n  async fetch(_req: AssetRequest): Promise<AssetResult> {\n    // TODO: call the underlying API, return bytes + metadata.\n    throw new Error('not implemented');\n  }\n\n  estimateCost(_req: AssetRequest): number {\n    return 0;\n  }\n}\n`,
  );
  await writeFile(
    resolve(pkgDir, 'AGENTS.md'),
    `# Agent brief — \`@skeed/asset-source-${id}\`\n\nImplement the \`AssetSource\` interface in \`src/index.ts\`. Contract lives at \`packages/contracts/src/asset-source.ts\`.\n\n## Required\n\n1. \`match(req)\` returns \`{ score: 0..1, reason }\` — what fraction of slots this source serves well.\n2. \`fetch(req)\` performs the actual API call, returns \`AssetResult\` with bytes, mime, alt-text, license, attribution.\n3. \`estimateCost(req)\` (optional but recommended) returns cents.\n4. Tests: at minimum mock the underlying API and verify request shape, response normalization, error handling.\n5. Auth: read API keys from \`process.env.SKEED_${id.toUpperCase().replace(/-/g, '_')}_API_KEY\`. Document required env vars in your README.\n\n## What slots is this source for?\n\nDecide upfront — image AI, stock photo, decorative SVG, programmatic logo, etc. The \`match()\` score reflects this:\n\n- Hero illustration → AI gen sources (fal/replicate/openai-image/gemini-image) score ~0.9\n- Avatar → stock photo sources (unsplash/pexels) score ~0.9\n- Decorative → CC0 SVG sources (open-doodles/undraw) score ~0.9\n- Logo → SVG composer scores 1.0\n\n## Do not\n\n- Do not edit \`packages/contracts\` or \`packages/assets-router\`. The router consumes any \`AssetSource\` impl through DI — add yours and the router picks it up.\n- Do not commit API keys.\n`,
  );
  process.stdout.write(`Scaffolded packages/asset-source-${id}/\n`);
}

function pascal(s: string): string {
  return s
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('');
}

main().catch((err: unknown) => {
  process.stderr.write(`new-asset-source failed: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
