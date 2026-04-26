#!/usr/bin/env tsx
/**
 * Bootstrap a new packages/llm-provider-<id>/ package implementing LLMProvider.
 * Usage: pnpm new:llm-provider <id>
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');

async function main(): Promise<void> {
  const id = process.argv[2];
  if (!id || !/^[a-z0-9-]+$/.test(id)) {
    process.stderr.write('Usage: pnpm new:llm-provider <id>  (lowercase-kebab)\n');
    process.exit(1);
  }
  const pkgDir = resolve(repoRoot, 'packages', `llm-provider-${id}`);
  const srcDir = resolve(pkgDir, 'src');
  await mkdir(srcDir, { recursive: true });

  await writeFile(
    resolve(pkgDir, 'package.json'),
    `${JSON.stringify(
      {
        name: `@skeed/llm-provider-${id}`,
        version: '0.1.0',
        description: `Skeed LLMProvider adapter for ${id}.`,
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
        dependencies: { '@skeed/contracts': 'workspace:*', zod: '^3.24.1' },
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
    `import type { z } from 'zod';\nimport type {\n  LLMChatRequest,\n  LLMChatResult,\n  LLMEmbedRequest,\n  LLMEmbedResult,\n  LLMProvider,\n} from '@skeed/contracts/llm-provider';\n\nexport class ${pascal(id)}LLMProvider implements LLMProvider {\n  readonly id = '${id}';\n  readonly supportsCache = false; // TODO: set true if vendor offers prompt caching\n\n  modelFor(_tier: 'fast' | 'balanced' | 'strong'): string {\n    // TODO: map tier → concrete model id\n    throw new Error('not implemented');\n  }\n\n  async chat<T>(_req: LLMChatRequest<z.ZodType<T>>): Promise<LLMChatResult<T>> {\n    // TODO: call vendor SDK, validate output against schema, return result\n    throw new Error('not implemented');\n  }\n\n  async embed?(_req: LLMEmbedRequest): Promise<LLMEmbedResult> {\n    throw new Error('not implemented');\n  }\n}\n`,
  );
  await writeFile(
    resolve(pkgDir, 'AGENTS.md'),
    `# Agent brief — \`@skeed/llm-provider-${id}\`\n\nImplement the \`LLMProvider\` interface in \`src/index.ts\`. Contract lives at \`packages/contracts/src/llm-provider.ts\`.\n\n## Required\n\n1. \`modelFor(tier)\` maps \`fast | balanced | strong\` → concrete vendor model id.\n2. \`chat()\` calls vendor SDK, parses JSON output against Zod schema, returns \`LLMChatResult\` with token counts.\n3. \`embed()\` (optional) for semantic search.\n4. **Prompt caching**: if vendor supports it (Anthropic does, OpenAI partially), set \`supportsCache = true\` and route \`message.cacheable === true\` blocks through native caching APIs.\n5. Auth: read \`process.env.SKEED_${id.toUpperCase().replace(/-/g, '_')}_API_KEY\`.\n6. Tests: mock SDK at module level, verify request shape, response parsing, schema validation, retry on schema fail.\n\n## Do not\n\n- Do not commit API keys.\n- Do not import the vendor SDK at top level if it's heavy — lazy-import inside \`chat()\` to keep cold start fast.\n`,
  );
  process.stdout.write(`Scaffolded packages/llm-provider-${id}/\n`);
}

function pascal(s: string): string {
  return s
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('');
}

main().catch((err: unknown) => {
  process.stderr.write(`new-llm-provider failed: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
