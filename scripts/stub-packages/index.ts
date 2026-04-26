#!/usr/bin/env tsx
/**
 * One-shot helper: scaffold the remaining @skeed/* packages with minimal stubs.
 * Idempotent.
 */
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');
const pkgRoot = resolve(repoRoot, 'packages');

interface PkgDef {
  id: string;
  description: string;
  agentBrief: string;
  exportsSnippet: string;
  extraDeps?: string[];
}

const PACKAGES: PkgDef[] = [
  {
    id: 'guards',
    description:
      'Deterministic, fail-closed guardrails (contrast, forbidden patterns, PII, ethics-lint, alt-text, no hallucinated component IDs).',
    agentBrief: `Implement individual Guard objects in src/<guard-name>.ts. Contract: \`Guard<TInput>\` from @skeed/contracts/guard. Each guard returns a GuardResult with violations + autoFixed flag. Run order: hard guards first (fatal), soft guards second (warning).

Guards to implement (one file per guard):

- contrast.ts — WCAG contrast checker, auto-fix by darken/lighten
- forbidden-patterns.ts — per-demographic deny rules
- pii-scrub.ts — health/fintech/gov scanner
- ethics-lint.ts — kids/wellness/gov dark-pattern lint
- asset-checks.ts — alt-text + AI-text-rendering OCR check
- token-resolution.ts — every Tailwind class resolves to a defined token
- component-existence.ts — every component id exists in catalog`,
    exportsSnippet: `export {};
// AGENTS: implement individual guards in src/<name>.ts and export them here.`,
  },
  {
    id: 'scoring',
    description: 'L1 + L2 idea scoring rubrics + LLM judge.',
    agentBrief: `Implement:

- src/rubrics/l1.ts — load \`data/rubrics/score-l1/<version>.json\`, validate against ScoreRubric
- src/rubrics/l2.ts — load \`data/rubrics/score-l2/<version>.json\`
- src/judge.ts — given (rubric, input, llmProvider) → IdeaScore via structured output
- src/feedback.ts — given IdeaScore → recommendations[]

Rubric files live at \`data/rubrics/score-l1/v1.json\` etc. Author them as part of this slice.`,
    exportsSnippet: `export {};
// AGENTS: implement scoring entry points and export here.`,
  },
  {
    id: 'research-bridge',
    description:
      'AutoResearchClaw client + lite-mode fallback. Sends a ResearchBrief, returns ResearchFindings.',
    agentBrief: `Implement:

- src/client.ts — wraps AutoResearchClaw via MCP stdio (preferred) or CLI (\`researchclaw run --topic ...\`). Honor timeoutMs, budgetTokens.
- src/briefs/product-research.md — prompt template that reframes academic-research output as product research
- src/normalize.ts — parses AutoResearchClaw output (markdown + JSON) into ResearchFindings
- src/lite.ts — fallback research loop using only web search + LLM (when AutoResearchClaw unavailable)

Source repo: https://github.com/aiming-lab/AutoResearchClaw

Contract: ResearchEngine in @skeed/contracts/research-engine.`,
    exportsSnippet: `export type { ResearchEngine } from '@skeed/contracts';
// AGENTS: export the AutoResearchClaw client + lite fallback here.`,
  },
  {
    id: 'landing-options',
    description: '2-3 landing page candidate generator.',
    agentBrief: `Implement:

- src/archetypes.ts — declarative defs of 3 landing archetypes: hero-led, story-led, conversion-focused. Each is a Layout DSL tree with slot roles, not concrete component ids.
- src/render.ts — given (archetype, DesignSystem, LogoCandidate) → LandingCandidate (Layout DSL bound to chosen components + assets, plus a screenshot or HTML preview).

Pipeline stage 13 calls render() three times with different archetypes and presents the user 3 candidates.`,
    exportsSnippet: `export {};
// AGENTS: export archetype catalog + render() here.`,
  },
  {
    id: 'assets-router',
    description: 'Slot → asset-source decision. Reads AssetSource plugins via DI.',
    agentBrief: `Implement:

- src/router.ts — \`route(slot, demographic, sources): AssetSource\`. For each slot type (logo, hero_illustration, content_photo, decorative, icon, avatar), call \`source.match(req)\` on every registered source and pick the highest scorer. Tie-breakers documented.
- src/cache.ts — content-addressed cache at \`~/.skeed/assets/<sha256>.<ext>\`. Reads/writes asset_cache table in \`~/.skeed/cache.db\` (Tier-3).
- src/budget.ts — enforce per-run cost cap (default $1.00, configurable).

Do not import any AssetSource implementation directly — they're injected.`,
    exportsSnippet: `export {};
// AGENTS: export route(), cache, budget here.`,
  },
  {
    id: 'asset-logo-svg',
    description: 'Programmatic SVG logo composer using primitives from data/demographics/<id>/logo-primitives/.',
    agentBrief: `Implement:

- src/composer.ts — given (BrandAttributes, DemographicPreset, LogoPrimitiveIndex) → 3-4 LogoCandidates with SVG source + favicon variants + alt text.
- src/primitive-loader.ts — walks data/demographics/<id>/logo-primitives/ via @skeed/demographics-loader.
- src/layouts.ts — implements layout strategies: stacked, horizontal, badge, monogram, mark-only, wordmark-only.
- src/favicon.ts — renders SVG → PNG at 32 + 180px (use sharp or similar).

Implement the \`AssetSource\` interface from @skeed/contracts. \`match()\` scores 1.0 for slot type "logo", 0 otherwise.`,
    exportsSnippet: `export {};
// AGENTS: export the composer as an AssetSource here.`,
  },
  {
    id: 'llm-cache',
    description: 'Provider-agnostic prompt cache (Tier-3 \`~/.skeed/cache.db\`).',
    agentBrief: `Implement:

- src/store.ts — opens \`~/.skeed/cache.db\` (creates if missing), exposes get/set/stats. Schema in \`packages/llm-cache/migrations/0001_init.sql\`.
- src/key.ts — composes cache keys: \`sha256(stageVersion + canonical(input) + modelId + promptVersion + catalogVersion + provider)\`.

Used by pipeline orchestrator and llm-provider-* packages.`,
    exportsSnippet: `export {};
// AGENTS: export the cache store + key composer here.`,
  },
  {
    id: 'eslint-plugin-skeed',
    description:
      'ESLint rules: bans literal hex/px/rem in archetype source, enforces ethics rules per demographic.',
    agentBrief: `Implement custom ESLint rules:

- src/rules/no-literal-tokens.ts — forbid hex/px/rem in TSX under data/archetypes/. Suggest token-namespaced alternatives.
- src/rules/no-dark-patterns.ts — flag forbidden patterns per the loaded demographic preset.

Standard ESLint plugin shape: \`{ rules: { ... } }\`. Tested via @typescript-eslint/rule-tester.`,
    exportsSnippet: `export {};
// AGENTS: export rules object here.`,
  },
];

