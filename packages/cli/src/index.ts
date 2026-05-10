import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildIndex } from '@skeed/indexer';
import { LocalLLMProvider } from '@skeed/llm-provider-local';
import { Catalog } from '@skeed/mcp-server';
import { cac } from 'cac';
import kleur from 'kleur';
import { runInit } from './commands/init.js';
import {
  componentFileName,
  formatCliError,
  parsePositiveInt,
  readPackageVersion,
  resolveInside,
} from './runtime/cli-utils.js';

const cli = cac('skeed');
const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(__dirname, '..');
const repoRoot = resolve(packageRoot, '..', '..');
const cliVersion = readPackageVersion(resolve(packageRoot, 'package.json'), '0.1.0');

normalizeNestedCommands();

cli
  .command('init [...prompt]', 'Scaffold a new project from a freeform idea')
  .option('-n, --name <name>', 'Override the inferred project name (slug)')
  .option('-d, --demographic <id>', 'Pin a specific demographic (skip classification)')
  .option('-o, --out <dir>', 'Output parent directory (default: cwd)')
  .option('-y, --yes', 'Skip all approval gates (CI mode)')
  .option('--preview', 'Open browser preview at approval gates')
  .option('--api-key <key>', 'LLM API key for better content generation')
  .option('--no-api-key', 'Skip API key prompt and use fallback content')
  .action(async (promptParts: string[] | string | undefined, opts) => {
    try {
      const prompt = normalizePrompt(promptParts);
      await runInit({
        prompt,
        ...(opts.name ? { name: opts.name as string } : {}),
        ...(opts.demographic ? { demographic: opts.demographic as string } : {}),
        ...(opts.out ? { outDir: opts.out as string } : {}),
        ...(opts.yes ? { yes: true } : {}),
        ...(opts.preview ? { preview: true } : {}),
        ...(typeof opts.apiKey === 'string' ? { apiKey: opts.apiKey } : {}),
        ...(opts.noApiKey || opts.apiKey === false ? { noApiKey: true } : {}),
      });
    } catch (err) {
      fail('skeed init failed', err);
    }
  });

cli
  .command('doctor', 'Diagnose Skeed installation')
  .option('--json', 'Print machine-readable diagnostics')
  .action((opts) => {
    try {
      const report = collectDoctorReport();
      if (opts.json) {
        process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
        return;
      }
      printDoctorReport(report);
    } catch (err) {
      fail('skeed doctor failed', err);
    }
  });

cli
  .command('search [...intent]', 'Search the Skeed semantic component registry')
  .option('-d, --demographic <id>', 'Filter by demographic id')
  .option('--density <density>', 'Filter by density: compact, cozy, comfy')
  .option('--category <category>', 'Filter by category')
  .option('-l, --limit <n>', 'Limit results (default: 10, max: 50)')
  .option('--registry <path>', 'Path to registry.db')
  .option('--json', 'Print machine-readable results')
  .action((intentParts: string[] | string | undefined, opts) => {
    let catalog: Catalog | undefined;
    try {
      const intent = normalizePrompt(intentParts, 'search intent is required');
      const limit = parsePositiveInt(opts.limit, 'limit', 10, 50);
      catalog = new Catalog(resolveRegistryPath(opts.registry as string | undefined));
      const rows = catalog.semanticSearchComponents({
        intent,
        ...(opts.demographic ? { demographic: String(opts.demographic) } : {}),
        ...(opts.density ? { density: String(opts.density) } : {}),
        ...(opts.category ? { category: String(opts.category) } : {}),
        limit,
      });
      if (opts.json) {
        process.stdout.write(`${JSON.stringify({ intent, results: rows }, null, 2)}\n`);
        return;
      }
      if (rows.length === 0) {
        process.stdout.write(`${kleur.yellow('no results')} Try a broader intent or demographic.\n`);
        return;
      }
      for (const row of rows) {
        process.stdout.write(
          `${kleur.cyan(row.id)} ${kleur.gray(String(row.score))} ${kleur.gray(row.qualityTier ?? '')}\n`,
        );
        process.stdout.write(`  ${row.summary}\n`);
        if (row.reasons?.length) process.stdout.write(`  ${row.reasons.join('; ')}\n`);
      }
    } catch (err) {
      fail('skeed search failed', err);
    } finally {
      catalog?.close();
    }
  });

