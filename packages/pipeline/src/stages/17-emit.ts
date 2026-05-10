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
        DEPS: depsBlock(backend, state.selectedComponents ?? []),
        SKEED_BRAND: ds?.palette.primary ?? '#4F46E5',
        SKEED_FG: ds?.palette.neutral ?? '#0F172A',
      });
      files.push({ path: rel, contents: out, encoding: 'utf8', overwrite: true });
    }

    // Composed pages overlay
    for (const page of state.composedPages?.filter((p) => !p.pageId.startsWith('_')) ?? []) {
      files.push({
        path: appPathForRoute(page.route),
        contents: page.tsx,
        encoding: 'utf8',
        overwrite: true,
      });
    }
    const layout = state.composedPages?.find((p) => p.pageId === '_layout');
    if (layout)
      files.push({
        path: 'app/layout.tsx',
        contents: layout.tsx,
        encoding: 'utf8',
        overwrite: true,
      });
    const globals = state.composedPages?.find((p) => p.pageId === '_globals');
    if (globals)
      files.push({
        path: 'app/globals.css',
        contents: globals.tsx,
        encoding: 'utf8',
        overwrite: true,
      });
    const sections = state.composedPages?.find((p) => p.pageId === '_sections');
    if (sections)
      files.push({
        path: 'app/components/sections.tsx',
        contents: sections.tsx,
        encoding: 'utf8',
        overwrite: true,
      });
    for (const component of state.selectedComponents ?? []) {
      files.push({
        path: `app/components/skeed/${component.fileName}`,
        contents: component.source,
        encoding: 'utf8',
        overwrite: true,
      });
    }
    if ((state.selectedComponents ?? []).length > 0) {
      files.push({
        path: 'app/lib/cn.ts',
        contents: `export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}
`,
        encoding: 'utf8',
        overwrite: true,
      });
    }
    files.push({
      path: 'skeed.tailwind.ts',
      contents: renderLocalTailwindPreset(state),
      encoding: 'utf8',
      overwrite: true,
    });

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
      files.push({
        path: '.env.example',
        contents: `${envLines.join('\n')}\n`,
        encoding: 'utf8',
        overwrite: true,
      });
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
    const warnings: string[] = templateRoot
      ? []
      : ['template root not found; using composed-only output'];
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
      warnings.push(
        'one or more BLOCKING forbidden-pattern violations were emitted; review skeed.config.json',
      );
    }

    // PII scrub
    const pii = scrubPii(
      `${pageBody} ${(state.userStories ?? []).map((s) => s.iWantTo).join(' ')}`,
    );
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
        const altText = a.altText ?? alt;
        return {
          id: a.relativePath,
          mime: a.relativePath.endsWith('.svg') ? 'image/svg+xml' : 'application/octet-stream',
          contents: a.contents,
          ...(altText ? { altText } : {}),
        };
      }),
    );
    for (const i of assetIssues) warnings.push(`asset[${i.kind}] ${i.asset}: ${i.message}`);

    // Rubric — pass real asset alt texts (extracted via aria-label match)
    const altsCollected = (state.resolvedAssets ?? []).map((a) => {
      const m = a.contents.match(/aria-label="([^"]+)"/);
      return a.altText ?? m?.[1] ?? a.slot;
    });
    const rubric = judgeRubric({
      demographic,
      landingTsx: pageBody,
      globalsCss: globalsFile?.contents ?? '',
      assetAlts: altsCollected,
      backendStack: backend?.stack ?? ['none'],
    });
    if (!rubric.passes) {
      warnings.push(
        `rubric: composite ${rubric.composite}/10 below threshold (failing axes: ${rubric.criteria
          .filter((c) => c.score < 7)
          .map((c) => c.id)
          .join(', ')})`,
      );
    }

    // Drift guard
    const drift = checkDrift({
      spec: {
        demographic,
        brandPrimary: state.designSystem?.palette.primary ?? '#4F46E5',
        backendStack: backend?.stack ?? [],
      },
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

function depsBlock(
  backend: PipelineState['backendPlan'],
  selectedComponents: NonNullable<PipelineState['selectedComponents']>,
): string {
  const dependencies = unique([
    ...(backend?.npmPackages ?? []),
    ...selectedComponents.flatMap((component) =>
      Array.isArray(component.manifest.dependencies) ? component.manifest.dependencies : [],
    ),
  ]).filter((name) => !isTemplateDependency(name));
  const extra = dependencies.map((p) => `    "${p}": "*"`);
  if (extra.length === 0) return '';
  return `,\n${extra.join(',\n')}`;
}

function isTemplateDependency(name: string): boolean {
  return new Set(['next', 'react', 'react-dom', 'tailwindcss', 'postcss', 'autoprefixer']).has(
    name,
  );
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function renderLocalTailwindPreset(state: PipelineState): string {
  const ds = state.designSystem;
  const tone = motionToneFor(state.classification?.candidates[0]?.demographic);
  const duration = durationCaps(tone, ds?.motion.duration);
  const brand = ds?.palette.primary ?? '#4F46E5';
  const accent = ds?.palette.accent ?? brand;
  const fg = ds?.palette.neutral ?? '#0F172A';
  const radius = `${ds?.radius?.[1] ?? 8}px`;
  const easing = ds?.motion.easing.standard ?? 'cubic-bezier(.2,.8,.2,1)';
  const typography = typographyFor(state.classification?.candidates[0]?.demographic);
  return `// Generated by Skeed. Mirrors @skeed/tailwind so this scaffold works before package publish.
// @ts-nocheck
const durations = ${JSON.stringify(duration)};
const typography = ${JSON.stringify(typography, null, 2)};

export const skeedTailwindPreset = {
  theme: {
    extend: {
      colors: {
        skeed: {
          brand: 'var(--skeed-brand)',
          accent: 'var(--skeed-accent)',
          bg: 'var(--skeed-bg)',
          fg: 'var(--skeed-fg)',
          muted: 'var(--skeed-muted)',
          border: 'var(--skeed-border)',
          success: 'var(--skeed-success)',
          danger: 'var(--skeed-danger)'
        }
      },
      borderRadius: {
        skeed: 'var(--skeed-radius)'
      },
      fontFamily: {
        'skeed-body': 'var(--skeed-font-body-family)',
        'skeed-display': 'var(--skeed-font-display-family)',
        'skeed-mono': 'var(--skeed-font-mono-family)'
      },
      fontSize: {
        'skeed-hero': [typography.hero.size, { lineHeight: typography.hero.lineHeight, letterSpacing: typography.hero.letterSpacing, fontWeight: typography.hero.weight }],
        'skeed-title': [typography.title.size, { lineHeight: typography.title.lineHeight, letterSpacing: typography.title.letterSpacing, fontWeight: typography.title.weight }],
        'skeed-section': [typography.section.size, { lineHeight: typography.section.lineHeight, letterSpacing: typography.section.letterSpacing, fontWeight: typography.section.weight }],
        'skeed-body': [typography.body.size, { lineHeight: typography.body.lineHeight, letterSpacing: typography.body.letterSpacing, fontWeight: typography.body.weight }],
        'skeed-caption': [typography.caption.size, { lineHeight: typography.caption.lineHeight, letterSpacing: typography.caption.letterSpacing, fontWeight: typography.caption.weight }]
      },
      transitionDuration: {
        'skeed-fast': durations.fast,
        'skeed-base': durations.base,
        'skeed-slow': durations.slow
      },
      transitionTimingFunction: {
        skeed: 'var(--skeed-ease)'
      },
      keyframes: {
        'skeed-fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'skeed-slide-up': {
          from: { opacity: '0', transform: 'translate3d(0, 10px, 0)' },
          to: { opacity: '1', transform: 'translate3d(0, 0, 0)' }
        }
      },
      animation: {
        'skeed-fade-in': 'skeed-fade-in var(--skeed-motion-base) var(--skeed-ease) both',
        'skeed-slide-up': 'skeed-slide-up var(--skeed-motion-base) var(--skeed-ease) both'
      }
    }
  },
  plugins: [
    ({ addBase, addUtilities }) => {
      addBase({
        ':root': {
          '--skeed-brand': '${brand}',
          '--skeed-accent': '${accent}',
          '--skeed-bg': '#ffffff',
          '--skeed-fg': '${fg}',
          '--skeed-muted': 'color-mix(in srgb, ${fg} 68%, white)',
          '--skeed-border': 'color-mix(in srgb, ${fg} 14%, transparent)',
          '--skeed-success': '#15803d',
          '--skeed-danger': '#b91c1c',
          '--skeed-radius': '${radius}',
          '--skeed-ease': '${easing}',
          '--skeed-motion-fast': durations.fast,
          '--skeed-motion-base': durations.base,
          '--skeed-motion-slow': durations.slow,
          '--skeed-font-body-family': typography.fonts.body,
          '--skeed-font-display-family': typography.fonts.display,
          '--skeed-font-mono-family': typography.fonts.mono,
          '--skeed-type-hero-size': typography.hero.size,
          '--skeed-type-hero-line': typography.hero.lineHeight,
          '--skeed-type-hero-tracking': typography.hero.letterSpacing,
          '--skeed-type-hero-weight': typography.hero.weight,
          '--skeed-type-title-size': typography.title.size,
          '--skeed-type-title-line': typography.title.lineHeight,
          '--skeed-type-title-tracking': typography.title.letterSpacing,
          '--skeed-type-title-weight': typography.title.weight,
          '--skeed-type-section-size': typography.section.size,
          '--skeed-type-section-line': typography.section.lineHeight,
          '--skeed-type-section-tracking': typography.section.letterSpacing,
          '--skeed-type-section-weight': typography.section.weight,
          '--skeed-type-body-size': typography.body.size,
          '--skeed-type-body-line': typography.body.lineHeight,
          '--skeed-type-body-tracking': typography.body.letterSpacing,
          '--skeed-type-body-weight': typography.body.weight,
          '--skeed-type-caption-size': typography.caption.size,
          '--skeed-type-caption-line': typography.caption.lineHeight,
          '--skeed-type-caption-tracking': typography.caption.letterSpacing,
          '--skeed-type-caption-weight': typography.caption.weight,
          '--skeed-eyebrow-tracking': typography.eyebrowTracking,
          '--skeed-cta-radius': typography.cta.radius,
          '--skeed-cta-min-height': typography.cta.minHeight,
          '--skeed-cta-padding-x': typography.cta.paddingX,
          '--skeed-cta-shadow': typography.cta.shadow,
          '--skeed-cta-primary-weight': typography.cta.primaryWeight,
          '--skeed-cta-secondary-weight': typography.cta.secondaryWeight
        },
        '@media (prefers-reduced-motion: reduce)': {
          '*, ::before, ::after': {
            'animation-duration': '1ms !important',
            'animation-iteration-count': '1 !important',
            'scroll-behavior': 'auto !important',
            'transition-duration': '1ms !important'
          }
        }
      });
      addUtilities({
        '.skeed-type-page': {
          color: 'var(--skeed-fg)',
          'font-family': 'var(--skeed-font-body-family)',
          'font-size': 'var(--skeed-type-body-size)',
          'line-height': 'var(--skeed-type-body-line)',
          'letter-spacing': 'var(--skeed-type-body-tracking)',
          'font-weight': 'var(--skeed-type-body-weight)'
        },
        '.skeed-type-hero': {
          'font-family': 'var(--skeed-font-display-family)',
          'font-size': 'var(--skeed-type-hero-size)',
          'line-height': 'var(--skeed-type-hero-line)',
          'letter-spacing': 'var(--skeed-type-hero-tracking)',
          'font-weight': 'var(--skeed-type-hero-weight)'
        },
        '.skeed-type-title': {
          'font-family': 'var(--skeed-font-display-family)',
          'font-size': 'var(--skeed-type-title-size)',
          'line-height': 'var(--skeed-type-title-line)',
          'letter-spacing': 'var(--skeed-type-title-tracking)',
          'font-weight': 'var(--skeed-type-title-weight)'
        },
        '.skeed-type-body': {
          'font-family': 'var(--skeed-font-body-family)',
          'font-size': 'var(--skeed-type-body-size)',
          'line-height': 'var(--skeed-type-body-line)',
          'letter-spacing': 'var(--skeed-type-body-tracking)',
          'font-weight': 'var(--skeed-type-body-weight)'
        },
        '.skeed-eyebrow': {
          color: 'var(--skeed-accent)',
          'font-size': 'var(--skeed-type-caption-size)',
          'font-weight': '700',
          'letter-spacing': 'var(--skeed-eyebrow-tracking)',
          'text-transform': 'uppercase'
        },
        '.skeed-cta-primary': {
          background: 'var(--skeed-brand)',
          'border-radius': 'var(--skeed-cta-radius)',
          color: 'white',
          display: 'inline-flex',
          'align-items': 'center',
          'justify-content': 'center',
          'min-height': 'var(--skeed-cta-min-height)',
          padding: '0 var(--skeed-cta-padding-x)',
          'font-weight': 'var(--skeed-cta-primary-weight)',
          'box-shadow': 'var(--skeed-cta-shadow)'
        },
        '.skeed-cta-secondary': {
          background: 'white',
          border: '1px solid var(--skeed-border)',
          'border-radius': 'var(--skeed-cta-radius)',
          color: 'var(--skeed-fg)',
          display: 'inline-flex',
          'align-items': 'center',
          'justify-content': 'center',
          'min-height': 'var(--skeed-cta-min-height)',
          padding: '0 var(--skeed-cta-padding-x)',
          'font-weight': 'var(--skeed-cta-secondary-weight)'
        },
        '.skeed-focus-ring': {
          outline: '2px solid transparent',
          'outline-offset': '2px',
          'box-shadow': '0 0 0 3px color-mix(in srgb, var(--skeed-brand) 32%, transparent)'
        },
        '.skeed-hover-lift': {
          transform: 'translate3d(0,0,0)',
          transition: 'transform var(--skeed-motion-base) var(--skeed-ease), box-shadow var(--skeed-motion-base) var(--skeed-ease)',
          'will-change': 'transform'
        },
        '.skeed-hover-lift:hover': {
          transform: 'translate3d(0,-2px,0)',
          'box-shadow': '0 14px 30px rgba(15,23,42,.12)'
        },
        '.skeed-press-soft': {
          transition: 'transform var(--skeed-motion-fast) var(--skeed-ease)'
        },
        '.skeed-press-soft:active': {
          transform: 'scale(.985)'
        },
        '.skeed-enter-fade': {
          animation: 'skeed-fade-in var(--skeed-motion-base) var(--skeed-ease) both'
        },
        '.skeed-enter-slide-up': {
          animation: 'skeed-slide-up var(--skeed-motion-base) var(--skeed-ease) both'
        },
        '.skeed-state-success': {
          color: 'var(--skeed-success)',
          'border-color': 'color-mix(in srgb, var(--skeed-success) 28%, transparent)',
          background: 'color-mix(in srgb, var(--skeed-success) 8%, transparent)'
        },
        '.skeed-state-error': {
          color: 'var(--skeed-danger)',
          'border-color': 'color-mix(in srgb, var(--skeed-danger) 28%, transparent)',
          background: 'color-mix(in srgb, var(--skeed-danger) 8%, transparent)'
        }
      }, ['responsive', 'hover', 'focus-visible']);
    }
  ]
};
`;
}

function motionToneFor(demographic: string | undefined): 'calm' | 'precise' | 'premium' {
  const key = demographic?.toLowerCase().replace(/[\s-]+/g, '_') ?? '';
  if (
    ['health', 'gov', 'education', 'mental_wellness', 'clinical', 'kids', 'classic'].includes(key)
  ) {
    return 'calm';
  }
  if (
    [
      'erp',
      'sales_crm',
      'productivity',
      'monitoring',
      'fintech',
      'marketplace',
      'listings',
    ].includes(key)
  )
    return 'precise';
  return 'premium';
}

function typographyFor(demographic: string | undefined) {
  const key = demographic?.toLowerCase().replace(/[\s-]+/g, '_') ?? '';
  const shared = {
    fonts: {
      body: 'Inter, Aptos, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      display:
        'Inter, Aptos Display, Aptos, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      mono: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace',
    },
    eyebrowTracking: '.06em',
    cta: {
      radius: '8px',
      minHeight: '2.5rem',
      paddingX: '1rem',
      shadow: '0 8px 18px rgba(15, 23, 42, .12)',
      primaryWeight: '650',
      secondaryWeight: '600',
    },
  };
  const step = (size: string, lineHeight: string, letterSpacing: string, weight: string) => ({
    letterSpacing,
    lineHeight,
    size,
    weight,
  });

  if (['health', 'wellness', 'fitness', 'mental_wellness'].includes(key)) {
    return {
      ...shared,
      fonts: {
        ...shared.fonts,
        body: 'Aptos, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        display:
          'Aptos Display, Aptos, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      },
      hero: step('clamp(2.25rem, 5vw, 4.5rem)', '1.04', '-0.01em', '720'),
      title: step('clamp(1.75rem, 3vw, 2.75rem)', '1.12', '-0.006em', '680'),
      section: step('clamp(1.25rem, 2vw, 1.625rem)', '1.25', '0', '650'),
      body: step('1rem', '1.72', '0', '400'),
      caption: step('.875rem', '1.5', '0', '500'),
      cta: { ...shared.cta, minHeight: '2.75rem', paddingX: '1.125rem', radius: '10px' },
    };
  }

  if (['productivity', 'developer_tools', 'crm', 'sales_crm', 'monitoring', 'erp'].includes(key)) {
    return {
      ...shared,
      eyebrowTracking: '.04em',
      hero: step('clamp(2rem, 4vw, 4rem)', '.98', '-0.018em', '760'),
      title: step('clamp(1.5rem, 2.5vw, 2.5rem)', '1.08', '-0.01em', '720'),
      section: step('clamp(1.125rem, 1.6vw, 1.5rem)', '1.22', '0', '680'),
      body: step('.9375rem', '1.58', '0', '400'),
      caption: step('.8125rem', '1.42', '0', '520'),
      cta: {
        ...shared.cta,
        minHeight: '2.375rem',
        paddingX: '.875rem',
        radius: '7px',
        shadow: '0 6px 14px rgba(15, 23, 42, .10)',
      },
    };
  }

  if (['ai', 'assistant', 'voice', 'creator_tools'].includes(key)) {
    return {
      ...shared,
      fonts: {
        ...shared.fonts,
        display:
          'Inter Tight, Inter, Aptos Display, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      },
      hero: step('clamp(2.75rem, 7vw, 5.5rem)', '.94', '-0.026em', '780'),
      title: step('clamp(1.875rem, 3.25vw, 3.125rem)', '1.02', '-0.016em', '740'),
      section: step('clamp(1.25rem, 2vw, 1.75rem)', '1.16', '-0.004em', '690'),
      body: step('1rem', '1.62', '0', '400'),
      caption: step('.875rem', '1.44', '0', '520'),
      cta: {
        ...shared.cta,
        minHeight: '2.75rem',
        paddingX: '1.125rem',
        radius: '12px',
        shadow: '0 12px 28px rgba(79, 70, 229, .22)',
        primaryWeight: '700',
      },
    };
  }

  if (['ai_apps', 'hightech', 'social'].includes(key)) {
    return {
      ...shared,
      fonts: {
        ...shared.fonts,
        display:
          'Inter Tight, Inter, Aptos Display, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      },
      hero: step('clamp(2.75rem, 7vw, 5.5rem)', '.94', '-0.026em', '780'),
      title: step('clamp(1.875rem, 3.25vw, 3.125rem)', '1.02', '-0.016em', '740'),
      section: step('clamp(1.25rem, 2vw, 1.75rem)', '1.16', '-0.004em', '690'),
      body: step('1rem', '1.62', '0', '400'),
      caption: step('.875rem', '1.44', '0', '520'),
      cta: {
        ...shared.cta,
        minHeight: '2.75rem',
        paddingX: '1.125rem',
        radius: '12px',
        shadow: '0 12px 28px rgba(79, 70, 229, .22)',
        primaryWeight: '700',
      },
    };
  }

  if (['kids', 'youth', 'gen_alpha'].includes(key)) {
    return {
      ...shared,
      fonts: {
        ...shared.fonts,
        body: 'Nunito, Aptos, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        display:
          'Nunito, Aptos Display, Aptos, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      },
      hero: step('clamp(2.5rem, 7vw, 5.25rem)', '1', '0', '800'),
      title: step('clamp(1.875rem, 3.5vw, 3rem)', '1.08', '0', '760'),
      section: step('clamp(1.375rem, 2.25vw, 1.875rem)', '1.18', '0', '720'),
      body: step('1.0625rem', '1.7', '0', '450'),
      caption: step('.875rem', '1.48', '0', '600'),
      cta: {
        ...shared.cta,
        minHeight: '3rem',
        paddingX: '1.25rem',
        radius: '14px',
        shadow: '0 12px 24px rgba(15, 23, 42, .14)',
        primaryWeight: '760',
        secondaryWeight: '680',
      },
    };
  }

  if (['classic', 'legal', 'religious', 'heritage', 'traditional'].includes(key)) {
    return {
      ...shared,
      fonts: {
        ...shared.fonts,
        display:
          'Georgia, "Iowan Old Style", "Times New Roman", Aptos Display, Aptos, ui-serif, serif',
      },
      eyebrowTracking: '.05em',
      hero: step('clamp(2.625rem, 5.8vw, 5.25rem)', '.98', '-0.012em', '640'),
      title: step('clamp(1.875rem, 3vw, 3rem)', '1.08', '-0.004em', '620'),
      section: step('clamp(1.25rem, 2vw, 1.75rem)', '1.26', '0', '620'),
      body: step('1rem', '1.76', '0', '400'),
      caption: step('.875rem', '1.5', '.01em', '540'),
      cta: {
        ...shared.cta,
        minHeight: '2.625rem',
        paddingX: '1.125rem',
        radius: '5px',
        shadow: '0 8px 18px rgba(15, 23, 42, .10)',
        primaryWeight: '640',
        secondaryWeight: '560',
      },
    };
  }

  if (['education', 'learning', 'students', 'teachers'].includes(key)) {
    return {
      ...shared,
      fonts: {
        ...shared.fonts,
        body: 'Atkinson Hyperlegible, Aptos, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        display:
          'Atkinson Hyperlegible, Aptos Display, Aptos, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      },
      hero: step('clamp(2.25rem, 5vw, 4.25rem)', '1.06', '-0.006em', '720'),
      title: step('clamp(1.75rem, 2.75vw, 2.75rem)', '1.14', '0', '690'),
      section: step('clamp(1.25rem, 2vw, 1.625rem)', '1.28', '0', '660'),
      body: step('1rem', '1.76', '0', '400'),
      caption: step('.875rem', '1.52', '0', '520'),
      cta: { ...shared.cta, minHeight: '2.75rem', paddingX: '1.125rem', radius: '9px' },
    };
  }

  if (['gov', 'government', 'public_sector', 'civic', 'nonprofit', 'military'].includes(key)) {
    return {
      ...shared,
      fonts: {
        ...shared.fonts,
        body: 'Source Sans 3, Aptos, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        display:
          'Source Sans 3, Aptos Display, Aptos, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      },
      hero: step('clamp(2rem, 4.5vw, 4rem)', '1.08', '0', '720'),
      title: step('clamp(1.625rem, 2.5vw, 2.5rem)', '1.16', '0', '690'),
      section: step('clamp(1.25rem, 1.8vw, 1.625rem)', '1.28', '0', '660'),
      body: step('1rem', '1.76', '0', '400'),
      caption: step('.875rem', '1.52', '0', '520'),
      cta: {
        ...shared.cta,
        minHeight: '2.75rem',
        radius: '6px',
        shadow: 'none',
        primaryWeight: '700',
      },
    };
  }

  if (['enterprise', 'finance', 'fintech', 'b2b', 'security'].includes(key)) {
    return {
      ...shared,
      eyebrowTracking: '.04em',
      hero: step('clamp(2rem, 4vw, 4rem)', '.98', '-0.016em', '760'),
      title: step('clamp(1.5rem, 2.5vw, 2.5rem)', '1.08', '-0.008em', '720'),
      section: step('clamp(1.125rem, 1.6vw, 1.5rem)', '1.24', '0', '680'),
      body: step('.9375rem', '1.58', '0', '400'),
      caption: step('.8125rem', '1.42', '0', '520'),
      cta: {
        ...shared.cta,
        minHeight: '2.375rem',
        paddingX: '.875rem',
        radius: '6px',
        shadow: '0 4px 10px rgba(15, 23, 42, .08)',
      },
    };
  }

  if (['luxury', 'fashion', 'hospitality', 'portfolio', 'premium'].includes(key)) {
    return {
      ...shared,
      fonts: {
        ...shared.fonts,
        display:
          'Optima, "Iowan Old Style", Aptos Display, Aptos, ui-serif, Georgia, Cambria, "Times New Roman", serif',
      },
      eyebrowTracking: '.08em',
      hero: step('clamp(3rem, 7vw, 6rem)', '.92', '-0.018em', '640'),
      title: step('clamp(2rem, 3.5vw, 3.5rem)', '1', '-0.01em', '620'),
      section: step('clamp(1.375rem, 2.25vw, 1.875rem)', '1.2', '0', '620'),
      body: step('1rem', '1.72', '0', '400'),
      caption: step('.8125rem', '1.5', '.04em', '560'),
      cta: {
        ...shared.cta,
        minHeight: '2.75rem',
        paddingX: '1.25rem',
        radius: '6px',
        shadow: '0 12px 30px rgba(15, 23, 42, .16)',
        primaryWeight: '620',
        secondaryWeight: '560',
      },
    };
  }

  return {
    ...shared,
    hero: step('clamp(2.5rem, 6vw, 5rem)', '.98', '-0.02em', '760'),
    title: step('clamp(1.875rem, 3vw, 3rem)', '1.05', '-0.012em', '720'),
    section: step('clamp(1.25rem, 2vw, 1.75rem)', '1.18', '0', '680'),
    body: step('1rem', '1.65', '0', '400'),
    caption: step('.875rem', '1.45', '0', '500'),
  };
}

function durationCaps(
  tone: 'calm' | 'precise' | 'premium',
  duration: Record<string, number> | undefined,
): { fast: string; base: string; slow: string } {
  const caps =
    tone === 'calm'
      ? { fast: 120, base: 180, slow: 220 }
      : tone === 'precise'
        ? { fast: 90, base: 140, slow: 180 }
        : { fast: 140, base: 220, slow: 320 };
  return {
    fast: `${Math.min(duration?.fast ?? caps.fast, caps.fast)}ms`,
    base: `${Math.min(duration?.base ?? caps.base, caps.base)}ms`,
    slow: `${Math.min(duration?.slow ?? caps.slow, caps.slow)}ms`,
  };
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

function appPathForRoute(route: string): string {
  const clean = route.replace(/^\/+|\/+$/g, '');
  if (!clean) return 'app/page.tsx';
  return `app/${clean}/page.tsx`;
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
