export type SkeedMotionTone =
  | 'calm'
  | 'precise'
  | 'premium'
  | 'playful'
  | 'clinical'
  | 'enterprise';

export type SkeedTypographyPresetId =
  | 'neutral'
  | 'wellness'
  | 'productivity'
  | 'ai'
  | 'education'
  | 'gov'
  | 'kids'
  | 'classic'
  | 'premium'
  | 'clinical'
  | 'enterprise';

export type SkeedVisualPresetId = SkeedTypographyPresetId;
export type SkeedGenderTone = 'neutral' | 'feminine' | 'masculine';

export type SkeedTypographyPreset = {
  id: SkeedTypographyPresetId;
  label: string;
  demographicFit: string[];
  fonts: {
    body: string;
    display: string;
    mono: string;
  };
  scale: {
    hero: SkeedTypeStep;
    title: SkeedTypeStep;
    section: SkeedTypeStep;
    body: SkeedTypeStep;
    caption: SkeedTypeStep;
  };
  cta: {
    radius: string;
    minHeight: string;
    paddingX: string;
    shadow: string;
    primaryWeight: string;
    secondaryWeight: string;
  };
};

export type SkeedVisualPreset = {
  id: SkeedVisualPresetId;
  label: string;
  demographicFit: string[];
  colors: {
    brand: string;
    accent: string;
    bg: string;
    fg: string;
    muted: string;
    border: string;
    success: string;
    danger: string;
  };
  radius: string;
};

type SkeedTypeStep = {
  size: string;
  lineHeight: string;
  letterSpacing: string;
  weight: string;
};

export interface SkeedTailwindOptions {
  tone?: SkeedMotionTone;
  demographic?: string;
  typography?: SkeedTypographyPresetId | SkeedTypographyPreset;
  visual?: SkeedVisualPresetId | SkeedVisualPreset;
  genderTone?: SkeedGenderTone;
  prefix?: string;
}

type CssRule = { [propertyOrSelector: string]: string | CssRule };
type AddUtilities = (utilities: Record<string, CssRule>, options?: unknown) => void;
type AddBase = (base: Record<string, unknown>) => void;
type PluginApi = {
  addBase: AddBase;
  addUtilities: AddUtilities;
};

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
  80: '20rem',
} as const;

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
  9999: '9999px',
} as const;

const shadowScale = {
  0: 'none',
  1: '0 1px 3px rgba(15, 23, 42, .12)',
  2: '0 8px 24px rgba(15, 23, 42, .14)',
  3: '0 16px 38px rgba(15, 23, 42, .16)',
  4: '0 24px 60px rgba(15, 23, 42, .18)',
} as const;

const toneDurations: Record<SkeedMotionTone, { fast: string; base: string; slow: string }> = {
  calm: { fast: '120ms', base: '180ms', slow: '220ms' },
  precise: { fast: '90ms', base: '140ms', slow: '200ms' },
  premium: { fast: '140ms', base: '220ms', slow: '320ms' },
  playful: { fast: '130ms', base: '210ms', slow: '300ms' },
  clinical: { fast: '100ms', base: '160ms', slow: '200ms' },
  enterprise: { fast: '90ms', base: '140ms', slow: '180ms' },
};

