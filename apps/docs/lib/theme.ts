import { getSkeedTypographyPreset, getSkeedVisualPreset } from '@skeed/tailwind';
import type { CSSProperties } from 'react';

export const DEMOGRAPHIC_CHOICES = [
  'kids',
  'teens',
  'working_class',
  'education',
  'religious',
  'mental_wellness',
  'health',
  'legal',
  'erp',
  'sales_crm',
  'hightech',
  'social',
  'monitoring',
  'classic',
  'fintech',
  'ai_apps',
  'marketplace',
  'listings',
  'gov',
  'military',
  'productivity',
  'special_occasion',
] as const;

export const SHOWCASE_DEMOGRAPHIC_CHOICES = [
  ...DEMOGRAPHIC_CHOICES,
  'classic_ancient',
] as const;

export type DemographicFontProfile = {
  label: string;
  body: string;
  display: string;
  rationale: string;
};

export function previewStyleForDemographic(id: string, mode: 'light' | 'dark' = 'light') {
  const override = showcaseOverrides[id];
  const visual = getSkeedVisualPreset(id);
  const typography = getSkeedTypographyPreset(id);
  const fontProfile = fontProfileForDemographic(id);
  const colors = { ...visual.colors, ...override?.colors };
  const fonts = {
    ...typography.fonts,
    body: fontProfile.body,
    display: fontProfile.display,
    ...override?.fonts,
  };
  const scale = {
    hero: { ...typography.scale.hero, ...override?.scale?.hero },
    title: { ...typography.scale.title, ...override?.scale?.title },
    body: { ...typography.scale.body, ...override?.scale?.body },
  };
  return {
    '--skeed-brand': colors.brand,
    '--skeed-accent': colors.accent,
    '--skeed-bg': mode === 'dark' ? '#020617' : colors.bg,
    '--skeed-surface': mode === 'dark' ? '#0f172a' : '#ffffff',
    '--skeed-surface-muted': mode === 'dark' ? '#1e293b' : colors.bg,
    '--skeed-fg': mode === 'dark' ? '#f8fafc' : colors.fg,
    '--skeed-muted': mode === 'dark' ? '#cbd5e1' : colors.muted,
    '--skeed-border': mode === 'dark' ? 'rgba(255,255,255,.14)' : colors.border,
    '--skeed-success': colors.success,
    '--skeed-warning': '#b45309',
    '--skeed-danger': colors.danger,
    '--skeed-radius': override?.radius ?? visual.radius,
    '--skeed-font-body-family': fonts.body,
    '--skeed-font-display-family': fonts.display,
    '--skeed-type-hero-size': scale.hero.size,
    '--skeed-type-hero-line': scale.hero.lineHeight,
    '--skeed-type-hero-weight': scale.hero.weight,
    '--skeed-type-title-size': scale.title.size,
    '--skeed-type-title-line': scale.title.lineHeight,
    '--skeed-type-title-weight': scale.title.weight,
    '--skeed-type-body-size': scale.body.size,
    '--skeed-type-body-line': scale.body.lineHeight,
    '--skeed-type-body-weight': scale.body.weight,
    '--skeed-preview-texture': override?.texture ?? 'none',
  } as CSSProperties;
}

export function fontProfileForDemographic(id: string): DemographicFontProfile {
  const key = id.toLowerCase().replace(/[\s-]+/g, '_');
  return demographicFontProfiles[key] ?? demographicFontProfiles.productivity!;
}

const sansFallback =
  'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const serifFallback = 'Georgia, Cambria, "Times New Roman", ui-serif, serif';