async function main(): Promise<void> {
  let created = 0;
  let skipped = 0;
  for (const def of PACKAGES) {
    const dir = resolve(pkgRoot, def.id);
    const srcDir = resolve(dir, 'src');
    if (await exists(resolve(dir, 'package.json'))) {
      skipped++;
      continue;
    }
    await mkdir(srcDir, { recursive: true });
    await writeFile(resolve(dir, 'package.json'), packageJson(def));
    await writeFile(resolve(dir, 'tsconfig.json'), tsconfig());
    await writeFile(resolve(srcDir, 'index.ts'), `${def.exportsSnippet}\n`);
    await writeFile(resolve(dir, 'AGENTS.md'), agentsMd(def));
    created++;
  }
  process.stdout.write(`stub-packages: ${created} created, ${skipped} skipped\n`);
}

function packageJson(def: PkgDef): string {
  const deps: Record<string, string> = { '@skeed/contracts': 'workspace:*' };
  for (const d of def.extraDeps ?? []) deps[d] = 'workspace:*';
  return `${JSON.stringify(
    {
      name: `@skeed/${def.id}`,
      version: '0.1.0',
      description: def.description,
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
      dependencies: deps,
      devDependencies: {
        '@types/node': '^22.10.0',
        typescript: '^5.7.2',
        vitest: '^2.1.8',
      },
    },
    null,
    2,
  )}\n`;
}

function tsconfig(): string {
  return `${JSON.stringify(
    {
      extends: '../../tsconfig.base.json',
      compilerOptions: { outDir: './dist', rootDir: './src' },
      include: ['src/**/*'],
    },
    null,
    2,
  )}\n`;
}

function agentsMd(def: PkgDef): string {
  return `# Agent brief — \`@skeed/${def.id}\`

${def.description}

## Scope

Single package. Do not edit elsewhere except this folder and (if your slice requires it) \`packages/contracts/\` for new shared types — but contracts changes need a separate PR first.

## What to build

${def.agentBrief}

## Validation

\`\`\`bash
pnpm --filter @skeed/${def.id} typecheck
pnpm --filter @skeed/${def.id} test
\`\`\`
`;
}

async function exists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

main().catch((err: unknown) => {
  process.stderr.write(`stub-packages failed: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