export const skeedTypographyPresets: Record<SkeedTypographyPresetId, SkeedTypographyPreset> = {
  neutral: {
    id: 'neutral',
    label: 'Neutral product UI',
    demographicFit: ['default', 'saas', 'general'],
    fonts: {
      body: 'Inter, Aptos, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      display:
        'Inter, Aptos Display, Aptos, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      mono: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace',
    },
    scale: {
      hero: typeStep('3.25rem', '.98', '0', '760'),
      title: typeStep('2.25rem', '1.05', '0', '720'),
      section: typeStep('1.5rem', '1.18', '0', '680'),
      body: typeStep('1rem', '1.65', '0', '400'),
      caption: typeStep('.875rem', '1.45', '0', '500'),
    },
    cta: ctaPreset('8px', '2.5rem', '1rem', '0 8px 18px rgba(15, 23, 42, .12)', '650', '600'),
  },
  wellness: {
    id: 'wellness',
    label: 'Wellness clarity',
    demographicFit: ['health', 'wellness', 'mental_wellness', 'fitness', 'family'],
    fonts: {
      body: 'Atkinson Hyperlegible, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      display:
        'Inter, Atkinson Hyperlegible, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      mono: '"SFMono-Regular", Consolas, monospace',
    },
    scale: {
      hero: typeStep('3rem', '1.04', '0', '720'),
      title: typeStep('2rem', '1.12', '0', '680'),
      section: typeStep('1.5rem', '1.25', '0', '650'),
      body: typeStep('1rem', '1.72', '0', '400'),
      caption: typeStep('.875rem', '1.5', '0', '500'),
    },
    cta: ctaPreset('10px', '2.75rem', '1.125rem', '0 8px 18px rgba(15, 23, 42, .10)', '650', '600'),
  },
  productivity: {
    id: 'productivity',
    label: 'Productivity dense',
    demographicFit: ['productivity', 'developer_tools', 'crm', 'erp', 'monitoring'],
    fonts: {
      body: '"IBM Plex Sans", Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      display:
        'Inter Tight, "IBM Plex Sans", Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      mono: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace',
    },
    scale: {
      hero: typeStep('2.5rem', '.98', '0', '760'),
      title: typeStep('1.875rem', '1.08', '0', '720'),
      section: typeStep('1.25rem', '1.22', '0', '680'),
      body: typeStep('.9375rem', '1.58', '0', '400'),
      caption: typeStep('.8125rem', '1.42', '0', '520'),
    },
    cta: ctaPreset('7px', '2.375rem', '.875rem', '0 6px 14px rgba(15, 23, 42, .10)', '650', '600'),
  },
  ai: {
    id: 'ai',
    label: 'AI assistant expressive',
    demographicFit: ['ai', 'assistant', 'creator_tools', 'voice'],
    fonts: {
      body: 'Inter, Aptos, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      display:
        'Inter Tight, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      mono: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace',
    },
    scale: {
      hero: typeStep('3.5rem', '.94', '0', '780'),
      title: typeStep('2.375rem', '1.02', '0', '740'),
      section: typeStep('1.5rem', '1.16', '0', '690'),
      body: typeStep('1rem', '1.62', '0', '400'),
      caption: typeStep('.875rem', '1.44', '0', '520'),
    },
    cta: ctaPreset(
      '12px',
      '2.75rem',
      '1.125rem',
      '0 12px 28px rgba(79, 70, 229, .22)',
      '700',
      '620',
    ),
  },
  education: {
    id: 'education',
    label: 'Education readable',
    demographicFit: ['education', 'learning', 'students', 'teachers'],
    fonts: {
      body: 'Atkinson Hyperlegible, Aptos, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      display:
        'Atkinson Hyperlegible, Aptos Display, Aptos, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      mono: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace',
    },
    scale: {
      hero: typeStep('3rem', '1.06', '0', '720'),
      title: typeStep('2rem', '1.14', '0', '690'),
      section: typeStep('1.5rem', '1.28', '0', '660'),
      body: typeStep('1rem', '1.76', '0', '400'),
      caption: typeStep('.875rem', '1.52', '0', '520'),
    },
    cta: ctaPreset('9px', '2.75rem', '1.125rem', '0 8px 18px rgba(15, 23, 42, .10)', '660', '600'),
  },
  gov: {
    id: 'gov',
    label: 'Civic accessible',
    demographicFit: ['gov', 'public_sector', 'civic', 'nonprofit'],
    fonts: {
      body: 'Source Sans 3, Aptos, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      display:
        'Source Sans 3, Aptos Display, Aptos, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      mono: '"SFMono-Regular", Consolas, monospace',
    },
    scale: {
      hero: typeStep('2.75rem', '1.08', '0', '720'),
      title: typeStep('1.875rem', '1.16', '0', '690'),
      section: typeStep('1.375rem', '1.28', '0', '660'),
      body: typeStep('1rem', '1.76', '0', '400'),
      caption: typeStep('.875rem', '1.52', '0', '520'),
    },
    cta: ctaPreset('6px', '2.75rem', '1rem', 'none', '700', '620'),
  },
  kids: {
    id: 'kids',
    label: 'Young playful',
    demographicFit: ['kids', 'family', 'gen_alpha', 'youth'],
    fonts: {
      body: 'Nunito, Aptos, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      display:
        'Nunito, Aptos Display, Aptos, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      mono: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace',
    },
    scale: {
      hero: typeStep('3.25rem', '1', '0', '800'),
      title: typeStep('2.125rem', '1.08', '0', '760'),
      section: typeStep('1.625rem', '1.18', '0', '720'),
      body: typeStep('1.0625rem', '1.7', '0', '450'),
      caption: typeStep('.875rem', '1.48', '0', '600'),
    },
    cta: ctaPreset('14px', '3rem', '1.25rem', '0 12px 24px rgba(15, 23, 42, .14)', '760', '680'),
  },
  classic: {
    id: 'classic',
    label: 'Classic editorial trust',
    demographicFit: [
      'classic',
      'legal',
      'religious',
      'heritage',
      'traditional',
      'professional_services',
    ],
    fonts: {
      body: '"Crimson Text", Georgia, Cambria, "Times New Roman", ui-serif, serif',
      display:
        '"Libre Baskerville", Georgia, Cambria, "Times New Roman", ui-serif, serif',
      mono: '"SFMono-Regular", Consolas, monospace',
    },
    scale: {
      hero: typeStep('3.25rem', '.98', '0', '700'),
      title: typeStep('2.25rem', '1.08', '0', '700'),
      section: typeStep('1.5rem', '1.26', '0', '600'),
      body: typeStep('1rem', '1.76', '0', '400'),
      caption: typeStep('.875rem', '1.5', '.01em', '540'),
    },
    cta: ctaPreset('5px', '2.625rem', '1.125rem', '0 8px 18px rgba(15, 23, 42, .10)', '640', '560'),
  },
  premium: {
    id: 'premium',
    label: 'Premium editorial',
    demographicFit: ['luxury', 'fashion', 'hospitality', 'portfolio', 'premium'],
    fonts: {
      body: 'Inter, Aptos, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      display:
        'Fraunces, Optima, Georgia, Cambria, "Times New Roman", ui-serif, serif',
      mono: '"SFMono-Regular", Consolas, monospace',
    },
    scale: {
      hero: typeStep('3.75rem', '.92', '0', '650'),
      title: typeStep('2.5rem', '1', '0', '650'),
      section: typeStep('1.625rem', '1.2', '0', '650'),
      body: typeStep('1rem', '1.72', '0', '400'),
      caption: typeStep('.8125rem', '1.5', '.04em', '560'),
    },
    cta: ctaPreset('6px', '2.75rem', '1.25rem', '0 12px 30px rgba(15, 23, 42, .16)', '620', '560'),
  },
  clinical: {
    id: 'clinical',
    label: 'Clinical high trust',
    demographicFit: ['clinical', 'healthcare', 'medical', 'wellness'],
    fonts: {
      body: 'Atkinson Hyperlegible, Aptos, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      display:
        'Atkinson Hyperlegible, Aptos Display, Aptos, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      mono: '"SFMono-Regular", Consolas, monospace',
    },
    scale: {
      hero: typeStep('2.75rem', '1.08', '0', '720'),
      title: typeStep('1.875rem', '1.16', '0', '700'),
      section: typeStep('1.375rem', '1.3', '0', '660'),
      body: typeStep('1rem', '1.78', '0', '400'),
      caption: typeStep('.875rem', '1.54', '0', '540'),
    },
    cta: ctaPreset('8px', '2.75rem', '1rem', '0 6px 14px rgba(15, 23, 42, .09)', '680', '620'),
  },
  enterprise: {
    id: 'enterprise',
    label: 'Enterprise operational',
    demographicFit: ['enterprise', 'b2b', 'erp', 'finance', 'security'],
    fonts: {
      body: '"IBM Plex Sans", Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      display:
        '"IBM Plex Sans", Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      mono: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace',
    },
    scale: {
      hero: typeStep('2.5rem', '.98', '0', '760'),
      title: typeStep('1.875rem', '1.08', '0', '720'),
      section: typeStep('1.25rem', '1.24', '0', '680'),
      body: typeStep('.9375rem', '1.58', '0', '400'),
      caption: typeStep('.8125rem', '1.42', '0', '520'),
    },
    cta: ctaPreset('6px', '2.375rem', '.875rem', '0 4px 10px rgba(15, 23, 42, .08)', '650', '600'),
  },
};