cli
  .command('view <id>', 'View a Skeed component manifest and context')
  .option('--source', 'Include TSX source')
  .option('--registry <path>', 'Path to registry.db')
  .action((id: string, opts) => {
    let catalog: Catalog | undefined;
    try {
      catalog = new Catalog(resolveRegistryPath(opts.registry as string | undefined));
      const context = catalog.getComponentContext(id);
      if (!context) throw new Error(`component not found: ${id}`);
      const output = opts.source ? context : stripSource(context);
      process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
    } catch (err) {
      fail('skeed view failed', err);
    } finally {
      catalog?.close();
    }
  });

cli
  .command('add <id>', 'Copy a Skeed component into the current app')
  .option('-o, --out <dir>', 'Target directory (default: components/skeed)')
  .option('--registry <path>', 'Path to registry.db')
  .option('--print-plan', 'Print the install plan after writing the component')
  .option('--dry-run', 'Resolve the component and print what would be written')
  .option('--force', 'Overwrite an existing component file')
  .action(async (id: string, opts) => {
    let catalog: Catalog | undefined;
    try {
      catalog = new Catalog(resolveRegistryPath(opts.registry as string | undefined));
      const component = catalog.getComponent(id) as {
        manifest: {
          source?: Array<{ path: string }>;
          performanceBudget?: { serverComponentSafe?: boolean };
        };
        sourceTsx: string | null;
      } | null;
      if (!component) throw new Error(`component not found: ${id}`);

      const outDir = resolve(process.cwd(), opts.out ? String(opts.out) : 'components/skeed');
      const fileName = componentFileName(id);
      const targetPath = resolveInside(outDir, fileName);
      const sourcePath = component.manifest.source?.[0]?.path;
      const source = transformComponentSource(
        await readComponentSource(sourcePath, component.sourceTsx),
        component.manifest.performanceBudget,
      );

      const installPlan = catalog.getInstallPlan(id) as InstallPlan | null;
      if (opts.dryRun) {
        process.stdout.write(`${kleur.cyan('would add')} ${targetPath}\n`);
        if (source.includes("@/app/lib/cn")) {
          process.stdout.write(`${kleur.cyan('would add')} ${resolve(process.cwd(), 'app/lib/cn.ts')}\n`);
        }
      } else {
        if (existsSync(targetPath) && !opts.force) {
          throw new Error(`${targetPath} already exists. Use --force to overwrite.`);
        }
        await mkdir(outDir, { recursive: true });
        await writeFile(targetPath, source, 'utf8');
        await ensureCnHelperIfNeeded(source, Boolean(opts.force));
        process.stdout.write(`${kleur.green('added')} ${targetPath}\n`);
      }
      if (opts.printPlan) {
        process.stdout.write(`${JSON.stringify(installPlan, null, 2)}\n`);
      } else if (installPlan) {
        printInstallNotes(installPlan);
      }
    } catch (err) {
      fail('skeed add failed', err);
    } finally {
      catalog?.close();
    }
  });

cli
  .command('registry build', 'Build the local Skeed semantic registry index')
  .option('--data <dir>', 'Path to data directory')
  .option('--out <path>', 'Output registry.db path')
  .option('--version <version>', 'Registry version label')
  .action(async (opts) => {
    try {
      const dataRoot = resolve(process.cwd(), opts.data ? String(opts.data) : 'data');
      const outPath = resolve(
        process.cwd(),
        opts.out ? String(opts.out) : 'packages/indexer/dist/registry.db',
      );
      const result = await buildIndex({
        dataRoot,
        outPath,
        migrationsDir: resolveMigrationsDir(),
        registryVersion: opts.version ? String(opts.version) : `${cliVersion}-dev`,
        clean: true,
      });
      process.stdout.write(
        `Built ${result.outPath}\n` +
          `  components   : ${result.componentsIndexed}\n` +
          `  context docs : ${result.contextDocumentsIndexed}\n` +
          `  embeddings   : ${result.contextEmbeddingsIndexed}\n`,
      );
    } catch (err) {
      fail('skeed registry build failed', err);
    }
  });

