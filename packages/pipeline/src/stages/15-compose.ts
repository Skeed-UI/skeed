import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { type LoadedArchetype, loadArchetypes } from '@skeed/archetypes-loader';
import { findRepoData } from '@skeed/asset-logo-svg';
import type { Stage } from '@skeed/contracts';
import { Catalog, type CatalogRow } from '@skeed/mcp-server';
import { PipelineState } from './state.js';
import {
  renderFontHeadLinks,
  typographyForDemographic,
  themeTraceForDemographic,
} from './theme-profile.js';

/**
 * Stage 15 - Compose. Uses the semantic Skeed registry when available and
 * emits actual selected component source into the generated app. The older
 * archetype-only renderer remains as a fallback for source checkouts without
 * a built registry.db.
 */
export const stage_15_compose: Stage<PipelineState, PipelineState> = {
  name: '15-compose',
  version: '0.4.0',
  inputSchema: PipelineState,
  outputSchema: PipelineState,
  cacheable: true,
  async run(state) {
    const ds = state.designSystem;
    const projectName = smartTruncate(
      state.intent?.jobToBeDone?.replace(/^Build:\s*/, '') ?? 'Skeed App',
      80,
    );
    const rawTagline = state.userStories?.[0]?.iWantTo ?? '';
    const tagline =
      rawTagline && !isGenericCopy(rawTagline)
        ? rawTagline
        : `A focused experience for a ${productSubject(projectName)} with clear next steps.`;
    const cta = ds?.voice.samples.cta ?? 'Get started';
    const selection = await createSelectionContext(state);
    const selectedSlots: SelectedSlotComponent[] = [];
    const selectedFiles = new Map<string, SelectedSkeedComponent>();

    const pages = state.siteMap?.pages.length
      ? state.siteMap.pages
      : [{ id: 'home', route: '/', purpose: tagline, slots: [] }];
    const composedPages = [];
    for (const page of pages) {
      composedPages.push({
        pageId: page.id,
        route: page.route,
        tsx: await pageFromSpec({
          projectName,
          tagline,
          cta,
          state,
          page,
          selection,
          selectedSlots,
          selectedFiles,
        }),
      });
    }
    selection.close();

    const selectedComponents = Array.from(selectedFiles.values());
    const sectionsComponent = renderSectionsLibrary(selectedSlots);
    const layoutTsx = renderLayout(
      projectName,
      tagline,
      state.classification?.candidates[0]?.demographic,
    );
    const globals = `${renderGlobals(state)}\n${renderSelectedTokenCss(selectedComponents)}\n${renderSkeedClassShim()}`;

    return {
      ...state,
      selectedComponents,
      composedPages: [
        ...composedPages,
        { pageId: '_layout', route: '__layout', tsx: layoutTsx },
        { pageId: '_globals', route: '__globals.css', tsx: globals },
        { pageId: '_sections', route: '__sections.tsx', tsx: sectionsComponent },
      ],
    };
  },
};

type PageSpec = NonNullable<PipelineState['siteMap']>['pages'][number];

interface SelectionContext {
  registry?: Catalog;
  archetypes: LoadedArchetype[];
  repoRoot: string;
  close: () => void;
}

interface SelectedSkeedComponent {
  id: string;
  fileName: string;
  exportName: string;
  source: string;
  tokensCss: string;
  manifest: {
    name?: string;
    archetypeId?: string;
    description?: string;
    assetSlots?: Array<{ role: string; type: string; required?: boolean }>;
    qualityTier?: string;
    dependencies?: string[];
    contentSlots?: Array<{ name: string; type: string; required?: boolean }>;
    performanceBudget?: {
      clientJsKb?: number;
      animationRuntime?: string;
      serverComponentSafe?: boolean;
    };
  };
  reasons: string[];
}

interface SelectedSlotComponent extends SelectedSkeedComponent {
  wrapperName: string;
  importAlias: string;
  role: string;
  intent: string;
}

interface PageBuildInput {
  projectName: string;
  tagline: string;
  cta: string;
  state: PipelineState;
  page: PageSpec;
  selection: SelectionContext;
  selectedSlots: SelectedSlotComponent[];
  selectedFiles: Map<string, SelectedSkeedComponent>;
}

async function createSelectionContext(_state: PipelineState): Promise<SelectionContext> {
  const demographicsRoot = findRepoData();
  const dataRoot = dirname(demographicsRoot);
  const repoRoot = dirname(dataRoot);
  const archetypesRoot = resolve(dataRoot, 'archetypes');
  const archetypes = await loadArchetypes({ dataRoot: archetypesRoot });
  const registryPath =
    process.env.SKEED_REGISTRY_PATH ?? resolve(repoRoot, 'packages/indexer/dist/registry.db');
  if (!existsSync(registryPath)) {
    return { archetypes: Array.from(archetypes.archetypes.values()), repoRoot, close: () => {} };
  }
  try {
    const registry = new Catalog(registryPath);
    return {
      registry,
      archetypes: Array.from(archetypes.archetypes.values()),
      repoRoot,
      close: () => registry.close(),
    };
  } catch {
    return { archetypes: Array.from(archetypes.archetypes.values()), repoRoot, close: () => {} };
  }
}