export const skeedVisualPresets: Record<SkeedVisualPresetId, SkeedVisualPreset> = {
  neutral: visualPreset('neutral', 'Neutral product UI', ['default', 'saas', 'general'], {
    brand: '#4f46e5',
    accent: '#0369a1',
    bg: '#fafafa',
    fg: '#0a0a0a',
    muted: '#525252',
    border: '#e5e5e5',
    success: '#15803d',
    danger: '#b91c1c',
  }),
  wellness: visualPreset('wellness', 'Wellness clarity', ['health', 'wellness', 'fitness'], {
    brand: '#0f766e',
    accent: '#2563eb',
    bg: '#f8fafc',
    fg: '#0f172a',
    muted: '#475569',
    border: '#dbe5e8',
    success: '#15803d',
    danger: '#b91c1c',
  }),
  productivity: visualPreset(
    'productivity',
    'Productivity dense',
    ['productivity', 'developer_tools', 'crm', 'erp'],
    {
      brand: '#4f46e5',
      accent: '#0f766e',
      bg: '#f8fafc',
      fg: '#111827',
      muted: '#4b5563',
      border: '#e2e8f0',
      success: '#15803d',
      danger: '#b91c1c',
    },
    '7px',
  ),
  ai: visualPreset('ai', 'AI assistant expressive', ['ai', 'assistant', 'creator_tools'], {
    brand: '#7c3aed',
    accent: '#0e7490',
    bg: '#fbfbff',
    fg: '#111827',
    muted: '#4b5563',
    border: '#e5e7eb',
    success: '#16a34a',
    danger: '#dc2626',
  }),
  education: visualPreset(
    'education',
    'Education readable',
    ['education', 'learning', 'students'],
    {
      brand: '#2563eb',
      accent: '#b45309',
      bg: '#fffdf7',
      fg: '#111827',
      muted: '#4b5563',
      border: '#e8e1d2',
      success: '#15803d',
      danger: '#b91c1c',
    },
  ),
  gov: visualPreset(
    'gov',
    'Civic accessible',
    ['gov', 'public_sector', 'civic'],
    {
      brand: '#1d4ed8',
      accent: '#991b1b',
      bg: '#f8fafc',
      fg: '#0f172a',
      muted: '#475569',
      border: '#cbd5e1',
      success: '#166534',
      danger: '#991b1b',
    },
    '6px',
  ),
  kids: visualPreset(
    'kids',
    'Young playful',
    ['kids', 'family', 'gen_alpha'],
    {
      brand: '#0f766e',
      accent: '#c2410c',
      bg: '#fffaf3',
      fg: '#172554',
      muted: '#4b5563',
      border: '#fed7aa',
      success: '#16a34a',
      danger: '#dc2626',
    },
    '14px',
  ),
  classic: visualPreset(
    'classic',
    'Classic editorial trust',
    ['classic', 'legal', 'heritage', 'traditional'],
    {
      brand: '#7f1d1d',
      accent: '#854d0e',
      bg: '#fbfaf8',
      fg: '#1c1917',
      muted: '#57534e',
      border: '#d6d3d1',
      success: '#166534',
      danger: '#991b1b',
    },
    '5px',
  ),
  premium: visualPreset(
    'premium',
    'Premium editorial',
    ['luxury', 'fashion', 'premium'],
    {
      brand: '#18181b',
      accent: '#a16207',
      bg: '#fafafa',
      fg: '#09090b',
      muted: '#52525b',
      border: '#d4d4d8',
      success: '#15803d',
      danger: '#b91c1c',
    },
    '6px',
  ),
  clinical: visualPreset('clinical', 'Clinical high trust', ['clinical', 'healthcare', 'medical'], {
    brand: '#0369a1',
    accent: '#0f766e',
    bg: '#f8fafc',
    fg: '#0f172a',
    muted: '#475569',
    border: '#dbeafe',
    success: '#166534',
    danger: '#991b1b',
  }),
  enterprise: visualPreset(
    'enterprise',
    'Enterprise operational',
    ['enterprise', 'b2b', 'finance'],
    {
      brand: '#3730a3',
      accent: '#0369a1',
      bg: '#f8fafc',
      fg: '#0f172a',
      muted: '#475569',
      border: '#d9e1ee',
      success: '#15803d',
      danger: '#b91c1c',
    },
    '6px',
  ),
};

const palette = {
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
    950: '#1e1b4b',
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
    950: '#0a0a0a',
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
    950: '#052e16',
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
    950: '#451a03',
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
    950: '#450a0a',
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
    950: '#082f49',
  },
} as const;

export function createSkeedTailwindPreset(options: SkeedTailwindOptions = {}) {
  const tone = options.tone ?? 'precise';
  const durations = toneDurations[tone];
  const typography = resolveTypographyPreset(options);
  return {
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
            danger: 'var(--skeed-danger)',
          },
          'skeed-color': skeedColorTheme(),
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
          'skeed-density-cozy-pady': '.75rem',
        }),
        borderRadius: {
          skeed: 'var(--skeed-radius)',
          'skeed-radius-sm': 'var(--skeed-radius-sm)',
          'skeed-radius-md': 'var(--skeed-radius-md)',
          'skeed-radius-lg': 'var(--skeed-radius-lg)',
          'skeed-radius-xl': 'var(--skeed-radius-xl)',
          ...legacyTokenTheme('skeed-radius', radiusScale),
        },
        boxShadow: {
          'skeed-shadow-sm': 'var(--skeed-shadow-sm)',
          'skeed-shadow-md': 'var(--skeed-shadow-md)',
          'skeed-shadow-lg': 'var(--skeed-shadow-lg)',
          'skeed-shadow-xl': 'var(--skeed-shadow-xl)',
          ...legacyTokenTheme('skeed-shadow', shadowScale),
        },
        fontFamily: {
          'skeed-body': 'var(--skeed-font-body-family)',
          'skeed-display': 'var(--skeed-font-display-family)',
          'skeed-mono': 'var(--skeed-font-mono-family)',
        },
        fontSize: {
          'skeed-hero': tailwindTypeStep(typography.scale.hero),
          'skeed-title': tailwindTypeStep(typography.scale.title),
          'skeed-section': tailwindTypeStep(typography.scale.section),
          'skeed-body': tailwindTypeStep(typography.scale.body),
          'skeed-caption': tailwindTypeStep(typography.scale.caption),
        },
        transitionDuration: {
          'skeed-fast': durations.fast,
          'skeed-base': durations.base,
          'skeed-slow': durations.slow,
          'skeed-motion-duration-fast': durations.fast,
          'skeed-motion-duration-normal': durations.base,
          'skeed-motion-duration-slow': durations.slow,
        },
        transitionTimingFunction: {
          skeed: 'var(--skeed-ease, cubic-bezier(.2, .8, .2, 1))',
          'skeed-motion-easing-default': 'var(--skeed-ease, cubic-bezier(.2, .8, .2, 1))',
          'skeed-motion-easing-elegant': 'cubic-bezier(.16, 1, .3, 1)',
          'skeed-motion-easing-bounce': 'cubic-bezier(.34, 1.56, .64, 1)',
        },
        keyframes: {
          'skeed-fade-in': {
            from: { opacity: '0' },
            to: { opacity: '1' },
          },
          'skeed-slide-up': {
            from: { opacity: '0', transform: 'translate3d(0, 10px, 0)' },
            to: { opacity: '1', transform: 'translate3d(0, 0, 0)' },
          },
          'skeed-soft-pulse': {
            '0%, 100%': { opacity: '1' },
            '50%': { opacity: '.72' },
          },
        },
        animation: {
          'skeed-fade-in': 'skeed-fade-in var(--skeed-motion-base, 180ms) var(--skeed-ease) both',
          'skeed-slide-up': 'skeed-slide-up var(--skeed-motion-base, 180ms) var(--skeed-ease) both',
          'skeed-soft-pulse': 'skeed-soft-pulse 1.8s cubic-bezier(.4, 0, .6, 1) infinite',
        },
      },
    },
    plugins: [createSkeedMicroInteractionsPlugin(options)],
  };
}