const demographicFontProfiles: Record<string, DemographicFontProfile> = {
  health: {
    label: 'Atkinson + Inter',
    body: `Atkinson Hyperlegible, Inter, ${sansFallback}`,
    display: `Inter, Atkinson Hyperlegible, ${sansFallback}`,
    rationale: 'clear, calm, accessible reading for health decisions',
  },
  mental_wellness: {
    label: 'Atkinson soft',
    body: `Atkinson Hyperlegible, Inter, ${sansFallback}`,
    display: `Atkinson Hyperlegible, Inter, ${sansFallback}`,
    rationale: 'gentle legibility without clinical harshness',
  },
  productivity: {
    label: 'IBM Plex + Inter',
    body: `"IBM Plex Sans", Inter, ${sansFallback}`,
    display: `Inter Tight, "IBM Plex Sans", Inter, ${sansFallback}`,
    rationale: 'compact rhythm for repeated professional workflows',
  },
  erp: {
    label: 'IBM Plex Ops',
    body: `"IBM Plex Sans", Inter, ${sansFallback}`,
    display: `"IBM Plex Sans", Inter, ${sansFallback}`,
    rationale: 'dense, familiar enterprise scanning',
  },
  sales_crm: {
    label: 'Inter Tight',
    body: `Inter, ${sansFallback}`,
    display: `Inter Tight, Inter, ${sansFallback}`,
    rationale: 'decisive hierarchy for revenue actions',
  },
  monitoring: {
    label: 'IBM Plex Signal',
    body: `"IBM Plex Sans", Inter, ${sansFallback}`,
    display: `"IBM Plex Sans", Inter, ${sansFallback}`,
    rationale: 'status-first clarity for incident surfaces',
  },
  ai_apps: {
    label: 'Inter Tight',
    body: `Inter, ${sansFallback}`,
    display: `Inter Tight, Inter, ${sansFallback}`,
    rationale: 'modern assistant surfaces with controlled expressiveness',
  },
  hightech: {
    label: 'Inter Tight Tech',
    body: `"IBM Plex Sans", Inter, ${sansFallback}`,
    display: `Inter Tight, "IBM Plex Sans", Inter, ${sansFallback}`,
    rationale: 'crisp technical intelligence without sci-fi clutter',
  },
  kids: {
    label: 'Nunito',
    body: `Nunito, Inter, ${sansFallback}`,
    display: `Nunito, Inter, ${sansFallback}`,
    rationale: 'round, readable, playful shapes with enough control',
  },
  teens: {
    label: 'Nunito + Inter Tight',
    body: `Nunito, Inter, ${sansFallback}`,
    display: `Inter Tight, Nunito, Inter, ${sansFallback}`,
    rationale: 'more mature than kids, still energetic and friendly',
  },
  education: {
    label: 'Atkinson',
    body: `Atkinson Hyperlegible, Inter, ${sansFallback}`,
    display: `Atkinson Hyperlegible, Inter, ${sansFallback}`,
    rationale: 'low cognitive load for lessons and admin work',
  },
  gov: {
    label: 'Source Sans 3',
    body: `"Source Sans 3", Inter, ${sansFallback}`,
    display: `"Source Sans 3", Inter, ${sansFallback}`,
    rationale: 'plain-language civic clarity with strong accessibility',
  },
  military: {
    label: 'Source Sans Command',
    body: `"Source Sans 3", "IBM Plex Sans", ${sansFallback}`,
    display: `"IBM Plex Sans", "Source Sans 3", ${sansFallback}`,
    rationale: 'disciplined status hierarchy for operational contexts',
  },
  working_class: {
    label: 'Source Sans Practical',
    body: `"Source Sans 3", Inter, ${sansFallback}`,
    display: `"Source Sans 3", Inter, ${sansFallback}`,
    rationale: 'direct, unpretentious, highly legible task flow',
  },
  legal: {
    label: 'Libre Baskerville',
    body: `"Source Sans 3", Inter, ${sansFallback}`,
    display: `"Libre Baskerville", ${serifFallback}`,
    rationale: 'formal authority balanced with readable body copy',
  },
  classic: {
    label: 'Libre Baskerville',
    body: `"Crimson Text", ${serifFallback}`,
    display: `"Libre Baskerville", ${serifFallback}`,
    rationale: 'editorial trust and durable serif hierarchy',
  },
  religious: {
    label: 'Cormorant + Crimson',
    body: `"Crimson Text", ${serifFallback}`,
    display: `"Cormorant Garamond", "Libre Baskerville", ${serifFallback}`,
    rationale: 'reverent editorial texture without ornate illegibility',
  },
  classic_ancient: {
    label: 'Cormorant Scroll',
    body: `"Crimson Text", ${serifFallback}`,
    display: `"Cormorant Garamond", "Libre Baskerville", ${serifFallback}`,
    rationale: 'parchment-like warmth for heritage and archive surfaces',
  },
  fintech: {
    label: 'IBM Plex Finance',
    body: `"IBM Plex Sans", Inter, ${sansFallback}`,
    display: `Inter Tight, "IBM Plex Sans", Inter, ${sansFallback}`,
    rationale: 'precise numeracy and premium financial confidence',
  },
  marketplace: {
    label: 'Fraunces Commerce',
    body: `Inter, ${sansFallback}`,
    display: `Fraunces, Inter Tight, Inter, ${sansFallback}`,
    rationale: 'warm merchandising hierarchy with conversion energy',
  },
  listings: {
    label: 'Inter Browse',
    body: `Inter, ${sansFallback}`,
    display: `Inter Tight, Inter, ${sansFallback}`,
    rationale: 'scannable comparison and inventory browsing',
  },
  social: {
    label: 'Nunito Social',
    body: `Nunito, Inter, ${sansFallback}`,
    display: `Nunito, Inter Tight, Inter, ${sansFallback}`,
    rationale: 'approachable participation and belonging',
  },
  special_occasion: {
    label: 'Fraunces Event',
    body: `Inter, ${sansFallback}`,
    display: `Fraunces, "Cormorant Garamond", ${serifFallback}`,
    rationale: 'celebratory editorial presence with readable actions',
  },
};

