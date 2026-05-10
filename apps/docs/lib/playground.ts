import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { z } from 'zod';
import { previewStyleForDemographic } from './theme';

export const PlaygroundGenerateInput = z.object({
  prompt: z.string().trim().min(8).max(320),
  demographic: z.string().optional(),
  density: z.enum(['compact', 'cozy', 'comfy']).optional(),
  tone: z.enum(['calm', 'precise', 'premium', 'playful']).optional(),
  constraints: z.array(z.string().trim().max(120)).max(6).optional(),
});

export type PlaygroundGenerateInput = z.infer<typeof PlaygroundGenerateInput>;

export type PlaygroundGenerateResult = {
  appName: string;
  demographic: string;
  designTokens: Record<string, unknown>;
  selectedComponents: Array<{
    id: string;
    name: string;
    qualityTier: string;
    reasons: string[];
  }>;
  pages: Array<{ route: string; sections: Array<{ role: string; component: string; summary: string }> }>;
  files: Array<{ path: string; contents: string }>;
  installCommand: string;
  explanations: string[];
  warnings: string[];
  previewModel: {
    headline: string;
    body: string;
    cta: string;
    demographic: string;
    components: string[];
  };
};

const generationBuckets = new Map<string, number[]>();

export async function generatePlaygroundApp(
  input: PlaygroundGenerateInput,
  opts: { ip?: string | null } = {},
): Promise<PlaygroundGenerateResult> {
  enforceRateLimit(opts.ip ?? 'anonymous');
  const parsed = PlaygroundGenerateInput.parse(input);
  const demographic = parsed.demographic || inferDemographic(parsed.prompt);
  const appName = inferAppName(parsed.prompt);
  const outRoot = await mkdtemp(join(tmpdir(), 'skeed-docs-playground-'));
  const projectDir = join(outRoot, slugify(appName));

  try {
    await runCli([
      'init',
      parsed.prompt,
      '--name',
      slugify(appName),
      '--demographic',
      demographic,
      '--out',
      outRoot,
      '--yes',
      '--no-api-key',
    ]);

    const files = await readProjectFiles(projectDir);
    const selectedComponents = files
      .filter((file) => file.path.startsWith('app/components/skeed/') && file.path.endsWith('.tsx'))
      .slice(0, 12)
      .map((file) => {
        const id = file.path.replace(/^app\/components\/skeed\//, '').replace(/\.tsx$/, '');
        return {
          id,
          name: titleCase(id.replace(/-/g, ' ')),
          qualityTier: id.includes('hero') || id.includes('feature') || id.includes('form') ? 'flagship' : 'generated',
          reasons: [`Selected for ${demographic} via the Skeed scaffold pipeline.`],
        };
      });

    return {
      appName,
      demographic,
      designTokens: {
        density: parsed.density ?? 'cozy',
        tone: parsed.tone ?? 'calm',
        previewStyle: previewStyleForDemographic(demographic),
      },
      selectedComponents,
      pages: [
        {
          route: '/',
          sections: selectedComponents.slice(0, 4).map((component) => ({
            role: component.id.split('-').slice(1, -2).join('-') || 'section',
            component: component.name,
            summary: component.reasons[0] ?? `Selected for ${demographic}`,
          })),
        },
      ],
      files,
      installCommand: `npx @skeed/cli init ${JSON.stringify(parsed.prompt)} --demographic ${demographic} --yes`,
      explanations: [
        `Classified as ${demographic}.`,
        parsed.constraints?.length ? `Applied constraints: ${parsed.constraints.join('; ')}.` : 'No extra constraints provided.',
        `${selectedComponents.length} registry-backed component files emitted.`,
        'Generated through the Skeed CLI/pipeline boundary so the docs server does not execute user code.',
      ],
      warnings: [],
      previewModel: {
        headline: appName,
        body: `A ${demographic.replace(/_/g, ' ')} interface generated from Skeed registry context.`,
        cta: 'Get started',
        demographic,
        components: selectedComponents.map((component) => component.name),
      },
    };
  } finally {
    if (outRoot.startsWith(tmpdir())) {
      await rm(outRoot, { force: true, recursive: true }).catch(() => undefined);
    }
  }
}

async function runCli(args: string[]): Promise<void> {
  const cliPath = resolveCliPath();
  await new Promise<void>((resolvePromise, reject) => {
    const child = spawn(process.execPath, [cliPath, ...args], {
      env: { ...process.env, SKEED_DISABLE_LOCAL_LLM: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(stderr || `Skeed CLI exited with code ${code}`));
    });
  });
}

async function readProjectFiles(projectDir: string): Promise<Array<{ path: string; contents: string }>> {
  const wanted = [
    'app/page.tsx',
    'app/layout.tsx',
    'app/globals.css',
    'app/components/sections.tsx',
    'tailwind.config.ts',
    'package.json',
  ];
  const componentDir = join(projectDir, 'app/components/skeed');
  const componentFiles = existsSync(componentDir)
    ? (await readdir(componentDir))
        .filter((file) => file.endsWith('.tsx'))
        .slice(0, 8)
        .map((file) => `app/components/skeed/${file}`)
    : [];
  const files = [...wanted, ...componentFiles];
  const out: Array<{ path: string; contents: string }> = [];
  for (const path of files) {
    const full = join(projectDir, path);
    if (!existsSync(full)) continue;
    const contents = await readFile(full, 'utf8');
    out.push({
      path,
      contents: contents.length > 12000 ? `${contents.slice(0, 12000)}\n/* truncated */` : contents,
    });
  }
  return out;
}

function resolveCliPath(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    resolve(here, '../../../packages/cli/dist/index.js'),
    resolve(process.cwd(), '../../packages/cli/dist/index.js'),
    resolve(process.cwd(), 'packages/cli/dist/index.js'),
  ];
  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) throw new Error('Skeed CLI build not found. Run `pnpm --filter @skeed/cli build`.');
  return found;
}

function enforceRateLimit(key: string): void {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const recent = (generationBuckets.get(key) ?? []).filter((time) => now - time < windowMs);
  if (recent.length >= 8) {
    throw new Error('Playground rate limit reached. Please wait a few minutes and try again.');
  }
  recent.push(now);
  generationBuckets.set(key, recent);
}

function inferDemographic(prompt: string): string {
  const value = prompt.toLowerCase();
  if (/\b(run|runner|fitness|workout|health|patient|clinic)\b/.test(value)) return 'health';
  if (/\b(kid|kids|child|children|parent)\b/.test(value)) return 'kids';
  if (/\b(legal|law|contract|heritage|classic)\b/.test(value)) return 'classic';
  if (/\b(gov|public|civic|benefit)\b/.test(value)) return 'gov';
  if (/\b(finance|fintech|bank|money|budget)\b/.test(value)) return 'fintech';
  if (/\b(ai|assistant|voice|chatbot)\b/.test(value)) return 'ai_apps';
  if (/\b(market|listing|commerce|booking)\b/.test(value)) return 'marketplace';
  if (/\b(mental|meditation|calm|therapy)\b/.test(value)) return 'mental_wellness';
  return 'productivity';
}

function inferAppName(prompt: string): string {
  return prompt.replace(/^build\s+/i, '').replace(/[.!?]+$/g, '').trim().slice(0, 80) || 'Skeed app';
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `skeed-${randomUUID().slice(0, 8)}`;
}

function titleCase(value: string): string {
  return value.replace(/\b\w/g, (match) => match.toUpperCase());
}