export const skeedTailwindPreset = createSkeedTailwindPreset();

export function createSkeedMicroInteractionsPlugin(options: SkeedTailwindOptions = {}) {
  const typography = resolveTypographyPreset(options);
  const visual = resolveVisualPreset(options);
  const genderTone = options.genderTone ?? 'neutral';
  const durations = toneDurations[options.tone ?? 'precise'];
  return function skeedMicroInteractionsPlugin({ addBase, addUtilities }: PluginApi): void {
    addBase({
      ':root': {
        ...skeedColorVariables(),
        ...visualVariables(visual, genderTone),
        '--skeed-motion-fast': durations.fast,
        '--skeed-motion-base': durations.base,
        '--skeed-motion-slow': durations.slow,
        '--skeed-ease': 'cubic-bezier(.2, .8, .2, 1)',
        ...typographyVariables(typography),
      },
      '@media (prefers-reduced-motion: reduce)': {
        ':root': {
          '--skeed-motion-fast': '1ms',
          '--skeed-motion-base': '1ms',
          '--skeed-motion-slow': '1ms',
        },
        '*, ::before, ::after': {
          'animation-duration': '1ms !important',
          'animation-iteration-count': '1 !important',
          'scroll-behavior': 'auto !important',
          'transition-duration': '1ms !important',
        },
      },
      '.skeed-dark, [data-skeed-theme="dark"]': {
        '--skeed-bg': 'var(--skeed-color-neutral-950)',
        '--skeed-surface': 'var(--skeed-color-neutral-900)',
        '--skeed-surface-muted': 'var(--skeed-color-neutral-800)',
        '--skeed-fg': 'var(--skeed-color-neutral-50)',
        '--skeed-muted': 'var(--skeed-color-neutral-300)',
        '--skeed-border': 'var(--skeed-color-neutral-700)',
        '--skeed-success': 'var(--skeed-color-success-300)',
        '--skeed-warning': 'var(--skeed-color-warning-300)',
        '--skeed-danger': 'var(--skeed-color-danger-300)',
        color: 'var(--skeed-fg)',
        background: 'var(--skeed-bg)',
      },
      '.skeed-dark.bg-white, .skeed-dark .bg-white, [data-skeed-theme="dark"].bg-white, [data-skeed-theme="dark"] .bg-white':
        {
          'background-color': 'var(--skeed-surface)',
        },
      '.skeed-dark.bg-skeed-bg, .skeed-dark.bg-skeed-color-neutral-50, .skeed-dark.bg-skeed-color-neutral-100, [data-skeed-theme="dark"].bg-skeed-bg, [data-skeed-theme="dark"].bg-skeed-color-neutral-50, [data-skeed-theme="dark"].bg-skeed-color-neutral-100':
        {
          'background-color': 'var(--skeed-surface-muted)',
        },
      '.skeed-dark.border-skeed-border, [data-skeed-theme="dark"].border-skeed-border': {
        'border-color': 'var(--skeed-border)',
      },
      '.skeed-dark.border-white, [data-skeed-theme="dark"].border-white': {
        'border-color': 'var(--skeed-surface)',
      },
      '.skeed-dark.bg-skeed-color-brand-50, .skeed-dark.bg-skeed-color-brand-100, .skeed-dark.bg-skeed-color-info-50, .skeed-dark.bg-skeed-color-info-100, [data-skeed-theme="dark"].bg-skeed-color-brand-50, [data-skeed-theme="dark"].bg-skeed-color-brand-100, [data-skeed-theme="dark"].bg-skeed-color-info-50, [data-skeed-theme="dark"].bg-skeed-color-info-100':
        {
          'background-color': 'color-mix(in srgb, var(--skeed-brand) 18%, var(--skeed-surface))',
        },
      '.skeed-dark.bg-skeed-color-success-50, .skeed-dark.bg-skeed-color-success-100, [data-skeed-theme="dark"].bg-skeed-color-success-50, [data-skeed-theme="dark"].bg-skeed-color-success-100':
        {
          'background-color': 'color-mix(in srgb, var(--skeed-success) 16%, var(--skeed-surface))',
        },
      '.skeed-dark.bg-skeed-color-danger-50, .skeed-dark.bg-skeed-color-danger-100, [data-skeed-theme="dark"].bg-skeed-color-danger-50, [data-skeed-theme="dark"].bg-skeed-color-danger-100':
        {
          'background-color': 'color-mix(in srgb, var(--skeed-danger) 16%, var(--skeed-surface))',
        },
      '.skeed-dark .bg-white, [data-skeed-theme="dark"] .bg-white': {
        'background-color': 'var(--skeed-surface)',
      },
      '.skeed-dark .bg-skeed-bg, .skeed-dark .bg-skeed-color-neutral-50, .skeed-dark .bg-skeed-color-neutral-100, [data-skeed-theme="dark"] .bg-skeed-bg, [data-skeed-theme="dark"] .bg-skeed-color-neutral-50, [data-skeed-theme="dark"] .bg-skeed-color-neutral-100':
        {
          'background-color': 'var(--skeed-surface-muted)',
        },
      '.skeed-dark .border-skeed-border, [data-skeed-theme="dark"] .border-skeed-border': {
        'border-color': 'var(--skeed-border)',
      },
      '.skeed-dark .border-white, [data-skeed-theme="dark"] .border-white': {
        'border-color': 'var(--skeed-surface)',
      },
      '.skeed-dark .text-skeed-brand, .skeed-dark .text-skeed-color-brand-600, .skeed-dark .text-skeed-color-brand-700, .skeed-dark .text-skeed-color-brand-800, .skeed-dark .text-skeed-color-brand-900, [data-skeed-theme="dark"] .text-skeed-brand, [data-skeed-theme="dark"] .text-skeed-color-brand-600, [data-skeed-theme="dark"] .text-skeed-color-brand-700, [data-skeed-theme="dark"] .text-skeed-color-brand-800, [data-skeed-theme="dark"] .text-skeed-color-brand-900':
        {
          color: 'var(--skeed-brand-text-dark)',
        },
      '.skeed-dark .text-skeed-accent, .skeed-dark .text-skeed-color-info-600, .skeed-dark .text-skeed-color-info-700, .skeed-dark .text-skeed-color-info-800, .skeed-dark .text-skeed-color-info-900, [data-skeed-theme="dark"] .text-skeed-accent, [data-skeed-theme="dark"] .text-skeed-color-info-600, [data-skeed-theme="dark"] .text-skeed-color-info-700, [data-skeed-theme="dark"] .text-skeed-color-info-800, [data-skeed-theme="dark"] .text-skeed-color-info-900':
        {
          color: 'var(--skeed-accent-text-dark)',
        },
      '.skeed-dark .text-skeed-color-neutral-700, .skeed-dark .text-skeed-color-neutral-800, .skeed-dark .text-skeed-color-neutral-900, .skeed-dark .text-skeed-color-neutral-950, [data-skeed-theme="dark"] .text-skeed-color-neutral-700, [data-skeed-theme="dark"] .text-skeed-color-neutral-800, [data-skeed-theme="dark"] .text-skeed-color-neutral-900, [data-skeed-theme="dark"] .text-skeed-color-neutral-950':
        {
          color: 'var(--skeed-fg)',
        },
      '.skeed-dark .text-skeed-color-neutral-400, .skeed-dark .text-skeed-color-neutral-500, .skeed-dark .text-skeed-color-neutral-600, [data-skeed-theme="dark"] .text-skeed-color-neutral-400, [data-skeed-theme="dark"] .text-skeed-color-neutral-500, [data-skeed-theme="dark"] .text-skeed-color-neutral-600':
        {
          color: 'var(--skeed-muted)',
        },
      '.skeed-dark .text-skeed-color-success-600, .skeed-dark .text-skeed-color-success-700, .skeed-dark .text-skeed-color-success-800, .skeed-dark .text-skeed-color-success-900, [data-skeed-theme="dark"] .text-skeed-color-success-600, [data-skeed-theme="dark"] .text-skeed-color-success-700, [data-skeed-theme="dark"] .text-skeed-color-success-800, [data-skeed-theme="dark"] .text-skeed-color-success-900':
        {
          color: 'var(--skeed-success)',
        },
      '.skeed-dark .text-skeed-warning, .skeed-dark .text-skeed-color-warning-600, .skeed-dark .text-skeed-color-warning-700, .skeed-dark .text-skeed-color-warning-800, .skeed-dark .text-skeed-color-warning-900, [data-skeed-theme="dark"] .text-skeed-warning, [data-skeed-theme="dark"] .text-skeed-color-warning-600, [data-skeed-theme="dark"] .text-skeed-color-warning-700, [data-skeed-theme="dark"] .text-skeed-color-warning-800, [data-skeed-theme="dark"] .text-skeed-color-warning-900':
        {
          color: 'var(--skeed-warning)',
        },
      '.skeed-dark .text-skeed-color-danger-600, .skeed-dark .text-skeed-color-danger-700, .skeed-dark .text-skeed-color-danger-800, .skeed-dark .text-skeed-color-danger-900, [data-skeed-theme="dark"] .text-skeed-color-danger-600, [data-skeed-theme="dark"] .text-skeed-color-danger-700, [data-skeed-theme="dark"] .text-skeed-color-danger-800, [data-skeed-theme="dark"] .text-skeed-color-danger-900':
        {
          color: 'var(--skeed-danger)',
        },
      '.skeed-dark .bg-skeed-color-brand-50, .skeed-dark .bg-skeed-color-brand-100, .skeed-dark .bg-skeed-color-info-50, .skeed-dark .bg-skeed-color-info-100, [data-skeed-theme="dark"] .bg-skeed-color-brand-50, [data-skeed-theme="dark"] .bg-skeed-color-brand-100, [data-skeed-theme="dark"] .bg-skeed-color-info-50, [data-skeed-theme="dark"] .bg-skeed-color-info-100':
        {
          'background-color': 'color-mix(in srgb, var(--skeed-brand) 18%, var(--skeed-surface))',
        },
      '.skeed-dark .bg-skeed-color-success-50, .skeed-dark .bg-skeed-color-success-100, [data-skeed-theme="dark"] .bg-skeed-color-success-50, [data-skeed-theme="dark"] .bg-skeed-color-success-100':
        {
          'background-color': 'color-mix(in srgb, var(--skeed-success) 16%, var(--skeed-surface))',
        },
      '.skeed-dark .bg-skeed-color-danger-50, .skeed-dark .bg-skeed-color-danger-100, [data-skeed-theme="dark"] .bg-skeed-color-danger-50, [data-skeed-theme="dark"] .bg-skeed-color-danger-100':
        {
          'background-color': 'color-mix(in srgb, var(--skeed-danger) 16%, var(--skeed-surface))',
        },
      '.skeed-dark .bg-skeed-warning, .skeed-dark .bg-skeed-color-warning-50, .skeed-dark .bg-skeed-color-warning-100, [data-skeed-theme="dark"] .bg-skeed-warning, [data-skeed-theme="dark"] .bg-skeed-color-warning-50, [data-skeed-theme="dark"] .bg-skeed-color-warning-100':
        {
          'background-color': 'color-mix(in srgb, var(--skeed-warning) 16%, var(--skeed-surface))',
        },
    });
    addUtilities(
      {
        '.skeed-type-page': {
          color: 'var(--skeed-fg)',
          'font-family': 'var(--skeed-font-body-family)',
          'font-size': 'var(--skeed-type-body-size)',
          'line-height': 'var(--skeed-type-body-line)',
          'letter-spacing': 'var(--skeed-type-body-tracking)',
          'font-weight': 'var(--skeed-type-body-weight)',
          'overflow-wrap': 'break-word',
          'word-break': 'normal',
          'text-rendering': 'optimizeLegibility',
        },
        '.skeed-type-display': {
          'font-family': 'var(--skeed-font-display-family)',
        },
        '.skeed-smart-text': {
          hyphens: 'auto',
          'overflow-wrap': 'break-word',
          'word-break': 'normal',
        },
        '.skeed-smart-title': {
          hyphens: 'auto',
          'overflow-wrap': 'break-word',
          'text-wrap': 'balance',
          'word-break': 'normal',
        },
        '.skeed-adaptive-grid-2': {
          'grid-template-columns': 'repeat(auto-fit, minmax(min(16rem, 100%), 1fr))',
        },
        '.skeed-adaptive-grid-3': {
          'grid-template-columns': 'repeat(auto-fit, minmax(min(12rem, 100%), 1fr))',
        },
        '.skeed-adaptive-grid-dense': {
          'grid-template-columns': 'repeat(auto-fit, minmax(min(9rem, 100%), 1fr))',
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
          'word-break': 'normal',
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
          'word-break': 'normal',
        },
        '.skeed-type-section': {
          'font-family': 'var(--skeed-font-display-family)',
          'font-size': 'var(--skeed-type-section-size)',
          'line-height': 'var(--skeed-type-section-line)',
          'letter-spacing': 'var(--skeed-type-section-tracking)',
          'font-weight': 'var(--skeed-type-section-weight)',
          hyphens: 'auto',
          'overflow-wrap': 'break-word',
          'text-wrap': 'balance',
          'word-break': 'normal',
        },
        '.skeed-type-body': {
          'font-family': 'var(--skeed-font-body-family)',
          'font-size': 'var(--skeed-type-body-size)',
          'line-height': 'var(--skeed-type-body-line)',
          'letter-spacing': 'var(--skeed-type-body-tracking)',
          'font-weight': 'var(--skeed-type-body-weight)',
          'overflow-wrap': 'break-word',
          'word-break': 'normal',
        },
        '.skeed-type-caption': {
          'font-family': 'var(--skeed-font-body-family)',
          'font-size': 'var(--skeed-type-caption-size)',
          'line-height': 'var(--skeed-type-caption-line)',
          'letter-spacing': 'var(--skeed-type-caption-tracking)',
          'font-weight': 'var(--skeed-type-caption-weight)',
          'overflow-wrap': 'break-word',
          'word-break': 'normal',
        },
        '.skeed-eyebrow': {
          color: 'var(--skeed-accent)',
          'font-family': 'var(--skeed-font-body-family)',
          'font-size': 'var(--skeed-type-caption-size)',
          'font-weight': '700',
          'letter-spacing': 'var(--skeed-eyebrow-tracking)',
          'line-height': '1.2',
          'text-transform': 'uppercase',
        },
        '.skeed-sheen, .skeed-sheen-soft': {
          isolation: 'isolate',
          overflow: 'hidden',
          position: 'relative',
        },
        '.skeed-sheen::after, .skeed-sheen-soft::after': {
          content: '""',
          position: 'absolute',
          inset: '-2px',
          transform: 'translateX(-130%) skewX(-18deg)',
          transition: 'transform var(--skeed-motion-slow) var(--skeed-ease)',
          'pointer-events': 'none',
          'z-index': '0',
        },
        '.skeed-sheen::after': {
          background:
            'linear-gradient(105deg, transparent 32%, rgba(255, 255, 255, .34) 48%, transparent 64%)',
        },
        '.skeed-sheen-soft::after': {
          background:
            'linear-gradient(105deg, transparent 32%, color-mix(in srgb, var(--skeed-brand) 16%, transparent) 48%, transparent 64%)',
        },
        '.skeed-sheen:hover::after, .skeed-sheen-soft:hover::after': {
          transform: 'translateX(130%) skewX(-18deg)',
        },
        '.skeed-sheen > *, .skeed-sheen-soft > *': {
          position: 'relative',
          'z-index': '1',
        },
        '.skeed-cta-primary': {
          'align-items': 'center',
          background:
            'linear-gradient(135deg, var(--skeed-brand), color-mix(in srgb, var(--skeed-brand) 72%, var(--skeed-accent)))',
          'border-radius': 'var(--skeed-cta-radius)',
          color: 'white',
          display: 'inline-flex',
          'font-family': 'var(--skeed-font-body-family)',
          'font-size': 'var(--skeed-type-caption-size)',
          'font-weight': 'var(--skeed-cta-primary-weight)',
          'justify-content': 'center',
          'min-height': 'var(--skeed-cta-min-height)',
          isolation: 'isolate',
          'max-width': '100%',
          overflow: 'hidden',
          padding: '0 var(--skeed-cta-padding-x)',
          position: 'relative',
          'box-shadow': 'var(--skeed-cta-shadow)',
          'text-align': 'center',
          'text-wrap': 'balance',
          transition:
            'transform var(--skeed-motion-fast) var(--skeed-ease), box-shadow var(--skeed-motion-base) var(--skeed-ease), background-color var(--skeed-motion-base) var(--skeed-ease)',
          'white-space': 'normal',
        },
        '.skeed-cta-primary::after': {
          background:
            'linear-gradient(105deg, transparent 32%, rgba(255, 255, 255, .34) 48%, transparent 64%)',
          content: '""',
          position: 'absolute',
          inset: '-2px',
          transform: 'translateX(-130%) skewX(-18deg)',
          transition: 'transform var(--skeed-motion-slow) var(--skeed-ease)',
          'pointer-events': 'none',
        },
        '.skeed-cta-primary:hover': {
          'box-shadow': 'var(--skeed-cta-shadow-hover)',
        },
        '.skeed-cta-primary:hover::after': {
          transform: 'translateX(130%) skewX(-18deg)',
        },
        '.skeed-cta-primary:active': {
          transform: 'scale(.985)',
        },
        '.skeed-cta-secondary': {
          'align-items': 'center',
          background: 'white',
          'border-color': 'var(--skeed-border)',
          'border-radius': 'var(--skeed-cta-radius)',
          'border-style': 'solid',
          'border-width': '1px',
          color: 'var(--skeed-fg)',
          display: 'inline-flex',
          'font-family': 'var(--skeed-font-body-family)',
          'font-size': 'var(--skeed-type-caption-size)',
          'font-weight': 'var(--skeed-cta-secondary-weight)',
          'justify-content': 'center',
          'max-width': '100%',
          'min-height': 'var(--skeed-cta-min-height)',
          padding: '0 var(--skeed-cta-padding-x)',
          'text-align': 'center',
          'text-wrap': 'balance',
          transition:
            'transform var(--skeed-motion-fast) var(--skeed-ease), border-color var(--skeed-motion-base) var(--skeed-ease), background-color var(--skeed-motion-base) var(--skeed-ease)',
          'white-space': 'normal',
        },
        '.skeed-cta-secondary:hover': {
          'border-color': 'color-mix(in srgb, var(--skeed-brand) 42%, var(--skeed-border))',
          background: 'color-mix(in srgb, var(--skeed-brand) 4%, white)',
        },
        '.skeed-cta-secondary:active': {
          transform: 'scale(.985)',
        },
        '.skeed-focus-ring': {
          outline: '2px solid transparent',
          'outline-offset': '2px',
          'box-shadow': '0 0 0 3px color-mix(in srgb, var(--skeed-brand) 32%, transparent)',
        },
        '.skeed-hover-lift': {
          transform: 'translate3d(0, 0, 0)',
          transition:
            'transform var(--skeed-motion-base) var(--skeed-ease), box-shadow var(--skeed-motion-base) var(--skeed-ease)',
          'will-change': 'transform',
        },
        '.skeed-hover-lift:hover': {
          transform: 'translate3d(0, -2px, 0)',
          'box-shadow': '0 14px 30px rgba(15, 23, 42, .12)',
        },
        '.skeed-press-soft': {
          transition: 'transform var(--skeed-motion-fast) var(--skeed-ease)',
        },
        '.skeed-press-soft:active': {
          transform: 'scale(.985)',
        },
        '.skeed-enter-fade': {
          animation: 'skeed-fade-in var(--skeed-motion-base) var(--skeed-ease) both',
        },
        '.skeed-enter-slide-up': {
          animation: 'skeed-slide-up var(--skeed-motion-base) var(--skeed-ease) both',
        },
        '.skeed-state-success': {
          color: 'var(--skeed-success)',
          'border-color': 'color-mix(in srgb, var(--skeed-success) 28%, transparent)',
          background: 'color-mix(in srgb, var(--skeed-success) 8%, transparent)',
        },
        '.skeed-state-error': {
          color: 'var(--skeed-danger)',
          'border-color': 'color-mix(in srgb, var(--skeed-danger) 28%, transparent)',
          background: 'color-mix(in srgb, var(--skeed-danger) 8%, transparent)',
        },
        '@media (prefers-reduced-motion: reduce)': {
          '.skeed-hover-lift, .skeed-hover-lift:hover, .skeed-press-soft:active, .skeed-cta-primary:active, .skeed-cta-secondary:active':
            {
              transform: 'none !important',
              'will-change': 'auto',
            },
          '.skeed-enter-fade, .skeed-enter-slide-up': {
            animation: 'none !important',
          },
          '.skeed-sheen::after, .skeed-sheen-soft::after, .skeed-cta-primary::after': {
            opacity: '0',
            transform: 'none !important',
            transition: 'none !important',
          },
        },
      },
      ['responsive', 'hover', 'focus-visible'],
    );
  };
}

