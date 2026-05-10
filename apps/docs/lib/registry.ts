import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { Catalog, type CatalogRow } from '@skeed/mcp-server';
import { getSkeedTypographyPreset, getSkeedVisualPreset } from '@skeed/tailwind';
export {
  DEMOGRAPHIC_CHOICES,
  SHOWCASE_DEMOGRAPHIC_CHOICES,
  previewStyleForDemographic,
} from './theme';

export type DocsComponentFilters = {
  tier?: string;
  demographic?: string;
  category?: string;
  query?: string;
  limit?: number;
};

export type DocsComponent = CatalogRow & {
  href: string;
  installCommand: string;
};

export type DocsDemographic = {
  id: string;
  preset: unknown;
  visual: ReturnType<typeof getSkeedVisualPreset>;
  typography: ReturnType<typeof getSkeedTypographyPreset>;
  bestFor: string[];
};

export function withCatalog<T>(fn: (catalog: Catalog) => T): T {
  const catalog = new Catalog(resolveRegistryPath());
  try {
    return fn(catalog);
  } finally {
    catalog.close();
  }
}

export function listDocsComponents(filters: DocsComponentFilters = {}): DocsComponent[] {
  return withCatalog((catalog) => {
    const intent =
      filters.query?.trim() ||
      'production UI components hero feature form dashboard card input navigation pricing table';
    const rows =
      filters.tier === 'flagship' || !filters.tier
        ? catalog.getFlagshipComponents({
            intent,
            ...(filters.demographic ? { demographic: filters.demographic } : {}),
            ...(filters.category ? { category: filters.category } : {}),
            limit: filters.limit ?? 36,
          })
        : catalog.semanticSearchComponents({
            intent,
            ...(filters.demographic ? { demographic: filters.demographic } : {}),
            ...(filters.category ? { category: filters.category } : {}),
            limit: filters.limit ?? 36,
          });

    return rows.map(toDocsComponent);
  });
}

export function getDocsComponent(id: string): {
  id: string;
  manifest: Record<string, unknown>;
  sourceTsx: string | null;
  installPlan: unknown;
  shadcnPayload: unknown;
  contextDocuments: Array<Record<string, unknown>>;
  fit: unknown;
} | null {
  return withCatalog((catalog) => {
    const context = catalog.getComponentContext(id) as
      | {
          manifest: Record<string, unknown>;
          sourceTsx?: string | null;
          contextDocuments?: Array<Record<string, unknown>>;
        }
      | null;
    if (!context) return null;
    return {
      id,
      manifest: context.manifest,
      sourceTsx: context.sourceTsx ?? null,
      installPlan: catalog.getInstallPlan(id),
      shadcnPayload: catalog.shadcnRegistryItem(id),
      contextDocuments: context.contextDocuments ?? [],
      fit: catalog.explainComponentFit({
        id,
        intent: String(context.manifest.description ?? context.manifest.name ?? id),
        demographic: String(context.manifest.demographicId ?? ''),
      }),
    };
  });
}

export function getDocsDemographic(id: string): DocsDemographic | null {
  return withCatalog((catalog) => {
    const preset = catalog.getDemographicContext(id);
    return {
      id,
      preset: preset ?? { id, source: 'docs-showcase-fallback' },
      visual: getSkeedVisualPreset(id),
      typography: getSkeedTypographyPreset(id),
      bestFor: bestForDemographic(id),
    };
  });
}

export function getDocsInstallPlan(id: string): unknown {
  return withCatalog((catalog) => catalog.getInstallPlan(id));
}

export function registryIndex(): unknown {
  return withCatalog((catalog) => catalog.shadcnRegistry({ qualityTier: 'flagship', limit: 500 }));
}

export function registryItem(name: string): unknown | null {
  const registryName = name.replace(/\.json$/, '');
  return withCatalog((catalog) => {
    const index = catalog.shadcnRegistry({ limit: 10000 }) as {
      items?: Array<{ name?: string; meta?: { skeedId?: string } }>;
    };
    const item = index.items?.find((entry) => entry.name === registryName);
    return item?.meta?.skeedId ? catalog.shadcnRegistryItem(item.meta.skeedId) : null;
  });
}

export function registryOverview(): unknown {
  return withCatalog((catalog) => catalog.registryOverview());
}

export function llmsText(): string {
  return withCatalog((catalog) => catalog.llmsText());
}

export function componentHref(id: string): string {
  return `/components/${id.split('/').map(encodeURIComponent).join('/')}`;
}

export function componentNameFromId(id: string): string {
  return humanizeComponentName(id.split('/').slice(0, 2).join(' '));
}

export function humanizeComponentName(name: string): string {
  return name
    .replace(/[_-]/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function toDocsComponent(row: CatalogRow): DocsComponent {
  return {
    ...row,
    href: componentHref(row.id),
    installCommand: `npx shadcn@latest add https://skeed.dev/r/${row.id.replace(/_/g, '-').replace(/\//g, '-')}.json`,
  };
}

function resolveRegistryPath(): string {
  const candidates = [
    process.env.SKEED_REGISTRY_PATH,
    resolve(process.cwd(), '../../packages/mcp-server/registry.db'),
    resolve(process.cwd(), '../packages/mcp-server/registry.db'),
    resolve(process.cwd(), 'packages/mcp-server/registry.db'),
    resolve(process.cwd(), '../../packages/indexer/dist/registry.db'),
  ].filter(Boolean) as string[];
  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) throw new Error('Skeed registry.db not found for docs app.');
  return found;
}

function bestForDemographic(id: string): string[] {
  const map: Record<string, string[]> = {
    health: ['fitness tracking', 'patient portals', 'wellness onboarding'],
    teens: ['youth learning', 'community challenges', 'creator tools'],
    working_class: ['service portals', 'benefit flows', 'practical scheduling'],
    education: ['lesson apps', 'teacher dashboards', 'student progress'],
    religious: ['community portals', 'faith publishing', 'stewardship flows'],
    mental_wellness: ['check-ins', 'calm dashboards', 'supportive journeys'],
    productivity: ['workflow tools', 'remote work', 'task systems'],
    ai_apps: ['assistants', 'voice tools', 'creative AI surfaces'],
    kids: ['learning apps', 'parent-approved flows', 'playful progress'],
    legal: ['legal intake', 'case review', 'formal document flows'],
    erp: ['back office', 'inventory systems', 'approval workflows'],
    sales_crm: ['pipeline tools', 'sales operations', 'account workflows'],
    hightech: ['developer tools', 'AI platforms', 'technical dashboards'],
    social: ['community apps', 'creator feeds', 'participation loops'],
    monitoring: ['observability', 'incident response', 'status dashboards'],
    classic: ['legal', 'heritage brands', 'formal services'],
    classic_ancient: ['archives', 'heritage education', 'mythic/history products'],
    gov: ['civic services', 'benefit portals', 'public dashboards'],
    fintech: ['money products', 'risk views', 'secure onboarding'],
    marketplace: ['listings', 'booking flows', 'trust-led commerce'],
    listings: ['classifieds', 'real estate', 'inventory discovery'],
    military: ['readiness views', 'protocol workflows', 'command operations'],
    special_occasion: ['event pages', 'invitation flows', 'celebration commerce'],
  };
  return map[id] ?? ['targeted product UI', 'audience-specific workflows'];
}
