import { readFile, readdir, stat } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Stage } from '@skeed/contracts';
import { PipelineState, Scaffold } from './state.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Stage 17 — Templated Next.js scaffold manifest.
 * Reads packages/cli/templates/next-app/, applies replacements + composed pages,
 * emits a Scaffold ready to write to disk.
 */
export const stage_17_emit: Stage<PipelineState, Scaffold> = {
  name: '17-emit',
  version: '0.1.0',
  inputSchema: PipelineState,
  outputSchema: Scaffold,
  cacheable: false,
  async run(state) {
    const projectName = state.intent?.jobToBeDone?.replace(/^Build:\s*/, '').trim() || 'skeed-app';
    const slug = slugify(projectName) || 'skeed-app';
    const ds = state.designSystem;
    const backend = state.backendPlan;

    const templateRoot = await resolveTemplateRoot();
    const templateFiles = templateRoot ? await walk(templateRoot) : [];
    const files: Scaffold['files'] = [];

    for (const abs of templateFiles) {
      const rel = relative(templateRoot ?? '', abs).replace(/\\/g, '/');
      const raw = await readFile(abs, 'utf8');
      const out = applyMustache(raw, {
        APP_NAME: slug,
        APP_TITLE: projectName,
        DEPS: depsBlock(backend),
        SKEED_BRAND: ds?.palette.primary ?? '#4F46E5',
        SKEED_FG: ds?.palette.neutral ?? '#0F172A',
      });
      files.push({ path: rel, contents: out, encoding: 'utf8', overwrite: true });
    }

    // Composed pages overlay
    const home = state.composedPages?.find((p) => p.pageId === 'home');
    if (home) files.push({ path: 'app/page.tsx', contents: home.tsx, encoding: 'utf8', overwrite: true });
    const layout = state.composedPages?.find((p) => p.pageId === '_layout');
    if (layout) files.push({ path: 'app/layout.tsx', contents: layout.tsx, encoding: 'utf8', overwrite: true });
    const globals = state.composedPages?.find((p) => p.pageId === '_globals');
    if (globals) files.push({ path: 'app/globals.css', contents: globals.tsx, encoding: 'utf8', overwrite: true });

    // Assets
    for (const asset of state.resolvedAssets ?? []) {
      files.push({
        path: asset.relativePath,
        contents: asset.contents,
        encoding: asset.encoding,
        overwrite: true,
      });
    }

    // Skeed config trace
    files.push({
      path: 'skeed.config.json',
      contents: JSON.stringify(
        {
          version: '0.1.0',
          generatedAt: new Date().toISOString(),
          prompt: state.prompt,
          demographic: state.classification?.candidates[0]?.demographic,
          niche: state.classification?.candidates[0]?.niche,
          backendStack: backend?.stack ?? ['none'],
        },
        null,
        2,
      ),
      encoding: 'utf8',
      overwrite: true,
    });

    return {
      manifestVersion: '0.1.0',
      files,
      postInstall: [],
      warnings: templateRoot ? [] : ['template root not found; using composed-only output'],
    };
  },
};

function depsBlock(backend: PipelineState['backendPlan']): string {
  const extra = (backend?.npmPackages ?? []).map((p) => `    "${p}": "*"`);
  if (extra.length === 0) return '';
  return ',\n' + extra.join(',\n');
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function applyMustache(src: string, vars: Record<string, string>): string {
  return src.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => vars[k] ?? '');
}

async function resolveTemplateRoot(): Promise<string | null> {
  const candidates = [
    join(__dirname, '..', '..', '..', 'cli', 'templates', 'next-app'),
    join(__dirname, '..', '..', '..', '..', 'cli', 'templates', 'next-app'),
    join(__dirname, '..', '..', '..', '..', 'packages', 'cli', 'templates', 'next-app'),
  ];
  for (const c of candidates) {
    try {
      const s = await stat(c);
      if (s.isDirectory()) return c;
    } catch {}
  }
  return null;
}

async function walk(root: string): Promise<string[]> {
  const out: string[] = [];
  const stack = [root];
  while (stack.length > 0) {
    const dir = stack.pop();
    if (!dir) break;
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const abs = join(dir, entry.name);
      if (entry.isDirectory()) stack.push(abs);
      else if (entry.isFile()) out.push(abs);
    }
  }
  return out;
}