export function skeedMicroInteractionsPlugin(api: PluginApi): void {
  createSkeedMicroInteractionsPlugin()(api);
}

export default skeedTailwindPreset;

export function getSkeedTypographyPreset(
  idOrDemographic: SkeedTypographyPresetId | string | undefined,
): SkeedTypographyPreset {
  const presetId = isTypographyPresetId(idOrDemographic)
    ? idOrDemographic
    : typographyPresetForDemographic(idOrDemographic);
  return skeedTypographyPresets[presetId];
}

export function getSkeedVisualPreset(
  idOrDemographic: SkeedVisualPresetId | string | undefined,
): SkeedVisualPreset {
  const presetId = isVisualPresetId(idOrDemographic)
    ? idOrDemographic
    : typographyPresetForDemographic(idOrDemographic);
  return skeedVisualPresets[presetId];
}

function skeedColorTheme(): Record<string, Record<string, string>> {
  return Object.fromEntries(
    Object.entries(palette).map(([family, shades]) => [
      family,
      Object.fromEntries(
        Object.keys(shades).map((shade) => [shade, `var(--skeed-color-${family}-${shade})`]),
      ),
    ]),
  );
}

function skeedColorVariables(): Record<string, string> {
  const variables: Record<string, string> = {};
  for (const [family, shades] of Object.entries(palette)) {
    for (const [shade, value] of Object.entries(shades)) {
      variables[`--skeed-color-${family}-${shade}`] = value;
    }
  }
  return variables;
}