cli
  .command('registry export-shadcn', 'Export shadcn-compatible registry JSON payloads')
  .option('--registry <path>', 'Path to registry.db')
  .option('--out <dir>', 'Output directory (default: registry/shadcn)')
  .option('--limit <n>', 'Max items to export')
  .option('--tier <tier>', 'Filter by quality tier: flagship, generated, legacy')
  .action(async (opts) => {
    let catalog: Catalog | undefined;
    try {
      catalog = new Catalog(resolveRegistryPath(opts.registry as string | undefined));
      const outDir = resolve(process.cwd(), opts.out ? String(opts.out) : 'registry/shadcn');
      await mkdir(outDir, { recursive: true });
      const registry = catalog.shadcnRegistry({
        limit: parsePositiveInt(opts.limit, 'limit', 5000, 10000),
        ...(opts.tier ? { qualityTier: String(opts.tier) } : {}),
      }) as { items: Array<{ name: string; meta?: { skeedId?: string } }> };
      await writeFile(
        resolveInside(outDir, 'registry.json'),
        `${JSON.stringify(registry, null, 2)}\n`,
        'utf8',
      );
      for (const item of registry.items) {
        const skeedId = item.meta?.skeedId;
        if (!skeedId) continue;
        const payload = catalog.shadcnRegistryItem(skeedId);
        await writeFile(
          resolveInside(outDir, `${componentFileName(item.name).replace(/\.tsx$/, '')}.json`),
          `${JSON.stringify(payload, null, 2)}\n`,
          'utf8',
        );
      }
      process.stdout.write(
        `${kleur.green('exported')} ${registry.items.length} item(s) to ${outDir}\n`,
      );
    } catch (err) {
      fail('skeed registry export-shadcn failed', err);
    } finally {
      catalog?.close();
    }
  });

