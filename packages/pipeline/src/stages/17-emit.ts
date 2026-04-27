import { readFile, readdir, stat } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Stage } from '@skeed/contracts';
import {
  checkAssets,
  checkDrift,
  checkForbiddenPatterns,
  hasBlockingViolation,
  judgeRubric,
  scrubPii,
} from '@skeed/guards';
import { ROUTE_TEMPLATES } from './route-templates.js';
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

    // Backend API routes (from BackendPlan.apiRoutes)
    for (const route of backend?.apiRoutes ?? []) {
      const template = ROUTE_TEMPLATES[route.template];
      if (template) {
        files.push({ path: route.path, contents: template, encoding: 'utf8', overwrite: true });
      }
    }

    // .env.example from envVars
    if ((backend?.envVars ?? []).length > 0) {
      const envLines = (backend?.envVars ?? []).map((v) => `${v.name}=${v.example ?? ''}`);
      files.push({ path: '.env.example', contents: envLines.join('\n') + '\n', encoding: 'utf8', overwrite: true });
    }

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

    // ── Guard pass ─────────────────────────────────────────────────────────
    const warnings: string[] = templateRoot ? [] : ['template root not found; using composed-only output'];
    const demographic = state.classification?.candidates[0]?.demographic ?? 'productivity';
    // findLast — composed overlay wins over template
    const homeFile = [...files].reverse().find((f) => f.path === 'app/page.tsx');
    const globalsFile = [...files].reverse().find((f) => f.path === 'app/globals.css');
    const pageBody = homeFile?.contents ?? '';

    // Forbidden patterns
    const forbidden = checkForbiddenPatterns({ text: pageBody, demographic });
    for (const v of forbidden) {
      warnings.push(`forbidden-pattern[${v.pattern.severity}] ${v.pattern.reason} → "${v.match}"`);
    }
    if (hasBlockingViolation(forbidden)) {
      warnings.push('one or more BLOCKING forbidden-pattern violations were emitted; review skeed.config.json');
    }

    // PII scrub
    const pii = scrubPii(pageBody + ' ' + (state.userStories ?? []).map((s) => s.iWantTo).join(' '));
    for (const h of pii.hits) {
      warnings.push(`pii[${h.kind}] detected; consider redacting "${h.value}"`);
    }

    // Asset checks
    const assetIssues = checkAssets(
      (state.resolvedAssets ?? []).map((a) => {
        const alt = a.relativePath.endsWith('logo.svg')
          ? state.logoChosen?.altText
          : a.relativePath.endsWith('hero.svg')
            ? `Hero illustration for ${state.intent?.jobToBeDone ?? state.prompt}`
            : undefined;
        return {
          id: a.relativePath,
          mime: a.relativePath.endsWith('.svg') ? 'image/svg+xml' : 'application/octet-stream',
          contents: a.contents,
          ...(alt ? { altText: alt } : {}),
        };
      }),
    );
    for (const i of assetIssues) warnings.push(`asset[${i.kind}] ${i.asset}: ${i.message}`);

    // Rubric — pass real asset alt texts (extracted via aria-label match)
    const altsCollected = (state.resolvedAssets ?? []).map((a) => {
      const m = a.contents.match(/aria-label="([^"]+)"/);
      return m?.[1] ?? a.slot;
    });
    const rubric = judgeRubric({
      demographic,
      landingTsx: pageBody,
      globalsCss: globalsFile?.contents ?? '',
      assetAlts: altsCollected,
      backendStack: backend?.stack ?? ['none'],
    });
    if (!rubric.passes) {
      warnings.push(`rubric: composite ${rubric.composite}/10 below threshold (failing axes: ${rubric.criteria.filter((c) => c.score < 7).map((c) => c.id).join(', ')})`);
    }

    // Drift guard
    const drift = checkDrift({
      spec: { demographic, brandPrimary: state.designSystem?.palette.primary ?? '#4F46E5', backendStack: backend?.stack ?? [] },
      files: files.map((f) => ({ path: f.path, contents: f.contents })),
    });
    for (const d of drift.driftedFromSpec) {
      warnings.push(`drift[${d.field}] expected "${d.expected}" not found in emit`);
    }

    return {
      manifestVersion: '0.1.0',
      files,
      postInstall: [],
      warnings,
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