function typeStep(
  size: string,
  lineHeight: string,
  letterSpacing: string,
  weight: string,
): SkeedTypeStep {
  return { letterSpacing, lineHeight, size, weight };
}

function ctaPreset(
  radius: string,
  minHeight: string,
  paddingX: string,
  shadow: string,
  primaryWeight: string,
  secondaryWeight: string,
): SkeedTypographyPreset['cta'] {
  return { minHeight, paddingX, primaryWeight, radius, secondaryWeight, shadow };
}

function visualPreset(
  id: SkeedVisualPresetId,
  label: string,
  demographicFit: string[],
  colors: SkeedVisualPreset['colors'],
  radius = '8px',
): SkeedVisualPreset {
  return { colors, demographicFit, id, label, radius };
}

function tailwindTypeStep(step: SkeedTypeStep): [string, Record<string, string>] {
  return [
    step.size,
    {
      fontWeight: step.weight,
      letterSpacing: step.letterSpacing,
      lineHeight: step.lineHeight,
    },
  ];
}

function legacyTokenTheme(
  prefix: string,
  values: Record<string, string>,
  extra: Record<string, string> = {},
): Record<string, string> {
  return {
    ...Object.fromEntries(Object.entries(values).map(([key, value]) => [`${prefix}-${key}`, value])),
    ...extra,
  };
}

