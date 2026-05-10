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
import {
  renderFontHeadLinks,
  themeToneForDemographic,
  themeTraceForDemographic,
  typographyForDemographic,
} from './theme-profile.js';

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
      const demographic = state.classification?.candidates[0]?.demographic;
      const typography = typographyForDemographic(demographic);
      const out = applyMustache(raw, {
        APP_NAME: slug,
        APP_TITLE: projectName,
        DEPS: depsBlock(backend, state.selectedComponents ?? []),
        SKEED_BRAND: ds?.palette.primary ?? '#4F46E5',
        SKEED_FG: ds?.palette.neutral ?? '#0F172A',
        SKEED_FONT_HEAD_LINKS: renderFontHeadLinks(typography),
        SKEED_FONT_BODY: typography.fonts.body,
        SKEED_FONT_DISPLAY: typography.fonts.display,
        SKEED_FONT_MONO: typography.fonts.mono,
        SKEED_TYPE_HERO_SIZE: typography.hero.size,
        SKEED_TYPE_HERO_LINE: typography.hero.lineHeight,
        SKEED_TYPE_HERO_TRACKING: typography.hero.letterSpacing,
        SKEED_TYPE_HERO_WEIGHT: typography.hero.weight,
        SKEED_TYPE_TITLE_SIZE: typography.title.size,
        SKEED_TYPE_TITLE_LINE: typography.title.lineHeight,
        SKEED_TYPE_TITLE_TRACKING: typography.title.letterSpacing,
        SKEED_TYPE_TITLE_WEIGHT: typography.title.weight,
        SKEED_TYPE_SECTION_SIZE: typography.section.size,
        SKEED_TYPE_SECTION_LINE: typography.section.lineHeight,
        SKEED_TYPE_SECTION_TRACKING: typography.section.letterSpacing,
        SKEED_TYPE_SECTION_WEIGHT: typography.section.weight,
        SKEED_TYPE_BODY_SIZE: typography.body.size,
        SKEED_TYPE_BODY_LINE: typography.body.lineHeight,
        SKEED_TYPE_BODY_TRACKING: typography.body.letterSpacing,
        SKEED_TYPE_BODY_WEIGHT: typography.body.weight,
        SKEED_TYPE_CAPTION_SIZE: typography.caption.size,
        SKEED_TYPE_CAPTION_LINE: typography.caption.lineHeight,
        SKEED_TYPE_CAPTION_TRACKING: typography.caption.letterSpacing,
        SKEED_TYPE_CAPTION_WEIGHT: typography.caption.weight,
        SKEED_EYEBROW_TRACKING: typography.eyebrowTracking,
        SKEED_CTA_RADIUS: typography.cta.radius,
        SKEED_CTA_MIN_HEIGHT: typography.cta.minHeight,
        SKEED_CTA_PADDING_X: typography.cta.paddingX,
        SKEED_CTA_SHADOW: typography.cta.shadow,
        SKEED_CTA_PRIMARY_WEIGHT: typography.cta.primaryWeight,
        SKEED_CTA_SECONDARY_WEIGHT: typography.cta.secondaryWeight,
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
          theme: themeTraceForDemographic(state.classification?.candidates[0]?.demographic),
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
  const tone = themeToneForDemographic(state.classification?.candidates[0]?.demographic);
  const duration = durationCaps(tone, ds?.motion.duration);
  const brand = ds?.palette.primary ?? '#4F46E5';
  const accent = ds?.palette.accent ?? brand;
  const fg = ds?.palette.neutral ?? '#0F172A';
  const radius = `${ds?.radius?.[1] ?? 8}px`;
  const easing = ds?.motion.easing.standard ?? 'cubic-bezier(.2,.8,.2,1)';
  const typography = typographyForDemographic(state.classification?.candidates[0]?.demographic);
  return `// Generated by Skeed. Mirrors @skeed/tailwind so this scaffold works before package publish.
// @ts-nocheck
const durations = ${JSON.stringify(duration)};
const typography = ${JSON.stringify(typography, null, 2)};
const colorPalette = {
  brand: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
    950: '#1e1b4b'
  },
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a'
  },
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    950: '#052e16'
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03'
  },
  danger: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    950: '#450a0a'
  },
  info: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49'
  }
};

function skeedColorTheme() {
  return Object.fromEntries(
    Object.entries(colorPalette).map(([family, shades]) => [
      family,
      Object.fromEntries(Object.keys(shades).map((shade) => [shade, \`var(--skeed-color-\${family}-\${shade})\`]))
    ])
  );
}

function skeedColorVariables() {
  const variables = {};
  for (const [family, shades] of Object.entries(colorPalette)) {
    for (const [shade, value] of Object.entries(shades)) {
      variables[\`--skeed-color-\${family}-\${shade}\`] = value;
    }
  }
  return variables;
}

const spacingScale = {
  0: '0rem',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  11: '2.75rem',
  12: '3rem',
  13: '3.25rem',
  14: '3.5rem',
  15: '3.75rem',
  16: '4rem',
  17: '4.25rem',
  18: '4.5rem',
  19: '4.75rem',
  20: '5rem',
  24: '6rem',
  28: '7rem',
  32: '8rem',
  36: '9rem',
  40: '10rem',
  48: '12rem',
  56: '14rem',
  64: '16rem',
  72: '18rem',
  80: '20rem'
};
const radiusScale = {
  0: '0rem',
  1: '0.125rem',
  2: '0.25rem',
  3: '0.375rem',
  4: '0.5rem',
  5: '0.625rem',
  6: '0.75rem',
  7: '0.875rem',
  8: '1rem',
  9: '1.25rem',
  10: '1.5rem',
  11: '2rem',
  12: '2.5rem',
  13: '3rem',
  14: '4rem',
  15: '5rem',
  16: '6rem',
  17: '8rem',
  18: '10rem',
  19: '12rem',
  20: '16rem',
  21: '20rem',
  22: '24rem',
  23: '32rem',
  24: '40rem',
  25: '48rem',
  26: '80rem',
  27: '160rem',
  28: '320rem',
  29: '640rem',
  30: '960rem',
  31: '9999px',
  9999: '9999px'
};
const shadowScale = {
  0: 'none',
  1: '0 1px 3px rgba(15, 23, 42, .12)',
  2: '0 8px 24px rgba(15, 23, 42, .14)',
  3: '0 16px 38px rgba(15, 23, 42, .16)',
  4: '0 24px 60px rgba(15, 23, 42, .18)'
};

function legacyTokenTheme(prefix, values, extra = {}) {
  return {
    ...Object.fromEntries(Object.entries(values).map(([key, value]) => [\`\${prefix}-\${key}\`, value])),
    ...extra
  };
}

export const skeedTailwindPreset = {
  theme: {
    extend: {
      colors: {
        skeed: {
          brand: 'var(--skeed-brand)',
          accent: 'var(--skeed-accent)',
          bg: 'var(--skeed-bg)',
          surface: 'var(--skeed-surface)',
          'surface-muted': 'var(--skeed-surface-muted)',
          fg: 'var(--skeed-fg)',
          muted: 'var(--skeed-muted)',
          border: 'var(--skeed-border)',
          success: 'var(--skeed-success)',
          warning: 'var(--skeed-warning)',
          danger: 'var(--skeed-danger)'
        },
        'skeed-color': skeedColorTheme()
      },
      spacing: legacyTokenTheme('skeed-spacing', spacingScale, {
        'skeed-spacing-xs': 'var(--skeed-spacing-xs)',
        'skeed-spacing-sm': 'var(--skeed-spacing-sm)',
        'skeed-spacing-md': 'var(--skeed-spacing-md)',
        'skeed-spacing-lg': 'var(--skeed-spacing-lg)',
        'skeed-spacing-xl': 'var(--skeed-spacing-xl)',
        'skeed-spacing-2xl': 'var(--skeed-spacing-2xl)',
        'skeed-density-cozy-gap': '.875rem',
        'skeed-density-cozy-padx': '1rem',
        'skeed-density-cozy-pady': '.75rem'
      }),
      borderRadius: {
        skeed: 'var(--skeed-radius)',
        'skeed-radius-sm': 'var(--skeed-radius-sm)',
        'skeed-radius-md': 'var(--skeed-radius-md)',
        'skeed-radius-lg': 'var(--skeed-radius-lg)',
        'skeed-radius-xl': 'var(--skeed-radius-xl)',
        ...legacyTokenTheme('skeed-radius', radiusScale)
      },
      boxShadow: {
        'skeed-shadow-sm': 'var(--skeed-shadow-sm)',
        'skeed-shadow-md': 'var(--skeed-shadow-md)',
        'skeed-shadow-lg': 'var(--skeed-shadow-lg)',
        'skeed-shadow-xl': 'var(--skeed-shadow-xl)',
        ...legacyTokenTheme('skeed-shadow', shadowScale)
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
        'skeed-slow': durations.slow,
        'skeed-motion-duration-fast': durations.fast,
        'skeed-motion-duration-normal': durations.base,
        'skeed-motion-duration-slow': durations.slow
      },
      transitionTimingFunction: {
        skeed: 'var(--skeed-ease)',
        'skeed-motion-easing-default': 'var(--skeed-ease)',
        'skeed-motion-easing-elegant': 'cubic-bezier(.16, 1, .3, 1)',
        'skeed-motion-easing-bounce': 'cubic-bezier(.34, 1.56, .64, 1)'
      },
      keyframes: {
        'skeed-fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'skeed-slide-up': {
          from: { opacity: '0', transform: 'translate3d(0, 10px, 0)' },
          to: { opacity: '1', transform: 'translate3d(0, 0, 0)' }
        },
        'skeed-soft-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.72' }
        }
      },
      animation: {
        'skeed-fade-in': 'skeed-fade-in var(--skeed-motion-base) var(--skeed-ease) both',
        'skeed-slide-up': 'skeed-slide-up var(--skeed-motion-base) var(--skeed-ease) both',
        'skeed-soft-pulse': 'skeed-soft-pulse var(--skeed-motion-slow) ease-in-out infinite'
      }
    }
  },
  plugins: [
    ({ addBase, addUtilities }) => {
      addBase({
        ':root': {
          ...skeedColorVariables(),
          '--skeed-brand': '${brand}',
          '--skeed-accent': '${accent}',
          '--skeed-bg': '#ffffff',
          '--skeed-surface': '#ffffff',
          '--skeed-surface-muted': '#f8fafc',
          '--skeed-fg': '${fg}',
          '--skeed-muted': 'color-mix(in srgb, ${fg} 68%, white)',
          '--skeed-border': 'color-mix(in srgb, ${fg} 14%, transparent)',
          '--skeed-success': '#15803d',
          '--skeed-warning': '#b45309',
          '--skeed-danger': '#b91c1c',
          '--skeed-brand-text-dark': 'color-mix(in srgb, ${brand} 52%, white)',
          '--skeed-accent-text-dark': 'color-mix(in srgb, ${accent} 52%, white)',
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
          '--skeed-cta-shadow-hover': typography.cta.shadow === 'none' ? 'none' : '0 16px 36px rgba(15, 23, 42, .16)',
          '--skeed-cta-primary-weight': typography.cta.primaryWeight,
          '--skeed-cta-secondary-weight': typography.cta.secondaryWeight,
          '--skeed-spacing-xs': '0.375rem',
          '--skeed-spacing-sm': '0.625rem',
          '--skeed-spacing-md': '1rem',
          '--skeed-spacing-lg': '1.5rem',
          '--skeed-spacing-xl': '2rem',
          '--skeed-spacing-2xl': '3rem',
          '--skeed-radius-sm': '0.375rem',
          '--skeed-radius-md': '${radius}',
          '--skeed-radius-lg': '1rem',
          '--skeed-radius-xl': '1.5rem',
          '--skeed-shadow-sm': '0 1px 2px rgba(15, 23, 42, .06)',
          '--skeed-shadow-md': '0 8px 24px rgba(15, 23, 42, .08)',
          '--skeed-shadow-lg': '0 16px 40px rgba(15, 23, 42, .12)',
          '--skeed-shadow-xl': '0 24px 60px rgba(15, 23, 42, .16)'
        },
        '.skeed-dark, [data-skeed-theme="dark"]': {
          '--skeed-bg': 'var(--skeed-color-neutral-950)',
          '--skeed-surface': 'var(--skeed-color-neutral-900)',
          '--skeed-surface-muted': 'var(--skeed-color-neutral-800)',
          '--skeed-fg': 'var(--skeed-color-neutral-50)',
          '--skeed-muted': 'var(--skeed-color-neutral-300)',
          '--skeed-border': 'rgba(255, 255, 255, .14)',
          '--skeed-success': 'var(--skeed-color-success-400)',
          '--skeed-warning': 'var(--skeed-color-warning-300)',
          '--skeed-danger': 'var(--skeed-color-danger-400)'
        },
        '.skeed-dark .bg-white, [data-skeed-theme="dark"] .bg-white': {
          'background-color': 'var(--skeed-surface)'
        },
        '.skeed-dark .bg-skeed-bg, .skeed-dark .bg-skeed-color-neutral-50, .skeed-dark .bg-skeed-color-neutral-100, [data-skeed-theme="dark"] .bg-skeed-bg, [data-skeed-theme="dark"] .bg-skeed-color-neutral-50, [data-skeed-theme="dark"] .bg-skeed-color-neutral-100': {
          'background-color': 'var(--skeed-surface-muted)'
        },
        '.skeed-dark .border-skeed-border, [data-skeed-theme="dark"] .border-skeed-border': {
          'border-color': 'var(--skeed-border)'
        },
        '.skeed-dark .border-white, [data-skeed-theme="dark"] .border-white': {
          'border-color': 'var(--skeed-surface)'
        },
        '.skeed-dark .text-skeed-brand, .skeed-dark .text-skeed-color-brand-600, .skeed-dark .text-skeed-color-brand-700, .skeed-dark .text-skeed-color-brand-800, .skeed-dark .text-skeed-color-brand-900, [data-skeed-theme="dark"] .text-skeed-brand, [data-skeed-theme="dark"] .text-skeed-color-brand-600, [data-skeed-theme="dark"] .text-skeed-color-brand-700, [data-skeed-theme="dark"] .text-skeed-color-brand-800, [data-skeed-theme="dark"] .text-skeed-color-brand-900': {
          color: 'var(--skeed-brand-text-dark)'
        },
        '.skeed-dark .text-skeed-accent, .skeed-dark .text-skeed-color-info-600, .skeed-dark .text-skeed-color-info-700, .skeed-dark .text-skeed-color-info-800, .skeed-dark .text-skeed-color-info-900, [data-skeed-theme="dark"] .text-skeed-accent, [data-skeed-theme="dark"] .text-skeed-color-info-600, [data-skeed-theme="dark"] .text-skeed-color-info-700, [data-skeed-theme="dark"] .text-skeed-color-info-800, [data-skeed-theme="dark"] .text-skeed-color-info-900': {
          color: 'var(--skeed-accent-text-dark)'
        },
        '.skeed-dark .text-skeed-color-neutral-700, .skeed-dark .text-skeed-color-neutral-800, .skeed-dark .text-skeed-color-neutral-900, .skeed-dark .text-skeed-color-neutral-950, [data-skeed-theme="dark"] .text-skeed-color-neutral-700, [data-skeed-theme="dark"] .text-skeed-color-neutral-800, [data-skeed-theme="dark"] .text-skeed-color-neutral-900, [data-skeed-theme="dark"] .text-skeed-color-neutral-950': {
          color: 'var(--skeed-fg)'
        },
        '.skeed-dark .text-skeed-color-neutral-400, .skeed-dark .text-skeed-color-neutral-500, .skeed-dark .text-skeed-color-neutral-600, [data-skeed-theme="dark"] .text-skeed-color-neutral-400, [data-skeed-theme="dark"] .text-skeed-color-neutral-500, [data-skeed-theme="dark"] .text-skeed-color-neutral-600': {
          color: 'var(--skeed-muted)'
        },
        '.skeed-dark .text-skeed-warning, .skeed-dark .text-skeed-color-warning-600, .skeed-dark .text-skeed-color-warning-700, .skeed-dark .text-skeed-color-warning-800, .skeed-dark .text-skeed-color-warning-900, [data-skeed-theme="dark"] .text-skeed-warning, [data-skeed-theme="dark"] .text-skeed-color-warning-600, [data-skeed-theme="dark"] .text-skeed-warning, [data-skeed-theme="dark"] .text-skeed-color-warning-700, [data-skeed-theme="dark"] .text-skeed-color-warning-800, [data-skeed-theme="dark"] .text-skeed-color-warning-900': {
          color: 'var(--skeed-warning)'
        },
        '.skeed-dark .bg-skeed-color-brand-50, .skeed-dark .bg-skeed-color-brand-100, .skeed-dark .bg-skeed-color-info-50, .skeed-dark .bg-skeed-color-info-100, [data-skeed-theme="dark"] .bg-skeed-color-brand-50, [data-skeed-theme="dark"] .bg-skeed-color-brand-100, [data-skeed-theme="dark"] .bg-skeed-color-info-50, [data-skeed-theme="dark"] .bg-skeed-color-info-100': {
          'background-color': 'color-mix(in srgb, var(--skeed-brand) 18%, var(--skeed-surface))'
        },
        '.skeed-dark .bg-skeed-warning, .skeed-dark .bg-skeed-color-warning-50, .skeed-dark .bg-skeed-color-warning-100, [data-skeed-theme="dark"] .bg-skeed-warning, [data-skeed-theme="dark"] .bg-skeed-color-warning-50, [data-skeed-theme="dark"] .bg-skeed-color-warning-100': {
          'background-color': 'color-mix(in srgb, var(--skeed-warning) 16%, var(--skeed-surface))'
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
          'font-weight': 'var(--skeed-type-body-weight)',
          'overflow-wrap': 'break-word',
          'word-break': 'normal'
        },
        '.skeed-smart-text': {
          hyphens: 'auto',
          'overflow-wrap': 'break-word',
          'word-break': 'normal'
        },
        '.skeed-smart-title': {
          hyphens: 'auto',
          'overflow-wrap': 'break-word',
          'text-wrap': 'balance',
          'word-break': 'normal'
        },
        '.skeed-adaptive-grid-2': {
          'grid-template-columns': 'repeat(auto-fit, minmax(min(16rem, 100%), 1fr))'
        },
        '.skeed-adaptive-grid-3': {
          'grid-template-columns': 'repeat(auto-fit, minmax(min(12rem, 100%), 1fr))'
        },
        '.skeed-adaptive-grid-dense': {
          'grid-template-columns': 'repeat(auto-fit, minmax(min(9rem, 100%), 1fr))'
        },
        '.skeed-type-hero': {
          'font-family': 'var(--skeed-font-display-family)',
          'font-size': 'var(--skeed-type-hero-size)',
          'line-height': 'var(--skeed-type-hero-line)',
          'letter-spacing': 'var(--skeed-type-hero-tracking)',
          'font-weight': 'var(--skeed-type-hero-weight)',
          hyphens: 'auto',
          'overflow-wrap': 'break-word',
          'text-wrap': 'balance',
          'word-break': 'normal'
        },
        '.skeed-type-title': {
          'font-family': 'var(--skeed-font-display-family)',
          'font-size': 'var(--skeed-type-title-size)',
          'line-height': 'var(--skeed-type-title-line)',
          'letter-spacing': 'var(--skeed-type-title-tracking)',
          'font-weight': 'var(--skeed-type-title-weight)',
          hyphens: 'auto',
          'overflow-wrap': 'break-word',
          'text-wrap': 'balance',
          'word-break': 'normal'
        },
        '.skeed-type-section': {
          'font-family': 'var(--skeed-font-display-family)',
          'font-size': 'var(--skeed-type-section-size)',
          'line-height': 'var(--skeed-type-section-line)',
          'letter-spacing': 'var(--skeed-type-section-tracking)',
          'font-weight': 'var(--skeed-type-section-weight)'
        },
        '.skeed-type-body': {
          'font-family': 'var(--skeed-font-body-family)',
          'font-size': 'var(--skeed-type-body-size)',
          'line-height': 'var(--skeed-type-body-line)',
          'letter-spacing': 'var(--skeed-type-body-tracking)',
          'font-weight': 'var(--skeed-type-body-weight)',
          'overflow-wrap': 'break-word',
          'word-break': 'normal'
        },
        '.skeed-type-caption': {
          'font-family': 'var(--skeed-font-body-family)',
          'font-size': 'var(--skeed-type-caption-size)',
          'line-height': 'var(--skeed-type-caption-line)',
          'letter-spacing': 'var(--skeed-type-caption-tracking)',
          'font-weight': 'var(--skeed-type-caption-weight)'
        },
        '.skeed-eyebrow': {
          color: 'var(--skeed-accent)',
          'font-size': 'var(--skeed-type-caption-size)',
          'font-weight': '700',
          'letter-spacing': 'var(--skeed-eyebrow-tracking)',
          'text-transform': 'uppercase'
        },
        '.skeed-sheen, .skeed-sheen-soft': {
          isolation: 'isolate',
          overflow: 'hidden',
          position: 'relative'
        },
        '.skeed-sheen::after, .skeed-sheen-soft::after': {
          content: '""',
          position: 'absolute',
          inset: '-2px',
          transform: 'translateX(-130%) skewX(-18deg)',
          transition: 'transform var(--skeed-motion-slow) var(--skeed-ease)',
          'pointer-events': 'none',
          'z-index': '0'
        },
        '.skeed-sheen::after': {
          background: 'linear-gradient(105deg, transparent 32%, rgba(255, 255, 255, .34) 48%, transparent 64%)'
        },
        '.skeed-sheen-soft::after': {
          background: 'linear-gradient(105deg, transparent 32%, color-mix(in srgb, var(--skeed-brand) 16%, transparent) 48%, transparent 64%)'
        },
        '.skeed-sheen:hover::after, .skeed-sheen-soft:hover::after': {
          transform: 'translateX(130%) skewX(-18deg)'
        },
        '.skeed-sheen > *, .skeed-sheen-soft > *': {
          position: 'relative',
          'z-index': '1'
        },
        '.skeed-cta-primary': {
          background: 'linear-gradient(135deg, var(--skeed-brand), color-mix(in srgb, var(--skeed-brand) 72%, var(--skeed-accent)))',
          'border-radius': 'var(--skeed-cta-radius)',
          color: 'white',
          display: 'inline-flex',
          'align-items': 'center',
          'justify-content': 'center',
          'min-height': 'var(--skeed-cta-min-height)',
          'max-width': '100%',
          isolation: 'isolate',
          overflow: 'hidden',
          padding: '0 var(--skeed-cta-padding-x)',
          position: 'relative',
          'font-weight': 'var(--skeed-cta-primary-weight)',
          'box-shadow': 'var(--skeed-cta-shadow)',
          'text-align': 'center',
          'text-wrap': 'balance',
          'white-space': 'normal',
          transition: 'transform var(--skeed-motion-fast) var(--skeed-ease), box-shadow var(--skeed-motion-base) var(--skeed-ease), background-color var(--skeed-motion-base) var(--skeed-ease)'
        },
        '.skeed-cta-primary::after': {
          background: 'linear-gradient(105deg, transparent 32%, rgba(255, 255, 255, .34) 48%, transparent 64%)',
          content: '""',
          position: 'absolute',
          inset: '-2px',
          transform: 'translateX(-130%) skewX(-18deg)',
          transition: 'transform var(--skeed-motion-slow) var(--skeed-ease)',
          'pointer-events': 'none'
        },
        '.skeed-cta-primary:hover': {
          'box-shadow': 'var(--skeed-cta-shadow-hover)'
        },
        '.skeed-cta-primary:hover::after': {
          transform: 'translateX(130%) skewX(-18deg)'
        },
        '.skeed-cta-primary:active': {
          transform: 'scale(.985)'
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
          'max-width': '100%',
          padding: '0 var(--skeed-cta-padding-x)',
          'font-weight': 'var(--skeed-cta-secondary-weight)',
          'text-align': 'center',
          'text-wrap': 'balance',
          'white-space': 'normal',
          transition: 'transform var(--skeed-motion-fast) var(--skeed-ease), border-color var(--skeed-motion-base) var(--skeed-ease), background-color var(--skeed-motion-base) var(--skeed-ease)'
        },
        '.skeed-cta-secondary:hover': {
          'border-color': 'color-mix(in srgb, var(--skeed-brand) 42%, var(--skeed-border))',
          background: 'color-mix(in srgb, var(--skeed-brand) 4%, white)'
        },
        '.skeed-cta-secondary:active': {
          transform: 'scale(.985)'
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