cli
  .command('mcp init', 'Write a local MCP config snippet for Skeed')
  .option('--registry <path>', 'Path to registry.db')
  .option('--out <path>', 'Output file (default: .mcp.json)')
  .option('--force', 'Replace an invalid or non-object MCP config')
  .action(async (opts) => {
    try {
      const registryPath = resolveRegistryPath(opts.registry as string | undefined);
      const outPath = resolve(process.cwd(), opts.out ? String(opts.out) : '.mcp.json');
      const existing = await readJsonIfPresent(outPath, Boolean(opts.force));
      const config = {
        ...(existing && typeof existing === 'object' && !Array.isArray(existing) ? existing : {}),
        mcpServers: {
          ...((existing as { mcpServers?: Record<string, unknown> } | null)?.mcpServers ?? {}),
          skeed: {
            command: 'npx',
            args: ['-y', '@skeed/mcp-server'],
            env: {
              SKEED_REGISTRY_PATH: registryPath,
            },
          },
        },
      };
      await writeFile(outPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
      process.stdout.write(`${kleur.green('wrote')} ${outPath}\n`);
    } catch (err) {
      fail('skeed mcp init failed', err);
    }
  });

cli.help();
cli.version(cliVersion);
cli.parse();

type ReadinessRow = {
  envName: string;
  label: string;
  ready: boolean;
};

type DoctorReport = {
  cliVersion: string;
  node: { version: string; supported: boolean };
  registry: { status: 'ready' | 'missing' | 'error'; path: string | null; overview?: unknown; error?: string };
  localModel: { ready: boolean; path: string };
  llmProviders: ReadinessRow[];
  assetSources: ReadinessRow[];
  research: ReadinessRow[];
  fallbackMode: string;
};

type InstallPlan = {
  dependencies?: string[];
  registryDependencies?: string[];
  tailwind?: { configFiles?: string[]; utilities?: string[] };
  serverComponentSafe?: boolean;
  animationRuntime?: string;
};

function fail(prefix: string, err: unknown): never {
  process.stderr.write(`${kleur.red(`${prefix}:`)} ${formatCliError(err)}\n`);
  process.exit(1);
}

function normalizePrompt(value: string[] | string | undefined, message = 'prompt is required'): string {
  const prompt = Array.isArray(value) ? value.join(' ') : (value ?? '');
  const trimmed = prompt.trim();
  if (!trimmed) throw new Error(message);
  return trimmed;
}

function collectDoctorReport(): DoctorReport {
  const llmProviders = readinessRows([
    ['OPENAI_API_KEY', 'OpenAI'],
    ['ANTHROPIC_API_KEY', 'Anthropic'],
    ['GOOGLE_API_KEY', 'Google/Gemini'],
    ['GROQ_API_KEY', 'Groq'],
    ['DEEPSEEK_API_KEY', 'DeepSeek'],
    ['MOONSHOT_API_KEY', 'Moonshot/Kimi'],
    ['DASHSCOPE_API_KEY', 'DashScope/Qwen'],
    ['OPENROUTER_API_KEY', 'OpenRouter'],
  ]);
  const assetSources = readinessRows([
    ['UNSPLASH_ACCESS_KEY', 'Unsplash photos'],
    ['PEXELS_API_KEY', 'Pexels photos'],
    ['OPENAI_API_KEY', 'OpenAI Image'],
    ['FAL_KEY', 'fal image generation'],
    ['REPLICATE_API_TOKEN', 'Replicate image generation'],
    ['GOOGLE_API_KEY', 'Gemini Image'],
  ]);
  const research = readinessRows([
    ['BROWSER_USE_API_KEY', 'Browser-Use deep research (set SKEED_DEEP_RESEARCH=1 to enable)'],
  ]);
  const modelPath = LocalLLMProvider.getModelPath();
  const localModel = { ready: existsSync(modelPath), path: modelPath };
  const registry = inspectRegistry();
  const hasRemote = llmProviders.some((row) => row.ready);
  const fallbackMode = hasRemote
    ? 'provider LLM available'
    : localModel.ready
      ? 'local LLM available'
      : 'deterministic fallback only';

  return {
    cliVersion,
    node: {
      version: process.version,
      supported: Number(process.versions.node.split('.')[0] ?? 0) >= 22,
    },
    registry,
    localModel,
    llmProviders,
    assetSources,
    research,
    fallbackMode,
  };
}

function printDoctorReport(report: DoctorReport): void {
  process.stdout.write(`Skeed CLI ${report.cliVersion} - node ${report.node.version}\n`);
  process.stdout.write(
    `Node support\n  ${report.node.supported ? kleur.green('ready') : kleur.yellow('unsupported')} requires Node >= 22\n`,
  );
  printReadiness('LLM providers', report.llmProviders);
  process.stdout.write('\nLocal model\n');
  process.stdout.write(
    `  ${report.localModel.ready ? kleur.green('ready') : kleur.yellow('missing')} ${report.localModel.path}\n`,
  );
  printReadiness('Asset sources', report.assetSources);
  printReadiness('Research', report.research);
  process.stdout.write('\nRegistry\n');
  if (report.registry.status === 'ready') {
    const counts = (report.registry.overview as { counts?: Record<string, number> } | undefined)?.counts;
    process.stdout.write(`  ${kleur.green('ready')} ${report.registry.path}\n`);
    if (counts) {
      process.stdout.write(
        `  components: ${counts.components ?? 0}, context docs: ${counts.contextDocuments ?? 0}, embeddings: ${counts.embeddings ?? 0}\n`,
      );
    }
  } else {
    process.stdout.write(
      `  ${kleur.yellow(report.registry.status)} ${report.registry.error ?? 'registry.db not found'}\n`,
    );
  }
  process.stdout.write(`\nFallback mode\n  ${report.fallbackMode}\n`);
}

function printReadiness(title: string, rows: ReadinessRow[]): void {
  process.stdout.write(`\n${title}\n`);
  for (const row of rows) {
    process.stdout.write(
      `  ${row.ready ? kleur.green('ready') : kleur.gray('missing')} ${row.label} (${row.envName})\n`,
    );
  }
}

function readinessRows(rows: Array<[envName: string, label: string]>): ReadinessRow[] {
  return rows.map(([envName, label]) => ({
    envName,
    label,
    ready: Boolean(process.env[envName]),
  }));
}

function inspectRegistry(): DoctorReport['registry'] {
  try {
    const path = resolveRegistryPath(undefined);
    const catalog = new Catalog(path);
    try {
      return { status: 'ready', path, overview: catalog.registryOverview() };
    } finally {
      catalog.close();
    }
  } catch (err) {
    return {
      status: existsSync(resolve(process.cwd(), 'registry.db')) ? 'error' : 'missing',
      path: null,
      error: formatCliError(err),
    };
  }
}

async function readComponentSource(
  sourcePath: string | undefined,
  fallbackSource: string | null,
): Promise<string> {
  if (sourcePath) {
    try {
      const absoluteSourcePath = resolveInside(repoRoot, sourcePath);
      if (existsSync(absoluteSourcePath)) return readFile(absoluteSourcePath, 'utf8');
    } catch {
      // Registry context source below is safer than trusting a bad manifest path.
    }
  }
  if (fallbackSource) return fallbackSource;
  throw new Error('source not available in registry context');
}

async function readJsonIfPresent(path: string, force: boolean): Promise<unknown | null> {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(await readFile(path, 'utf8')) as unknown;
  } catch (err) {
    if (force) return null;
    throw new Error(
      `${path} contains invalid JSON. Fix it or rerun with --force to replace it. ${formatCliError(err)}`,
    );
  }
}