function resolveTypographyPreset(options: SkeedTailwindOptions): SkeedTypographyPreset {
  if (typeof options.typography === 'object') {
    return options.typography;
  }

  const presetId = options.typography ?? typographyPresetForDemographic(options.demographic);
  return skeedTypographyPresets[presetId];
}

function resolveVisualPreset(options: SkeedTailwindOptions): SkeedVisualPreset {
  if (typeof options.visual === 'object') {
    return options.visual;
  }

  const presetId = options.visual ?? typographyPresetForDemographic(options.demographic);
  return skeedVisualPresets[presetId];
}

function typographyPresetForDemographic(demographic: string | undefined): SkeedTypographyPresetId {
  const key = demographic?.toLowerCase().replace(/[\s-]+/g, '_') ?? '';
  if (
    ['health', 'wellness', 'fitness', 'mental_wellness', 'family', 'working_class'].includes(key)
  ) {
    return 'wellness';
  }
  if (['clinical', 'healthcare', 'medical'].includes(key)) return 'clinical';
  if (
    [
      'productivity',
      'developer_tools',
      'crm',
      'sales_crm',
      'monitoring',
      'marketplace',
      'listings',
    ].includes(key)
  ) {
    return 'productivity';
  }
  if (['enterprise', 'erp', 'finance', 'fintech', 'security', 'b2b'].includes(key)) {
    return 'enterprise';
  }
  if (
    ['ai', 'assistant', 'voice', 'creator_tools', 'ai_apps', 'hightech', 'social'].includes(key)
  ) {
    return 'ai';
  }
  if (['education', 'learning', 'students', 'teachers'].includes(key)) return 'education';
  if (['gov', 'government', 'public_sector', 'civic', 'nonprofit', 'military'].includes(key)) {
    return 'gov';
  }
  if (['kids', 'youth', 'gen_alpha'].includes(key)) return 'kids';
  if (
    ['classic', 'legal', 'religious', 'heritage', 'traditional', 'professional_services'].includes(
      key,
    )
  ) {
    return 'classic';
  }
  if (['luxury', 'fashion', 'hospitality', 'portfolio', 'premium'].includes(key)) return 'premium';
  return 'neutral';
}