const showcaseOverrides: Record<
  string,
  {
    colors?: Partial<ReturnType<typeof getSkeedVisualPreset>['colors']>;
    fonts?: Partial<ReturnType<typeof getSkeedTypographyPreset>['fonts']>;
    radius?: string;
    scale?: {
      hero?: Partial<ReturnType<typeof getSkeedTypographyPreset>['scale']['hero']>;
      title?: Partial<ReturnType<typeof getSkeedTypographyPreset>['scale']['title']>;
      body?: Partial<ReturnType<typeof getSkeedTypographyPreset>['scale']['body']>;
    };
    texture?: string;
  }
> = {
  teens: {
    colors: {
      brand: '#7c3aed',
      accent: '#0e7490',
      bg: '#fbf7ff',
      border: '#ddd6fe',
      fg: '#1e1b4b',
      muted: '#5b5574',
    },
    radius: '16px',
  },
  working_class: {
    colors: {
      brand: '#0f766e',
      accent: '#b45309',
      bg: '#f7fbf8',
      border: '#cfe6dc',
      fg: '#10231f',
      muted: '#49635b',
    },
    radius: '9px',
  },
  religious: {
    colors: {
      brand: '#5b21b6',
      accent: '#a16207',
      bg: '#fbf8f1',
      border: '#e7dec9',
      fg: '#292018',
      muted: '#665c4b',
    },
    fonts: {
      body: `"Crimson Text", ${serifFallback}`,
      display: `"Cormorant Garamond", "Libre Baskerville", ${serifFallback}`,
    },
    scale: {
      hero: { weight: '600' },
      title: { weight: '600' },
    },
    texture:
      'radial-gradient(circle at 15% 10%, rgba(161,98,7,.08), transparent 24%), linear-gradient(135deg, rgba(91,33,182,.04), transparent)',
  },
  legal: {
    colors: {
      brand: '#1e3a8a',
      accent: '#7f1d1d',
      bg: '#f8fafc',
      border: '#cbd5e1',
      fg: '#111827',
      muted: '#475569',
    },
    fonts: {
      body: `"Source Sans 3", Inter, ${sansFallback}`,
      display: `"Libre Baskerville", ${serifFallback}`,
    },
    scale: {
      hero: { weight: '700' },
      title: { weight: '700' },
    },
    radius: '4px',
  },
  erp: {
    colors: {
      brand: '#3730a3',
      accent: '#0369a1',
      bg: '#f7f9fc',
      border: '#d7deea',
      fg: '#111827',
      muted: '#4b5563',
    },
    radius: '6px',
  },
  sales_crm: {
    colors: {
      brand: '#2563eb',
      accent: '#0f766e',
      bg: '#f8fbff',
      border: '#dbeafe',
      fg: '#0f172a',
      muted: '#475569',
    },
  },
  hightech: {
    colors: {
      brand: '#4f46e5',
      accent: '#0891b2',
      bg: '#f7f8ff',
      border: '#d9ddff',
      fg: '#111827',
      muted: '#4b5563',
    },
    radius: '12px',
  },
  social: {
    colors: {
      brand: '#db2777',
      accent: '#7c3aed',
      bg: '#fff7fb',
      border: '#fbcfe8',
      fg: '#2a1020',
      muted: '#6b4b5d',
    },
    radius: '18px',
  },
  monitoring: {
    colors: {
      brand: '#0f172a',
      accent: '#16a34a',
      bg: '#f8fafc',
      border: '#cbd5e1',
      fg: '#020617',
      muted: '#475569',
    },
    radius: '6px',
  },
  fintech: {
    colors: {
      brand: '#064e3b',
      accent: '#1d4ed8',
      bg: '#f7fbf8',
      border: '#cfe6dc',
    },
  },
  marketplace: {
    colors: {
      brand: '#c2410c',
      accent: '#0f766e',
      bg: '#fffaf5',
      border: '#fed7aa',
      fg: '#27160b',
      muted: '#674a35',
    },
    radius: '12px',
  },
  listings: {
    colors: {
      brand: '#0f766e',
      accent: '#2563eb',
      bg: '#f8fafc',
      border: '#dbeafe',
    },
  },
  military: {
    colors: {
      brand: '#365314',
      accent: '#854d0e',
      bg: '#f7f7f1',
      border: '#d6d3c2',
      fg: '#1c2118',
      muted: '#575f4e',
    },
    radius: '4px',
  },
  special_occasion: {
    colors: {
      brand: '#be185d',
      accent: '#a16207',
      bg: '#fff7fb',
      border: '#f9a8d4',
      fg: '#32101f',
      muted: '#70465a',
    },
    radius: '18px',
  },
  classic: {
    fonts: {
      body: `"Crimson Text", ${serifFallback}`,
      display: `"Libre Baskerville", ${serifFallback}`,
    },
    scale: {
      hero: { weight: '700' },
      title: { weight: '700' },
      body: { lineHeight: '1.82' },
    },
  },
  classic_ancient: {
    colors: {
      brand: '#7c2d12',
      accent: '#92400e',
      bg: '#f4ead8',
      border: '#c7a77a',
      fg: '#2d1c0f',
      muted: '#6f5337',
      success: '#3f6212',
      danger: '#7f1d1d',
    },
    fonts: {
      body: `"Crimson Text", ${serifFallback}`,
      display: `"Cormorant Garamond", "Libre Baskerville", ${serifFallback}`,
    },
    radius: '3px',
    scale: {
      hero: { size: '3.45rem', lineHeight: '.98', weight: '600' },
      title: { size: '2.25rem', lineHeight: '1.08', weight: '600' },
      body: { size: '1.03rem', lineHeight: '1.85', weight: '400' },
    },
    texture:
      'radial-gradient(circle at 20% 18%, rgba(124,45,18,.11), transparent 22%), radial-gradient(circle at 76% 8%, rgba(146,64,14,.08), transparent 18%), linear-gradient(90deg, rgba(124,45,18,.06) 1px, transparent 1px), linear-gradient(180deg, rgba(124,45,18,.05) 1px, transparent 1px)',
  },
};
