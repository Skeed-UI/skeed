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

const cli = cac('skeed');
const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(__dirname, '..');
const repoRoot = resolve(packageRoot, '..', '..');

normalizeNestedCommands();

cli
  .command('init <prompt>', 'Scaffold a new project from a freeform idea')
  .option('-n, --name <name>', 'Override the inferred project name (slug)')
  .option('-d, --demographic <id>', 'Pin a specific demographic (skip classification)')
  .option('-o, --out <dir>', 'Output parent directory (default: cwd)')
  .option('-y, --yes', 'Skip all approval gates (CI mode)')
  .option('--preview', 'Open browser preview at approval gates (M3)')
  .option('--api-key <key>', 'LLM API key for better content generation')
  .option('--no-api-key', 'Skip API key prompt and use fallback content')
  .action(async (prompt: string, opts) => {
    try {
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
      process.stderr.write(`${kleur.red('skeed init failed:')} ${formatErr(err)}\n`);
      process.exit(1);
    }
  });

cli.command('doctor', 'Diagnose Skeed installation').action(() => {
  process.stdout.write(`Skeed CLI 0.1.0 - node ${process.version}\n`);
  printReadiness('LLM providers', [
    ['OPENAI_API_KEY', 'OpenAI'],
    ['ANTHROPIC_API_KEY', 'Anthropic'],
    ['GOOGLE_API_KEY', 'Google/Gemini'],
    ['DEEPSEEK_API_KEY', 'DeepSeek'],
    ['MOONSHOT_API_KEY', 'Moonshot/Kimi'],
    ['DASHSCOPE_API_KEY', 'DashScope/Qwen'],
    ['OPENROUTER_API_KEY', 'OpenRouter'],
  ]);

  const modelPath = LocalLLMProvider.getModelPath();
  process.stdout.write('\nLocal model\n');
  process.stdout.write(
    `  ${existsSync(modelPath) ? kleur.green('ready') : kleur.yellow('missing')} ${modelPath}\n`,
  );

  printReadiness('Asset sources', [
    ['UNSPLASH_ACCESS_KEY', 'Unsplash photos'],
    ['PEXELS_API_KEY', 'Pexels photos'],
    ['OPENAI_API_KEY', 'OpenAI Image'],
    ['FAL_KEY', 'fal image generation'],
    ['REPLICATE_API_TOKEN', 'Replicate image generation'],
    ['GOOGLE_API_KEY', 'Gemini Image'],
  ]);

  printReadiness('Research', [
    ['BROWSER_USE_API_KEY', 'Browser-Use deep research (set SKEED_DEEP_RESEARCH=1 to enable)'],
  ]);

  const hasRemote = [
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY',
    'GOOGLE_API_KEY',
    'DEEPSEEK_API_KEY',
    'MOONSHOT_API_KEY',
    'DASHSCOPE_API_KEY',
    'OPENROUTER_API_KEY',
  ].some((name) => Boolean(process.env[name]));
  const fallbackMode = hasRemote
    ? 'provider LLM available'
    : existsSync(modelPath)
      ? 'local LLM available'
      : 'deterministic fallback only';
  process.stdout.write(`\nFallback mode\n  ${fallbackMode}\n`);
});

cli
  .command('search <intent>', 'Search the Skeed semantic component registry')
  .option('-d, --demographic <id>', 'Filter by demographic id')
  .option('--density <density>', 'Filter by density: compact, cozy, comfy')
  .option('--category <category>', 'Filter by category')
  .option('-l, --limit <n>', 'Limit results (default: 10)')
  .option('--registry <path>', 'Path to registry.db')
  .action((intent: string, opts) => {
    const catalog = new Catalog(resolveRegistryPath(opts.registry as string | undefined));
    try {
      const rows = catalog.semanticSearchComponents({
        intent,
        ...(opts.demographic ? { demographic: String(opts.demographic) } : {}),
        ...(opts.density ? { density: String(opts.density) } : {}),
        ...(opts.category ? { category: String(opts.category) } : {}),
        ...(opts.limit ? { limit: Number(opts.limit) } : {}),
      });
      for (const row of rows) {
        process.stdout.write(`${kleur.cyan(row.id)} ${kleur.gray(String(row.score))}\n`);
        process.stdout.write(`  ${row.summary}\n`);
        if (row.reasons?.length) process.stdout.write(`  ${row.reasons.join('; ')}\n`);
      }
    } finally {
      catalog.close();
    }
  });

cli
  .command('view <id>', 'View a Skeed component manifest and context')
  .option('--source', 'Include TSX source')
  .option('--registry <path>', 'Path to registry.db')
  .action((id: string, opts) => {
    const catalog = new Catalog(resolveRegistryPath(opts.registry as string | undefined));
    try {
      const context = catalog.getComponentContext(id);
      if (!context) throw new Error(`component not found: ${id}`);
      const output = opts.source ? context : stripSource(context);
      process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
    } finally {
      catalog.close();
    }
  });