function isTypographyPresetId(value: string | undefined): value is SkeedTypographyPresetId {
  return Boolean(value && value in skeedTypographyPresets);
}

function isVisualPresetId(value: string | undefined): value is SkeedVisualPresetId {
  return Boolean(value && value in skeedVisualPresets);
}

function typographyVariables(preset: SkeedTypographyPreset): Record<string, string> {
  return {
    '--skeed-font-body-family': preset.fonts.body,
    '--skeed-font-display-family': preset.fonts.display,
    '--skeed-font-mono-family': preset.fonts.mono,
    '--skeed-type-hero-size': preset.scale.hero.size,
    '--skeed-type-hero-line': preset.scale.hero.lineHeight,
    '--skeed-type-hero-tracking': preset.scale.hero.letterSpacing,
    '--skeed-type-hero-weight': preset.scale.hero.weight,
    '--skeed-type-title-size': preset.scale.title.size,
    '--skeed-type-title-line': preset.scale.title.lineHeight,
    '--skeed-type-title-tracking': preset.scale.title.letterSpacing,
    '--skeed-type-title-weight': preset.scale.title.weight,
    '--skeed-type-section-size': preset.scale.section.size,
    '--skeed-type-section-line': preset.scale.section.lineHeight,
    '--skeed-type-section-tracking': preset.scale.section.letterSpacing,
    '--skeed-type-section-weight': preset.scale.section.weight,
    '--skeed-type-body-size': preset.scale.body.size,
    '--skeed-type-body-line': preset.scale.body.lineHeight,
    '--skeed-type-body-tracking': preset.scale.body.letterSpacing,
    '--skeed-type-body-weight': preset.scale.body.weight,
    '--skeed-type-caption-size': preset.scale.caption.size,
    '--skeed-type-caption-line': preset.scale.caption.lineHeight,
    '--skeed-type-caption-tracking': preset.scale.caption.letterSpacing,
    '--skeed-type-caption-weight': preset.scale.caption.weight,
    '--skeed-eyebrow-tracking':
      preset.id === 'premium'
        ? '.08em'
        : preset.id === 'productivity'
          ? '.04em'
          : preset.id === 'classic'
            ? '.05em'
            : '.06em',
    '--skeed-cta-radius': preset.cta.radius,
    '--skeed-cta-min-height': preset.cta.minHeight,
    '--skeed-cta-padding-x': preset.cta.paddingX,
    '--skeed-cta-shadow': preset.cta.shadow,
    '--skeed-cta-shadow-hover':
      preset.cta.shadow === 'none' ? 'none' : '0 16px 36px rgba(15, 23, 42, .16)',
    '--skeed-cta-primary-weight': preset.cta.primaryWeight,
    '--skeed-cta-secondary-weight': preset.cta.secondaryWeight,
  };
}

function visualVariables(
  preset: SkeedVisualPreset,
  genderTone: SkeedGenderTone,
): Record<string, string> {
  const brand =
    genderTone === 'feminine'
      ? `color-mix(in srgb, ${preset.colors.brand} 84%, #db2777 16%)`
      : genderTone === 'masculine'
        ? `color-mix(in srgb, ${preset.colors.brand} 84%, #2563eb 16%)`
        : preset.colors.brand;
  const accent =
    genderTone === 'feminine'
      ? `color-mix(in srgb, ${preset.colors.accent} 84%, #ec4899 16%)`
      : genderTone === 'masculine'
        ? `color-mix(in srgb, ${preset.colors.accent} 84%, #0f766e 16%)`
        : preset.colors.accent;

  return {
    '--skeed-brand': brand,
    '--skeed-accent': accent,
    '--skeed-bg': preset.colors.bg,
    '--skeed-fg': preset.colors.fg,
    '--skeed-muted': preset.colors.muted,
    '--skeed-border': preset.colors.border,
    '--skeed-success': preset.colors.success,
    '--skeed-warning': '#b45309',
    '--skeed-danger': preset.colors.danger,
    '--skeed-radius': preset.radius,
    '--skeed-surface': '#ffffff',
    '--skeed-surface-muted': preset.colors.bg,
    '--skeed-brand-text-dark': `color-mix(in srgb, ${preset.colors.brand} 52%, white)`,
    '--skeed-accent-text-dark': `color-mix(in srgb, ${preset.colors.accent} 52%, white)`,
    '--skeed-spacing-xs': '0.375rem',
    '--skeed-spacing-sm': '0.625rem',
    '--skeed-spacing-md': '1rem',
    '--skeed-spacing-lg': '1.5rem',
    '--skeed-spacing-xl': '2rem',
    '--skeed-spacing-2xl': '3rem',
    '--skeed-radius-sm': '0.375rem',
    '--skeed-radius-md': preset.radius,
    '--skeed-radius-lg': '1rem',
    '--skeed-radius-xl': '1.5rem',
    '--skeed-shadow-sm': '0 1px 2px rgba(15, 23, 42, .06)',
    '--skeed-shadow-md': '0 8px 24px rgba(15, 23, 42, .08)',
    '--skeed-shadow-lg': '0 16px 40px rgba(15, 23, 42, .12)',
    '--skeed-shadow-xl': '0 24px 60px rgba(15, 23, 42, .16)',
  };
}