async function pageFromSpec(input: PageBuildInput): Promise<string> {
  const { projectName, tagline, cta, state, page } = input;
  const navItems = state.siteMap?.nav.items ?? [{ pageId: 'home', label: 'Home' }];
  const sections = page.slots.length > 0 ? page.slots : fallbackSlots(page.purpose);
  const slotEntries: Array<{
    wrapperName: string;
    role: string;
    intent: string;
    archetypeId: string;
  }> = [];

  for (const [index, slot] of sections.entries()) {
    const selected = await selectSlotComponent(input, slot, index);
    slotEntries.push({
      wrapperName: selected?.wrapperName ?? 'FallbackSection',
      role: slot.role,
      intent: slot.intent,
      archetypeId:
        selected?.manifest.archetypeId ??
        pickArchetype(input.selection.archetypes, slot.intent, state)?.manifest.id ??
        'card',
    });
  }

  const importNames = unique(slotEntries.map((entry) => entry.wrapperName));
  const importLine =
    importNames.length > 0
      ? `import { ${importNames.join(', ')} } from '@/app/components/sections';\n`
      : '';

  return `${importLine}export default function ${componentName(page.id)}Page() {
  return (
    <main className="skeed-type-page min-h-screen bg-[var(--skeed-bg)] text-[var(--skeed-fg)]">
      <header className="container mx-auto flex flex-wrap items-center justify-between gap-4 px-6 py-5">
        <a href="/" className="skeed-smart-title font-bold">${escapeHtml(projectName)}</a>
        <nav className="flex flex-wrap gap-6 text-sm opacity-80">
          ${navItems
            .map(
              (item) =>
                `<a href="${hrefFor(state, item.pageId)}" className="hover:underline">${escapeHtml(item.label)}</a>`,
            )
            .join('\n          ')}
        </nav>
      </header>
      ${slotEntries
        .map((entry, index) =>
          renderSlotComponent({
            ...entry,
            index,
            projectName,
            tagline,
            cta,
          }),
        )
        .join('\n      ')}
    </main>
  );
}
`;
}

async function selectSlotComponent(
  input: PageBuildInput,
  slot: PageSpec['slots'][number],
  index: number,
): Promise<SelectedSlotComponent | null> {
  const { selection, state, selectedSlots, selectedFiles, page } = input;
  if (!selection.registry) return null;

  const demographic = state.classification?.candidates[0]?.demographic;
  const density = densityFor(state.designSystem?.density);
  const preferred = preferredArchetypes(slot.role, slot.intent, index);
  const exactId = demographic
    ? preferred
        .map((archetypeId) => `${demographic}/${archetypeId}/${density}/default`)
        .find((componentId) => selection.registry?.getComponentContext(componentId))
    : undefined;
  const rows = selection.registry.semanticSearchComponents({
    intent: `${slot.role} ${slot.intent} ${preferred.join(' ')}`,
    ...(demographic ? { demographic } : {}),
    density,
    framework: 'react',
    limit: 30,
  });
  const row = exactId
    ? ({
        id: exactId,
        name: exactId,
        category: 'molecule',
        demographics: demographic ? [demographic] : [],
        summary: `Direct ${slot.role} component match`,
        thumbPath: null,
        score: 1,
        reasons: [`direct ${archetypeIdFromComponentId(exactId)} match for ${slot.role}`],
      } satisfies CatalogRow)
    : (rows.find((candidate) => preferred.includes(archetypeIdFromComponentId(candidate.id))) ??
      rows[0]);
  if (!row) return null;

  const component = await loadSelectedComponent(selection, row);
  if (!component) return null;
  selectedFiles.set(component.id, component);

  const wrapperName = `Skeed${componentName(`${page.id}-${index}`)}`;
  const selected: SelectedSlotComponent = {
    ...component,
    wrapperName,
    importAlias: `SkeedComponent${selectedSlots.length}`,
    role: slot.role,
    intent: slot.intent,
  };
  selectedSlots.push(selected);
  return selected;
}