cli
  .command('add <id>', 'Copy a Skeed component into the current app')
  .option('-o, --out <dir>', 'Target directory (default: components/skeed)')
  .option('--registry <path>', 'Path to registry.db')
  .action(async (id: string, opts) => {
    const catalog = new Catalog(resolveRegistryPath(opts.registry as string | undefined));
    try {
      const component = catalog.getComponent(id) as {
        manifest: { source?: Array<{ path: string }> };
        sourceTsx: string | null;
      } | null;
      if (!component) throw new Error(`component not found: ${id}`);
      const outDir = resolve(process.cwd(), opts.out ? String(opts.out) : 'components/skeed');
      await mkdir(outDir, { recursive: true });
      const fileName = `${id.split('/').slice(1).join('-')}.tsx`;
      const targetPath = resolve(outDir, fileName);
      const sourcePath = component.manifest.source?.[0]?.path;
      const source =
        sourcePath && existsSync(resolve(repoRoot, sourcePath))
          ? await readFile(resolve(repoRoot, sourcePath), 'utf8')
          : component.sourceTsx;
      if (!source) throw new Error(`source not available for ${id}`);
      await writeFile(targetPath, source, 'utf8');
      process.stdout.write(`${kleur.green('added')} ${targetPath}\n`);
    } finally {
      catalog.close();
    }
  });

cli
  .command('registry build', 'Build the local Skeed semantic registry index')
  .option('--data <dir>', 'Path to data directory')
  .option('--out <path>', 'Output registry.db path')
  .option('--version <version>', 'Registry version label')
  .action(async (opts) => {
    const dataRoot = resolve(process.cwd(), opts.data ? String(opts.data) : 'data');
    const outPath = resolve(
      process.cwd(),
      opts.out ? String(opts.out) : 'packages/indexer/dist/registry.db',
    );
    const result = await buildIndex({
      dataRoot,
      outPath,
      migrationsDir: resolve(repoRoot, 'packages/indexer/migrations'),
      registryVersion: opts.version ? String(opts.version) : '0.1.0-dev',
      clean: true,
    });
    process.stdout.write(
      `Built ${result.outPath}\n` +
        `  components   : ${result.componentsIndexed}\n` +
        `  context docs : ${result.contextDocumentsIndexed}\n` +
        `  embeddings   : ${result.contextEmbeddingsIndexed}\n`,
    );
  });

cli
  .command('registry export-shadcn', 'Export shadcn-compatible registry JSON payloads')
  .option('--registry <path>', 'Path to registry.db')
  .option('--out <dir>', 'Output directory (default: registry/shadcn)')
  .option('--limit <n>', 'Max items to export')
  .option('--tier <tier>', 'Filter by quality tier: flagship, generated, legacy')
  .action(async (opts) => {
    const catalog = new Catalog(resolveRegistryPath(opts.registry as string | undefined));
    try {
      const outDir = resolve(process.cwd(), opts.out ? String(opts.out) : 'registry/shadcn');
      await mkdir(outDir, { recursive: true });
      const registry = catalog.shadcnRegistry({
        ...(opts.limit ? { limit: Number(opts.limit) } : {}),
        ...(opts.tier ? { qualityTier: String(opts.tier) } : {}),
      }) as { items: Array<{ name: string; meta?: { skeedId?: string } }> };
      await writeFile(
        resolve(outDir, 'registry.json'),
        `${JSON.stringify(registry, null, 2)}\n`,
        'utf8',
      );
      for (const item of registry.items) {
        const skeedId = item.meta?.skeedId;
        if (!skeedId) continue;
        const payload = catalog.shadcnRegistryItem(skeedId);
        await writeFile(
          resolve(outDir, `${item.name}.json`),
          `${JSON.stringify(payload, null, 2)}\n`,
          'utf8',
        );
      }
      process.stdout.write(
        `${kleur.green('exported')} ${registry.items.length} item(s) to ${outDir}\n`,
      );
    } finally {
      catalog.close();
    }
  });

cli
  .command('mcp init', 'Write a local MCP config snippet for Skeed')
  .option('--registry <path>', 'Path to registry.db')
  .option('--out <path>', 'Output file (default: .mcp.json)')
  .action(async (opts) => {
    const registryPath = resolveRegistryPath(opts.registry as string | undefined);
    const outPath = resolve(process.cwd(), opts.out ? String(opts.out) : '.mcp.json');
    const config = {
      mcpServers: {
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
  });

cli.help();
cli.version('0.1.0');
cli.parse();

function formatErr(err: unknown): string {
  if (err instanceof Error) return err.stack ?? err.message;
  return String(err);
}

function printReadiness(title: string, rows: Array<[envName: string, label: string]>): void {
  process.stdout.write(`\n${title}\n`);
  for (const [envName, label] of rows) {
    process.stdout.write(
      `  ${process.env[envName] ? kleur.green('ready') : kleur.gray('missing')} ${label} (${envName})\n`,
    );
  }
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
  const candidates = [
    resolve(repoRoot, 'packages/indexer/dist/registry.db'),
    resolve(repoRoot, 'packages/mcp-server/dist/registry.db'),
    resolve(packageRoot, '../indexer/dist/registry.db'),
  ];
  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) {
    throw new Error(
      'registry.db not found. Run `skeed registry build` or set SKEED_REGISTRY_PATH.',
    );
  }
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