function transformComponentSource(
  source: string,
  performanceBudget: { serverComponentSafe?: boolean } | undefined,
): string {
  const nextSource = source.replace(/from ['"]@skeed\/core\/cn['"]/g, "from '@/app/lib/cn'");
  const withoutDirective = nextSource.replace(/^(['"])use client\1;?\s*/, '');
  if (performanceBudget?.serverComponentSafe && !requiresClientBoundary(withoutDirective)) {
    return withoutDirective;
  }
  if (nextSource.startsWith("'use client'") || nextSource.startsWith('"use client"')) {
    return nextSource;
  }
  return `'use client';\n\n${nextSource}`;
}

function requiresClientBoundary(source: string): boolean {
  return (
    /\b(useState|useEffect|useReducer|useRef|useLayoutEffect)\b/.test(source) ||
    /\bon[A-Z]\w+=/.test(source)
  );
}

async function ensureCnHelperIfNeeded(source: string, force: boolean): Promise<void> {
  if (!source.includes("@/app/lib/cn")) return;
  const targetPath = resolve(process.cwd(), 'app/lib/cn.ts');
  if (existsSync(targetPath) && !force) return;
  await mkdir(dirname(targetPath), { recursive: true });
  await writeFile(
    targetPath,
    `export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}
`,
    'utf8',
  );
}

function printInstallNotes(plan: InstallPlan): void {
  const deps = [...(plan.dependencies ?? []), ...(plan.registryDependencies ?? [])];
  if (deps.length > 0) process.stdout.write(`  deps: ${deps.join(', ')}\n`);
  if (plan.tailwind?.configFiles?.length) {
    process.stdout.write(`  tailwind: ${plan.tailwind.configFiles.join(', ')}\n`);
  }
  process.stdout.write(
    `  runtime: ${plan.serverComponentSafe ? 'server-safe' : 'client-aware'}, motion: ${plan.animationRuntime ?? 'css'}\n`,
  );
}

function normalizeNestedCommands(): void {
  const head = process.argv[2];
  const tail = process.argv[3];
  if ((head === 'registry' || head === 'mcp') && tail && !tail.startsWith('-')) {
    process.argv.splice(2, 2, `${head} ${tail}`);
  }
}

function resolveRegistryPath(input: string | undefined): string {
  if (input) return resolve(process.cwd(), input);
  if (process.env.SKEED_REGISTRY_PATH)
    return resolve(process.cwd(), process.env.SKEED_REGISTRY_PATH);
  const found = registryPathCandidates().find((candidate) => existsSync(candidate));
  if (!found) {
    throw new Error(
      'registry.db not found. Run `skeed registry build`, install @skeed/mcp-server, or set SKEED_REGISTRY_PATH.',
    );
  }
  return found;
}

function registryPathCandidates(): string[] {
  return [
    resolve(process.cwd(), 'registry.db'),
    resolve(packageRoot, 'registry.db'),
    resolve(packageRoot, 'dist/registry.db'),
    resolve(packageRoot, '../mcp-server/registry.db'),
    resolve(packageRoot, '../mcp-server/dist/registry.db'),
    resolve(packageRoot, '../indexer/dist/registry.db'),
    resolve(repoRoot, 'packages/mcp-server/registry.db'),
    resolve(repoRoot, 'packages/mcp-server/dist/registry.db'),
    resolve(repoRoot, 'packages/indexer/dist/registry.db'),
    resolve(repoRoot, 'packages/registry/registry.db'),
    resolve(repoRoot, 'registry.db'),
  ];
}

function resolveMigrationsDir(): string {
  const candidates = [
    resolve(repoRoot, 'packages/indexer/migrations'),
    resolve(packageRoot, '../indexer/migrations'),
    resolve(packageRoot, '../indexer/dist/migrations'),
  ];
  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) throw new Error('indexer migrations not found; reinstall @skeed/indexer');
  return found;
}

function stripSource(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value;
  return JSON.parse(
    JSON.stringify(value, (key, nestedValue) =>
      key === 'sourceTsx' || key === 'body' ? undefined : nestedValue,
    ),
  );
}