async function loadSelectedComponent(
  selection: SelectionContext,
  row: CatalogRow,
): Promise<SelectedSkeedComponent | null> {
  const context = selection.registry?.getComponentContext(row.id) as {
    manifest: {
      name?: string;
      archetypeId?: string;
      source?: Array<{ path: string }>;
      description?: string;
      assetSlots?: Array<{ role: string; type: string; required?: boolean }>;
      qualityTier?: string;
      dependencies?: string[];
      contentSlots?: Array<{ name: string; type: string; required?: boolean }>;
      performanceBudget?: {
        clientJsKb?: number;
        animationRuntime?: string;
        serverComponentSafe?: boolean;
      };
    };
  } | null;
  if (!context) return null;

  const sourcePath = context.manifest.source?.[0]?.path;
  if (!sourcePath) return null;
  const absSourcePath = resolve(selection.repoRoot, sourcePath);
  const rawSource = await readFile(absSourcePath, 'utf8');
  const source = transformComponentSource(rawSource, context.manifest.performanceBudget);
  const tokensCssPath = absSourcePath.replace(/component\.tsx$/, 'tokens.css');
  const tokensCss = existsSync(tokensCssPath) ? await readFile(tokensCssPath, 'utf8') : '';
  const exportName = firstExportName(source);
  if (!exportName) return null;

  return {
    id: row.id,
    fileName: `${registryFileName(row.id)}.tsx`,
    exportName,
    source,
    tokensCss,
    manifest: context.manifest,
    reasons: row.reasons ?? [],
  };
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

function firstExportName(source: string): string | null {
  return (
    /export\s+const\s+([A-Z][A-Za-z0-9_]*)/.exec(source)?.[1] ??
    /export\s+function\s+([A-Z][A-Za-z0-9_]*)/.exec(source)?.[1] ??
    null
  );
}

function renderSlotComponent(input: {
  wrapperName: string;
  role: string;
  intent: string;
  index: number;
  projectName: string;
  tagline: string;
  cta: string;
  archetypeId: string;
}): string {
  const { wrapperName, role, intent, projectName, tagline, cta, archetypeId } = input;
  const copy = copyForSlot({ role, intent, projectName, tagline });
  const body = copy.body;
  const title = /hero/i.test(role) ? projectName : copy.heading;
  return `<${wrapperName} label="${escapeHtml(titleCase(role))}" heading="${escapeHtml(title)}" body="${escapeHtml(body || tagline)}" cta="${escapeHtml(cta)}" archetype="${escapeHtml(archetypeId)}" />`;
}

function copyForSlot(input: {
  role: string;
  intent: string;
  projectName: string;
  tagline: string;
}): { heading: string; body: string } {
  const role = input.role.toLowerCase();
  const intent = input.intent.trim();
  const project = input.projectName.trim();
  const subject = productSubject(project);
  const fallback =
    input.tagline && !isGenericCopy(input.tagline)
      ? input.tagline
      : `A focused experience for a ${subject} with clear next steps.`;
  if (intent && !isGenericCopy(intent)) {
    return { heading: titleCase(intent), body: intent };
  }
  if (/thank|thanks|success/.test(role) || /thank user/.test(intent)) {
    return {
      heading: 'Your next step is ready',
      body: `You are set up to continue with a ${subject} and pick up from a clear, useful starting point.`,
    };
  }
  if (/feature|benefit|outcome/.test(role)) {
    return {
      heading: 'Everything important stays easy to scan',
      body: `Track the work that matters, compare progress, and keep decisions moving without adding noise to a ${subject}.`,
    };
  }
  if (/cta|signup|start|join/.test(role)) {
    return {
      heading: 'Start with a guided setup',
      body: `Create your first plan, tune the details, and move into a ${subject} with less manual cleanup.`,
    };
  }
  return {
    heading: project,
    body: fallback,
  };
}

function isGenericCopy(value: string): boolean {
  return /\b(state value prop|thank user|understand the general value|list \d+ benefits|capture email|capture signup|invite the user|placeholder|lorem|todo|insert|generic|sample copy)\b/i.test(
    value,
  );
}

function productSubject(projectName: string): string {
  return projectName.trim().toLowerCase().replace(/^(a|an|the)\s+/, '');
}

function renderSectionsLibrary(selected: SelectedSlotComponent[]): string {
  const imports = selected.map(
    (item) =>
      `import { ${item.exportName} as ${item.importAlias} } from '@/app/components/skeed/${item.fileName.replace(/\.tsx$/, '')}';`,
  );

  return `'use client';

${imports.join('\n')}

interface SectionProps {
  label: string;
  heading: string;
  body: string;
  cta: string;
  archetype?: string;
}

${selected.map(renderSelectedWrapper).join('\n\n')}

function featureItems(seed: string): Array<{ id: string; title: string; description: string }> {
  const words = seed.split(/\\s+/).filter((word) => word.length > 3);
  return [
    words.slice(0, 3).join(' ') || 'Clear next step',
    words.slice(3, 6).join(' ') || 'Audience fit',
    words.slice(6, 9).join(' ') || 'Fast feedback',
  ].map((title, index) => ({
    id: \`feature-\${index + 1}\`,
    title: title.replace(/[-_]/g, ' ').replace(/\\b\\w/g, (match) => match.toUpperCase()),
    description: 'Focused around the core workflow with clear hierarchy, readable copy, and a calm next action.',
  }));
}

export function FallbackSection({ label, heading, body, cta, archetype }: SectionProps) {
  return (
    <section className="container mx-auto px-6 py-16" data-archetype={archetype}>
      <p className="skeed-eyebrow">{label}</p>
      <h2 className="skeed-type-title mt-3">{heading}</h2>
      <p className="skeed-type-body skeed-smart-text mt-4 max-w-2xl opacity-80">{body}</p>
      <a href="#" className="skeed-cta-primary skeed-press-soft mt-6">
        {cta}
      </a>
    </section>
  );
}
`;
}

function renderSelectedWrapper(slot: SelectedSlotComponent): string {
  const component = slot.importAlias;
  const archetype = slot.manifest.archetypeId ?? archetypeIdFromComponentId(slot.id);
  if (archetype === 'hero') {
    return `export function ${slot.wrapperName}({ heading, body, cta, archetype }: SectionProps) {
  return <${component} data-archetype={archetype} headline={heading} subtext={body} ctaLabel={cta} align="left" />;
}`;
  }
  if (archetype === 'feature-grid') {
    return `export function ${slot.wrapperName}({ label, heading, body, archetype }: SectionProps) {
  const features = featureItems(body);
  return <${component} data-archetype={archetype} title={heading} subtitle={label} features={features} columns={3} variant="numbered" />;
}`;
  }
  if (/signup-form|contact-form|login-form|password-reset/.test(archetype)) {
    return `export function ${slot.wrapperName}({ heading, body, archetype }: SectionProps) {
  return (
    <section className="container mx-auto px-6 py-16" data-archetype={archetype}>
      <${component}
        title={heading}
        subtitle={body}
        onSubmit={async (data: unknown) => console.info('skeed form submit', data)}
      />
    </section>
  );
}`;
  }
  if (archetype === 'chat-message') {
    return `export function ${slot.wrapperName}({ heading, body, archetype }: SectionProps) {
  return (
    <section className="container mx-auto px-6 py-16" data-archetype={archetype}>
      <h2 className="skeed-type-title mb-6">{heading}</h2>
      <${component} sender="Skeed" content={body} timestamp="Now" />
    </section>
  );
}`;
  }
  if (/card|callout|article|banner/.test(archetype)) {
    return `export function ${slot.wrapperName}({ label, heading, body, archetype }: SectionProps) {
  return (
    <section className="container mx-auto px-6 py-16" data-archetype={archetype}>
      <${component}>
        <p className="skeed-eyebrow">{label}</p>
        <h2 className="skeed-type-section mt-3">{heading}</h2>
        <p className="skeed-type-body skeed-smart-text mt-4 opacity-80">{body}</p>
      </${component}>
    </section>
  );
}`;
  }
  return `export function ${slot.wrapperName}({ label, heading, body, cta, archetype }: SectionProps) {
  return <FallbackSection label={label} heading={heading} body={body} cta={cta} archetype={archetype} />;
}`;
}

function renderLayout(projectName: string, tagline: string, demographic: string | undefined): string {
  const typography = typographyForDemographic(demographic);
  const fontLinks = renderFontHeadLinks(typography);
  return `import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '${jsString(projectName)}',
  description: '${jsString(tagline)}',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
${fontLinks ? `${fontLinks}\n` : ''}      {/* Skeed: ${typography.label} typography - ${typography.rationale} */}
      <body>{children}</body>
    </html>
  );
}
`;
}

function typographyCssFor(demographic: string | undefined) {
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

  if (
    ['ai', 'assistant', 'voice', 'creator_tools', 'ai_apps', 'hightech', 'social'].includes(key)
  ) {
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

function renderGlobals(state: PipelineState): string {
  const designSystem = state.designSystem;
  const brand = designSystem?.palette.primary ?? '#4F46E5';
  const fg = designSystem?.palette.neutral ?? '#0F172A';
  const accent = designSystem?.palette.accent ?? brand;
  const typography = typographyForDemographic(state.classification?.candidates[0]?.demographic);
  const themeTrace = themeTraceForDemographic(state.classification?.candidates[0]?.demographic);
  const radius = designSystem?.radius?.[1] ?? 8;
  return `/* Generated by Skeed.
   Demographic: ${themeTrace.demographic}
   Typeface: ${typography.label}
   Rationale: ${typography.rationale}
   Defaults: smart text, adaptive grids, CSS-first micro-interactions, reduced motion.
*/
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --skeed-brand: ${brand};
  --skeed-accent: ${accent};
  --skeed-bg: #FFFFFF;
  --skeed-surface: #FFFFFF;
  --skeed-surface-muted: #f8fafc;
  --skeed-fg: ${fg};
  --skeed-muted: color-mix(in srgb, ${fg} 68%, white);
  --skeed-border: color-mix(in srgb, ${fg} 14%, transparent);
  --skeed-success: #15803d;
  --skeed-warning: #b45309;
  --skeed-danger: #b91c1c;
  --skeed-radius: ${radius}px;
  --skeed-motion-fast: ${designSystem?.motion.duration.fast ?? 120}ms;
  --skeed-motion-base: ${designSystem?.motion.duration.base ?? 180}ms;
  --skeed-motion-slow: ${designSystem?.motion.duration.slow ?? 240}ms;
  --skeed-ease: ${designSystem?.motion.easing.standard ?? 'cubic-bezier(.2,.8,.2,1)'};
  --skeed-font-body-family: ${typography.fonts.body};
  --skeed-font-display-family: ${typography.fonts.display};
  --skeed-font-mono-family: ${typography.fonts.mono};
  --skeed-type-hero-size: ${typography.hero.size};
  --skeed-type-hero-line: ${typography.hero.lineHeight};
  --skeed-type-hero-tracking: ${typography.hero.letterSpacing};
  --skeed-type-hero-weight: ${typography.hero.weight};
  --skeed-type-title-size: ${typography.title.size};
  --skeed-type-title-line: ${typography.title.lineHeight};
  --skeed-type-title-tracking: ${typography.title.letterSpacing};
  --skeed-type-title-weight: ${typography.title.weight};
  --skeed-type-section-size: ${typography.section.size};
  --skeed-type-section-line: ${typography.section.lineHeight};
  --skeed-type-section-tracking: ${typography.section.letterSpacing};
  --skeed-type-section-weight: ${typography.section.weight};
  --skeed-type-body-size: ${typography.body.size};
  --skeed-type-body-line: ${typography.body.lineHeight};
  --skeed-type-body-tracking: ${typography.body.letterSpacing};
  --skeed-type-body-weight: ${typography.body.weight};
  --skeed-type-caption-size: ${typography.caption.size};
  --skeed-type-caption-line: ${typography.caption.lineHeight};
  --skeed-type-caption-tracking: ${typography.caption.letterSpacing};
  --skeed-type-caption-weight: ${typography.caption.weight};
  --skeed-eyebrow-tracking: ${typography.eyebrowTracking};
  --skeed-cta-radius: ${typography.cta.radius};
  --skeed-cta-min-height: ${typography.cta.minHeight};
  --skeed-cta-padding-x: ${typography.cta.paddingX};
  --skeed-cta-shadow: ${typography.cta.shadow};
  --skeed-cta-primary-weight: ${typography.cta.primaryWeight};
  --skeed-cta-secondary-weight: ${typography.cta.secondaryWeight};
}
* { box-sizing: border-box; }
html, body { padding: 0; margin: 0; font-family: var(--skeed-font-body-family); font-size: var(--skeed-type-body-size); line-height: var(--skeed-type-body-line); letter-spacing: var(--skeed-type-body-tracking); color: var(--skeed-fg); background: var(--skeed-bg); }
a { color: inherit; text-decoration: none; }
button, input, textarea, select { font: inherit; }
.container { width: 100%; max-width: 1100px; }
.mx-auto { margin-left: auto; margin-right: auto; }
.min-h-screen { min-height: 100vh; }
.flex { display: flex; }
.flex-wrap { flex-wrap: wrap; }
.flex-col { flex-direction: column; }
.flex-row { flex-direction: row; }
.flex-row-reverse { flex-direction: row-reverse; }
.grid { display: grid; }
.items-center { align-items: center; }
.items-start { align-items: flex-start; }
.items-end { align-items: flex-end; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.text-center { text-align: center; }
.text-left { text-align: left; }
.text-right { text-align: right; }
.text-xs { font-size: .75rem; }
.text-sm { font-size: .875rem; }
.text-lg { font-size: 1.125rem; }
.text-2xl { font-size: 1.5rem; line-height: 1.2; }
.text-3xl { font-size: 1.875rem; line-height: 1.2; }
.text-5xl { font-size: 3rem; line-height: 1.1; }
.font-medium { font-weight: 500; }
.font-semibold { font-weight: 600; }
.font-bold { font-weight: 700; }
.uppercase { text-transform: uppercase; }
.leading-tight { line-height: 1.1; }
.leading-relaxed { line-height: 1.65; }
.opacity-80 { opacity: .8; } .opacity-70 { opacity: .7; } .opacity-60 { opacity: .6; }
.gap-2 { gap: .5rem; } .gap-4 { gap: 1rem; } .gap-6 { gap: 1.5rem; } .gap-10 { gap: 2.5rem; }
.px-6 { padding-left: 1.5rem; padding-right: 1.5rem; } .px-8 { padding-left: 2rem; padding-right: 2rem; }
.py-3 { padding-top: .75rem; padding-bottom: .75rem; } .py-5 { padding-top: 1.25rem; padding-bottom: 1.25rem; } .py-16 { padding-top: 4rem; padding-bottom: 4rem; }
.p-6 { padding: 1.5rem; } .p-8 { padding: 2rem; }
.mt-3 { margin-top: .75rem; } .mt-4 { margin-top: 1rem; } .mt-6 { margin-top: 1.5rem; } .mt-8 { margin-top: 2rem; }
.mb-6 { margin-bottom: 1.5rem; }
.max-w-2xl { max-width: 42rem; } .max-w-xl { max-width: 36rem; } .max-w-prose { max-width: 65ch; } .max-w-screen-lg { max-width: 1024px; }
.w-full { width: 100%; } .h-full { height: 100%; }
.inline-block { display: inline-block; }
.relative { position: relative; } .absolute { position: absolute; }
.z-10 { z-index: 10; }
.overflow-hidden { overflow: hidden; }
.rounded-full { border-radius: 9999px; }
.rounded-xl { border-radius: .75rem; }
.rounded-2xl { border-radius: 1rem; }
.border { border-width: 1px; border-style: solid; }
.border-black\\/10 { border-color: rgba(0,0,0,.1); }
.bg-\\[var\\(--skeed-bg\\)\\] { background: var(--skeed-bg); }
.bg-\\[var\\(--skeed-brand\\)\\] { background: var(--skeed-brand); }
.text-\\[var\\(--skeed-fg\\)\\] { color: var(--skeed-fg); }
.text-white { color: #fff; }
.hover\\:underline:hover { text-decoration: underline; }
.skeed-smart-text { hyphens: auto; overflow-wrap: break-word; word-break: normal; }
.skeed-smart-title { hyphens: auto; overflow-wrap: break-word; text-wrap: balance; word-break: normal; }
.skeed-adaptive-grid-2 { grid-template-columns: repeat(auto-fit, minmax(min(16rem, 100%), 1fr)); }
.skeed-adaptive-grid-3 { grid-template-columns: repeat(auto-fit, minmax(min(12rem, 100%), 1fr)); }
.skeed-adaptive-grid-dense { grid-template-columns: repeat(auto-fit, minmax(min(9rem, 100%), 1fr)); }
.skeed-type-page { color: var(--skeed-fg); font-family: var(--skeed-font-body-family); font-size: var(--skeed-type-body-size); line-height: var(--skeed-type-body-line); letter-spacing: var(--skeed-type-body-tracking); font-weight: var(--skeed-type-body-weight); overflow-wrap: break-word; word-break: normal; }
.skeed-type-hero { font-family: var(--skeed-font-display-family); font-size: var(--skeed-type-hero-size); line-height: var(--skeed-type-hero-line); letter-spacing: var(--skeed-type-hero-tracking); font-weight: var(--skeed-type-hero-weight); hyphens: auto; overflow-wrap: break-word; text-wrap: balance; word-break: normal; }
.skeed-type-title { font-family: var(--skeed-font-display-family); font-size: var(--skeed-type-title-size); line-height: var(--skeed-type-title-line); letter-spacing: var(--skeed-type-title-tracking); font-weight: var(--skeed-type-title-weight); hyphens: auto; overflow-wrap: break-word; text-wrap: balance; word-break: normal; }
.skeed-type-section { font-family: var(--skeed-font-display-family); font-size: var(--skeed-type-section-size); line-height: var(--skeed-type-section-line); letter-spacing: var(--skeed-type-section-tracking); font-weight: var(--skeed-type-section-weight); hyphens: auto; overflow-wrap: break-word; text-wrap: balance; word-break: normal; }
.skeed-type-body { font-family: var(--skeed-font-body-family); font-size: var(--skeed-type-body-size); line-height: var(--skeed-type-body-line); letter-spacing: var(--skeed-type-body-tracking); font-weight: var(--skeed-type-body-weight); overflow-wrap: break-word; word-break: normal; }
.skeed-type-caption { font-family: var(--skeed-font-body-family); font-size: var(--skeed-type-caption-size); line-height: var(--skeed-type-caption-line); letter-spacing: var(--skeed-type-caption-tracking); font-weight: var(--skeed-type-caption-weight); overflow-wrap: break-word; word-break: normal; }
.skeed-eyebrow { color: var(--skeed-accent); font-size: var(--skeed-type-caption-size); font-weight: 700; letter-spacing: var(--skeed-eyebrow-tracking); text-transform: uppercase; }
.skeed-cta-primary { display: inline-flex; align-items: center; justify-content: center; min-height: var(--skeed-cta-min-height); max-width: 100%; isolation: isolate; overflow: hidden; padding: 0 var(--skeed-cta-padding-x); position: relative; border-radius: var(--skeed-cta-radius); background: linear-gradient(135deg, var(--skeed-brand), color-mix(in srgb, var(--skeed-brand) 72%, var(--skeed-accent))); color: #fff; font-weight: var(--skeed-cta-primary-weight); box-shadow: var(--skeed-cta-shadow); text-align: center; text-wrap: balance; white-space: normal; transition: transform var(--skeed-motion-fast) var(--skeed-ease), box-shadow var(--skeed-motion-base) var(--skeed-ease); }
.skeed-cta-primary::after { content: ""; position: absolute; inset: -2px; pointer-events: none; transform: translateX(-130%) skewX(-18deg); transition: transform var(--skeed-motion-slow) var(--skeed-ease); background: linear-gradient(105deg, transparent 32%, rgba(255, 255, 255, .34) 48%, transparent 64%); }
.skeed-cta-primary:hover { box-shadow: 0 16px 34px color-mix(in srgb, var(--skeed-brand) 24%, transparent); }
.skeed-cta-primary:hover::after { transform: translateX(130%) skewX(-18deg); }
.skeed-cta-primary:active { transform: scale(.985); }
.skeed-cta-secondary { display: inline-flex; align-items: center; justify-content: center; min-height: var(--skeed-cta-min-height); max-width: 100%; padding: 0 var(--skeed-cta-padding-x); border-radius: var(--skeed-cta-radius); border: 1px solid var(--skeed-border); background: #fff; color: var(--skeed-fg); font-weight: var(--skeed-cta-secondary-weight); text-align: center; text-wrap: balance; white-space: normal; transition: transform var(--skeed-motion-fast) var(--skeed-ease), border-color var(--skeed-motion-base) var(--skeed-ease), background-color var(--skeed-motion-base) var(--skeed-ease); }
.skeed-cta-secondary:hover { border-color: color-mix(in srgb, var(--skeed-brand) 42%, var(--skeed-border)); background: color-mix(in srgb, var(--skeed-brand) 4%, #fff); }
.skeed-cta-secondary:active { transform: scale(.985); }
.skeed-focus-ring { outline: 2px solid transparent; outline-offset: 2px; box-shadow: 0 0 0 3px color-mix(in srgb, var(--skeed-brand) 32%, transparent); }
.skeed-hover-lift { transform: translate3d(0,0,0); transition: transform var(--skeed-motion-base) var(--skeed-ease), box-shadow var(--skeed-motion-base) var(--skeed-ease); will-change: transform; }
.skeed-hover-lift:hover { transform: translate3d(0,-2px,0); box-shadow: 0 14px 30px rgba(15,23,42,.12); }
.skeed-press-soft { transition: transform var(--skeed-motion-fast) var(--skeed-ease); }
.skeed-press-soft:active { transform: scale(.985); }
.skeed-enter-fade { animation: skeed-fade-in var(--skeed-motion-base) var(--skeed-ease) both; }
.skeed-enter-slide-up { animation: skeed-slide-up var(--skeed-motion-base) var(--skeed-ease) both; }
.skeed-state-success { color: var(--skeed-success); border-color: color-mix(in srgb, var(--skeed-success) 28%, transparent); background: color-mix(in srgb, var(--skeed-success) 8%, transparent); }
.skeed-state-error { color: var(--skeed-danger); border-color: color-mix(in srgb, var(--skeed-danger) 28%, transparent); background: color-mix(in srgb, var(--skeed-danger) 8%, transparent); }
@keyframes skeed-fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes skeed-slide-up { from { opacity: 0; transform: translate3d(0,10px,0); } to { opacity: 1; transform: translate3d(0,0,0); } }
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after { animation-duration: 1ms !important; animation-iteration-count: 1 !important; scroll-behavior: auto !important; transition-duration: 1ms !important; }
  .skeed-cta-primary::after { display: none; }
}
@media (min-width: 640px) { .sm\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (min-width: 768px) { .md\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); } .md\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (min-width: 1024px) { .lg\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); } .lg\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
`;
}

function renderSelectedTokenCss(selected: SelectedSkeedComponent[]): string {
  const css = unique(selected.map((item) => sanitizeSelectedTokenCss(item.tokensCss)).filter(Boolean));
  if (css.length === 0) return '';
  return `/* Skeed selected component tokens.
   Component colors and shadows are preserved, but the scaffold theme remains
   the authority for typography, spacing, density, motion, and CTA hierarchy. */
${css.join('\n')}`;
}

function sanitizeSelectedTokenCss(css: string): string {
  const protectedThemeVariables =
    /^\s*--skeed-(font|type|spacing|density|current|motion|cta|radius)-/;
  return css
    .split(/\r?\n/)
    .filter((line) => !protectedThemeVariables.test(line))
    .join('\n')
    .trim();
}

function renderSkeedClassShim(): string {
  const colorGroups = ['brand', 'neutral', 'success', 'warning', 'danger', 'info'];
  const colorSteps = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
  const spacing: Record<string, string> = {
    '0': '0',
    '1': '.25rem',
    '2': '.5rem',
    '3': '.75rem',
    '4': '1rem',
    '5': '1.25rem',
    '6': '1.5rem',
    '8': '2rem',
    '10': '2.5rem',
    '12': '3rem',
    '20': '5rem',
    '32': '8rem',
  };
  const radius: Record<string, string> = {
    '2': '.5rem',
    '3': '.75rem',
    '7': '1rem',
    '9999': '9999px',
  };
  const lines = ['/* Skeed utility shim for registry components */'];
  for (const group of colorGroups) {
    for (const step of colorSteps) {
      const token = `var(--skeed-color-${group}-${step})`;
      lines.push(`.bg-skeed-color-${group}-${step}{background:${token};}`);
      lines.push(`.text-skeed-color-${group}-${step}{color:${token};}`);
      lines.push(`.border-skeed-color-${group}-${step}{border-color:${token};}`);
      lines.push(`.placeholder\\:text-skeed-color-${group}-${step}::placeholder{color:${token};}`);
      lines.push(`.hover\\:bg-skeed-color-${group}-${step}:hover{background:${token};}`);
      lines.push(`.hover\\:text-skeed-color-${group}-${step}:hover{color:${token};}`);
    }
  }
  for (const [key, value] of Object.entries(spacing)) {
    lines.push(`.gap-skeed-spacing-${key}{gap:${value};}`);
    lines.push(`.h-skeed-spacing-${key}{height:${value};}`);
    lines.push(`.w-skeed-spacing-${key}{width:${value};}`);
    lines.push(`.min-h-skeed-spacing-${key}{min-height:${value};}`);
    lines.push(`.mt-skeed-spacing-${key}{margin-top:${value};}`);
    lines.push(`.mb-skeed-spacing-${key}{margin-bottom:${value};}`);
    lines.push(`.px-skeed-spacing-${key}{padding-left:${value};padding-right:${value};}`);
    lines.push(`.py-skeed-spacing-${key}{padding-top:${value};padding-bottom:${value};}`);
    lines.push(`.pb-skeed-spacing-${key}{padding-bottom:${value};}`);
    lines.push(`.pt-skeed-spacing-${key}{padding-top:${value};}`);
  }
  for (const [key, value] of Object.entries(radius)) {
    lines.push(`.rounded-skeed-radius-${key}{border-radius:${value};}`);
  }
  lines.push('.gap-skeed-density-cozy-gap{gap:.875rem;}');
  lines.push('.px-skeed-density-cozy-padx{padding-left:1rem;padding-right:1rem;}');
  lines.push('.py-skeed-density-cozy-pady{padding-top:.75rem;padding-bottom:.75rem;}');
  lines.push('.font-skeed-display{font-family:var(--skeed-font-display-family,inherit);}');
  lines.push('.font-skeed-body{font-family:var(--skeed-font-body-family,inherit);}');
  lines.push('.skeed-smart-text{hyphens:auto;overflow-wrap:break-word;word-break:normal;}');
  lines.push(
    '.skeed-smart-title{hyphens:auto;overflow-wrap:break-word;text-wrap:balance;word-break:normal;}',
  );
  lines.push(
    '.skeed-adaptive-grid-2{grid-template-columns:repeat(auto-fit,minmax(min(16rem,100%),1fr));}',
  );
  lines.push(
    '.skeed-adaptive-grid-3{grid-template-columns:repeat(auto-fit,minmax(min(12rem,100%),1fr));}',
  );
  lines.push(
    '.skeed-adaptive-grid-dense{grid-template-columns:repeat(auto-fit,minmax(min(9rem,100%),1fr));}',
  );
  lines.push(
    '.skeed-type-page{color:var(--skeed-fg);font-family:var(--skeed-font-body-family);font-size:var(--skeed-type-body-size);line-height:var(--skeed-type-body-line);letter-spacing:var(--skeed-type-body-tracking);font-weight:var(--skeed-type-body-weight);overflow-wrap:break-word;word-break:normal;}',
  );
  lines.push(
    '.skeed-type-hero{font-family:var(--skeed-font-display-family);font-size:var(--skeed-type-hero-size);line-height:var(--skeed-type-hero-line);letter-spacing:var(--skeed-type-hero-tracking);font-weight:var(--skeed-type-hero-weight);hyphens:auto;overflow-wrap:break-word;text-wrap:balance;word-break:normal;}',
  );
  lines.push(
    '.skeed-type-title{font-family:var(--skeed-font-display-family);font-size:var(--skeed-type-title-size);line-height:var(--skeed-type-title-line);letter-spacing:var(--skeed-type-title-tracking);font-weight:var(--skeed-type-title-weight);hyphens:auto;overflow-wrap:break-word;text-wrap:balance;word-break:normal;}',
  );
  lines.push(
    '.skeed-type-section{font-family:var(--skeed-font-display-family);font-size:var(--skeed-type-section-size);line-height:var(--skeed-type-section-line);letter-spacing:var(--skeed-type-section-tracking);font-weight:var(--skeed-type-section-weight);hyphens:auto;overflow-wrap:break-word;text-wrap:balance;word-break:normal;}',
  );
  lines.push(
    '.skeed-type-body{font-family:var(--skeed-font-body-family);font-size:var(--skeed-type-body-size);line-height:var(--skeed-type-body-line);letter-spacing:var(--skeed-type-body-tracking);font-weight:var(--skeed-type-body-weight);overflow-wrap:break-word;word-break:normal;}',
  );
  lines.push(
    '.skeed-type-caption{font-family:var(--skeed-font-body-family);font-size:var(--skeed-type-caption-size);line-height:var(--skeed-type-caption-line);letter-spacing:var(--skeed-type-caption-tracking);font-weight:var(--skeed-type-caption-weight);overflow-wrap:break-word;word-break:normal;}',
  );
  lines.push(
    '.skeed-eyebrow{color:var(--skeed-accent);font-size:var(--skeed-type-caption-size);font-weight:700;letter-spacing:var(--skeed-eyebrow-tracking);text-transform:uppercase;}',
  );
  lines.push(
    '.skeed-cta-primary{display:inline-flex;align-items:center;justify-content:center;min-height:var(--skeed-cta-min-height);max-width:100%;isolation:isolate;overflow:hidden;padding:0 var(--skeed-cta-padding-x);position:relative;border-radius:var(--skeed-cta-radius);background:linear-gradient(135deg,var(--skeed-brand),color-mix(in srgb,var(--skeed-brand) 72%,var(--skeed-accent)));color:#fff;font-weight:var(--skeed-cta-primary-weight);box-shadow:var(--skeed-cta-shadow);text-align:center;text-wrap:balance;white-space:normal;transition:transform var(--skeed-motion-fast) var(--skeed-ease),box-shadow var(--skeed-motion-base) var(--skeed-ease);}',
  );
  lines.push(
    '.skeed-cta-primary::after{content:"";position:absolute;inset:-2px;pointer-events:none;transform:translateX(-130%) skewX(-18deg);transition:transform var(--skeed-motion-slow) var(--skeed-ease);background:linear-gradient(105deg,transparent 32%,rgba(255,255,255,.34) 48%,transparent 64%);}',
  );
  lines.push('.skeed-cta-primary:hover{box-shadow:0 16px 34px color-mix(in srgb,var(--skeed-brand) 24%,transparent);}');
  lines.push('.skeed-cta-primary:hover::after{transform:translateX(130%) skewX(-18deg);}');
  lines.push('.skeed-cta-primary:active{transform:scale(.985);}');
  lines.push(
    '.skeed-cta-secondary{display:inline-flex;align-items:center;justify-content:center;min-height:var(--skeed-cta-min-height);max-width:100%;padding:0 var(--skeed-cta-padding-x);border-radius:var(--skeed-cta-radius);border:1px solid var(--skeed-border);background:#fff;color:var(--skeed-fg);font-weight:var(--skeed-cta-secondary-weight);text-align:center;text-wrap:balance;white-space:normal;transition:transform var(--skeed-motion-fast) var(--skeed-ease),border-color var(--skeed-motion-base) var(--skeed-ease),background-color var(--skeed-motion-base) var(--skeed-ease);}',
  );
  lines.push(
    '.skeed-cta-secondary:hover{border-color:color-mix(in srgb,var(--skeed-brand) 42%,var(--skeed-border));background:color-mix(in srgb,var(--skeed-brand) 4%,#fff);}',
  );
  lines.push('.skeed-cta-secondary:active{transform:scale(.985);}');
  lines.push(
    '@media (prefers-reduced-motion:reduce){.skeed-cta-primary::after{display:none}.skeed-cta-primary:active,.skeed-cta-secondary:active{transform:none}}',
  );
  lines.push('.shadow-skeed-shadow-1{box-shadow:0 1px 3px rgba(15,23,42,.12);}');
  lines.push('.shadow-skeed-shadow-2{box-shadow:0 8px 24px rgba(15,23,42,.14);}');
  lines.push('.hover\\:shadow-skeed-shadow-2:hover{box-shadow:0 8px 24px rgba(15,23,42,.14);}');
  lines.push('.transition-colors{transition-property:color,background-color,border-color;}');
  lines.push('.transition-shadow{transition-property:box-shadow;}');
  lines.push('.duration-skeed-motion-duration-fast{transition-duration:160ms;}');
  lines.push('.duration-skeed-motion-duration-normal{transition-duration:240ms;}');
  lines.push(
    '.ease-skeed-motion-easing-default{transition-timing-function:cubic-bezier(.4,0,.2,1);}',
  );
  lines.push(
    '.shrink-0{flex-shrink:0;} .flex-shrink-0{flex-shrink:0;} .cursor-pointer{cursor:pointer;}',
  );
  lines.push(
    '.object-cover{object-fit:cover;} .rotate-45{transform:rotate(45deg);} .blur-xl{filter:blur(24px);}',
  );
  return lines.join('\n');
}

function pickArchetype(
  catalog: LoadedArchetype[],
  intent: string,
  state: PipelineState,
): LoadedArchetype | undefined {
  const demographic = state.classification?.candidates[0]?.demographic;
  const terms = intent
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  return catalog
    .filter((item) => !demographic || !item.manifest.demographicAntiPatterns.includes(demographic))
    .map((item) => ({ item, score: scoreArchetype(item, terms) }))
    .sort((a, b) => b.score - a.score)[0]?.item;
}

function scoreArchetype(item: LoadedArchetype, terms: string[]): number {
  const meta = item.manifest.aiMetadata;
  const haystack = [
    item.manifest.id,
    item.manifest.name,
    item.manifest.description,
    ...(meta?.intentPhrases ?? []),
    ...(meta?.useCases ?? []),
    ...(meta?.moodTags ?? []),
    ...(meta?.generationHints ?? []),
  ]
    .join(' ')
    .toLowerCase();
  return terms.reduce((score, term) => score + (haystack.includes(term) ? 1 : 0), 0);
}

function preferredArchetypes(role: string, intent: string, index: number): string[] {
  const text = `${role} ${intent}`.toLowerCase();
  if (index === 0 || /hero|intro|headline/.test(text)) return ['hero', 'header'];
  if (/feature|benefit|step|story|value/.test(text))
    return ['feature-grid', 'card', 'dashboard-card'];
  if (/cta|signup|sign up|waitlist|contact|join|start/.test(text)) {
    return ['signup-form', 'contact-form', 'button', 'callout'];
  }
  if (/chat|message|conversation/.test(text)) return ['chat-message', 'comments'];
  return ['card', 'callout', 'article', 'feature-grid'];
}

function fallbackSlots(purpose: string): PageSpec['slots'] {
  return [
    { role: 'hero', intent: purpose, candidateIds: [], chosenId: null },
    {
      role: 'features',
      intent: 'explain the most valuable user outcomes',
      candidateIds: [],
      chosenId: null,
    },
    { role: 'cta', intent: 'invite the user to start', candidateIds: [], chosenId: null },
  ];
}

function hrefFor(state: PipelineState, pageId: string): string {
  return state.siteMap?.pages.find((page) => page.id === pageId)?.route ?? '/';
}

function componentName(id: string): string {
  const name = id
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase())
    .replace(/\s+/g, '');
  return /^[A-Z]/.test(name) ? name : `Page${name}`;
}

function titleCase(value: string): string {
  return value.replace(/[-_]/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
}

function escapeHtml(s: string): string {
  return s.replace(/[<>&'"`]/g, (c) => `&#${c.charCodeAt(0)};`);
}

function jsString(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r?\n/g, ' ');
}

function smartTruncate(value: string, max: number): string {
  if (value.length <= max) return value;
  const slice = value.slice(0, max);
  const lastSpace = slice.lastIndexOf(' ');
  if (lastSpace > max * 0.6) return slice.slice(0, lastSpace).trim();
  return slice.trim();
}

function densityFor(value: string | undefined): 'compact' | 'cozy' | 'comfy' {
  if (value === 'compact') return 'compact';
  if (value === 'spacious') return 'comfy';
  return 'cozy';
}

function archetypeIdFromComponentId(id: string): string {
  return id.split('/')[1] ?? id;
}

function registryFileName(id: string): string {
  return id.replace(/_/g, '-').replace(/\//g, '-');
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}
