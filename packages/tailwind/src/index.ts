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
  prefix?: string;
}

type CssRule = { [propertyOrSelector: string]: string | CssRule };
type AddUtilities = (utilities: Record<string, CssRule>, options?: unknown) => void;
type AddBase = (base: Record<string, unknown>) => void;
type PluginApi = {
  addBase: AddBase;
  addUtilities: AddUtilities;
};

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
      hero: typeStep('clamp(2.5rem, 6vw, 5rem)', '.98', '-0.02em', '760'),
      title: typeStep('clamp(1.875rem, 3vw, 3rem)', '1.05', '-0.012em', '720'),
      section: typeStep('clamp(1.25rem, 2vw, 1.75rem)', '1.18', '0', '680'),
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
      body: 'Aptos, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      display:
        'Aptos Display, Aptos, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      mono: '"SFMono-Regular", Consolas, monospace',
    },
    scale: {
      hero: typeStep('clamp(2.25rem, 5vw, 4.5rem)', '1.04', '-0.01em', '720'),
      title: typeStep('clamp(1.75rem, 3vw, 2.75rem)', '1.12', '-0.006em', '680'),
      section: typeStep('clamp(1.25rem, 2vw, 1.625rem)', '1.25', '0', '650'),
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
      body: 'Inter, "IBM Plex Sans", Aptos, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      display:
        'Inter, "IBM Plex Sans", Aptos Display, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      mono: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace',
    },
    scale: {
      hero: typeStep('clamp(2rem, 4vw, 4rem)', '.98', '-0.018em', '760'),
      title: typeStep('clamp(1.5rem, 2.5vw, 2.5rem)', '1.08', '-0.01em', '720'),
      section: typeStep('clamp(1.125rem, 1.6vw, 1.5rem)', '1.22', '0', '680'),
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
        'Inter Tight, Inter, Aptos Display, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      mono: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace',
    },
    scale: {
      hero: typeStep('clamp(2.75rem, 7vw, 5.5rem)', '.94', '-0.026em', '780'),
      title: typeStep('clamp(1.875rem, 3.25vw, 3.125rem)', '1.02', '-0.016em', '740'),
      section: typeStep('clamp(1.25rem, 2vw, 1.75rem)', '1.16', '-0.004em', '690'),
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
      hero: typeStep('clamp(2.25rem, 5vw, 4.25rem)', '1.06', '-0.006em', '720'),
      title: typeStep('clamp(1.75rem, 2.75vw, 2.75rem)', '1.14', '0', '690'),
      section: typeStep('clamp(1.25rem, 2vw, 1.625rem)', '1.28', '0', '660'),
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
      hero: typeStep('clamp(2rem, 4.5vw, 4rem)', '1.08', '0', '720'),
      title: typeStep('clamp(1.625rem, 2.5vw, 2.5rem)', '1.16', '0', '690'),
      section: typeStep('clamp(1.25rem, 1.8vw, 1.625rem)', '1.28', '0', '660'),
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
      hero: typeStep('clamp(2.5rem, 7vw, 5.25rem)', '1', '0', '800'),
      title: typeStep('clamp(1.875rem, 3.5vw, 3rem)', '1.08', '0', '760'),
      section: typeStep('clamp(1.375rem, 2.25vw, 1.875rem)', '1.18', '0', '720'),
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
      body: 'Aptos, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      display:
        'Georgia, "Iowan Old Style", "Times New Roman", Aptos Display, Aptos, ui-serif, serif',
      mono: '"SFMono-Regular", Consolas, monospace',
    },
    scale: {
      hero: typeStep('clamp(2.625rem, 5.8vw, 5.25rem)', '.98', '-0.012em', '640'),
      title: typeStep('clamp(1.875rem, 3vw, 3rem)', '1.08', '-0.004em', '620'),
      section: typeStep('clamp(1.25rem, 2vw, 1.75rem)', '1.26', '0', '620'),
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
      body: 'Aptos, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      display:
        'Optima, "Iowan Old Style", Aptos Display, Aptos, ui-serif, Georgia, Cambria, "Times New Roman", serif',
      mono: '"SFMono-Regular", Consolas, monospace',
    },
    scale: {
      hero: typeStep('clamp(3rem, 7vw, 6rem)', '.92', '-0.018em', '640'),
      title: typeStep('clamp(2rem, 3.5vw, 3.5rem)', '1', '-0.01em', '620'),
      section: typeStep('clamp(1.375rem, 2.25vw, 1.875rem)', '1.2', '0', '620'),
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
      hero: typeStep('clamp(2rem, 4.5vw, 4rem)', '1.08', '0', '720'),
      title: typeStep('clamp(1.625rem, 2.75vw, 2.625rem)', '1.16', '0', '700'),
      section: typeStep('clamp(1.25rem, 1.8vw, 1.625rem)', '1.3', '0', '660'),
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
      body: 'Inter, Aptos, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      display:
        'Inter, Aptos Display, Aptos, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      mono: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace',
    },
    scale: {
      hero: typeStep('clamp(2rem, 4vw, 4rem)', '.98', '-0.016em', '760'),
      title: typeStep('clamp(1.5rem, 2.5vw, 2.5rem)', '1.08', '-0.008em', '720'),
      section: typeStep('clamp(1.125rem, 1.6vw, 1.5rem)', '1.24', '0', '680'),
      body: typeStep('.9375rem', '1.58', '0', '400'),
      caption: typeStep('.8125rem', '1.42', '0', '520'),
    },
    cta: ctaPreset('6px', '2.375rem', '.875rem', '0 4px 10px rgba(15, 23, 42, .08)', '650', '600'),
  },
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
            fg: 'var(--skeed-fg)',
            muted: 'var(--skeed-muted)',
            border: 'var(--skeed-border)',
            success: 'var(--skeed-success)',
            danger: 'var(--skeed-danger)',
          },
          'skeed-color': skeedColorTheme(),
        },
        borderRadius: {
          skeed: 'var(--skeed-radius)',
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
        },
        transitionTimingFunction: {
          skeed: 'var(--skeed-ease, cubic-bezier(.2, .8, .2, 1))',
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
  return function skeedMicroInteractionsPlugin({ addBase, addUtilities }: PluginApi): void {
    addBase({
      ':root': {
        ...skeedColorVariables(),
        '--skeed-brand': 'var(--skeed-color-brand-600)',
        '--skeed-accent': 'var(--skeed-color-info-700)',
        '--skeed-bg': 'var(--skeed-color-neutral-50)',
        '--skeed-fg': 'var(--skeed-color-neutral-950)',
        '--skeed-muted': 'var(--skeed-color-neutral-600)',
        '--skeed-border': 'var(--skeed-color-neutral-200)',
        '--skeed-success': 'var(--skeed-color-success-700)',
        '--skeed-danger': 'var(--skeed-color-danger-700)',
        '--skeed-radius': '8px',
        '--skeed-motion-fast': '120ms',
        '--skeed-motion-base': '180ms',
        '--skeed-motion-slow': '240ms',
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
          'text-rendering': 'optimizeLegibility',
        },
        '.skeed-type-display': {
          'font-family': 'var(--skeed-font-display-family)',
        },
        '.skeed-type-hero': {
          'font-family': 'var(--skeed-font-display-family)',
          'font-size': 'var(--skeed-type-hero-size)',
          'line-height': 'var(--skeed-type-hero-line)',
          'letter-spacing': 'var(--skeed-type-hero-tracking)',
          'font-weight': 'var(--skeed-type-hero-weight)',
        },
        '.skeed-type-title': {
          'font-family': 'var(--skeed-font-display-family)',
          'font-size': 'var(--skeed-type-title-size)',
          'line-height': 'var(--skeed-type-title-line)',
          'letter-spacing': 'var(--skeed-type-title-tracking)',
          'font-weight': 'var(--skeed-type-title-weight)',
        },
        '.skeed-type-section': {
          'font-family': 'var(--skeed-font-display-family)',
          'font-size': 'var(--skeed-type-section-size)',
          'line-height': 'var(--skeed-type-section-line)',
          'letter-spacing': 'var(--skeed-type-section-tracking)',
          'font-weight': 'var(--skeed-type-section-weight)',
        },
        '.skeed-type-body': {
          'font-family': 'var(--skeed-font-body-family)',
          'font-size': 'var(--skeed-type-body-size)',
          'line-height': 'var(--skeed-type-body-line)',
          'letter-spacing': 'var(--skeed-type-body-tracking)',
          'font-weight': 'var(--skeed-type-body-weight)',
        },
        '.skeed-type-caption': {
          'font-family': 'var(--skeed-font-body-family)',
          'font-size': 'var(--skeed-type-caption-size)',
          'line-height': 'var(--skeed-type-caption-line)',
          'letter-spacing': 'var(--skeed-type-caption-tracking)',
          'font-weight': 'var(--skeed-type-caption-weight)',
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
        '.skeed-cta-primary': {
          'align-items': 'center',
          background: 'var(--skeed-brand)',
          'border-radius': 'var(--skeed-cta-radius)',
          color: 'white',
          display: 'inline-flex',
          'font-family': 'var(--skeed-font-body-family)',
          'font-size': 'var(--skeed-type-caption-size)',
          'font-weight': 'var(--skeed-cta-primary-weight)',
          'justify-content': 'center',
          'min-height': 'var(--skeed-cta-min-height)',
          padding: '0 var(--skeed-cta-padding-x)',
          'box-shadow': 'var(--skeed-cta-shadow)',
          transition:
            'transform var(--skeed-motion-fast) var(--skeed-ease), box-shadow var(--skeed-motion-base) var(--skeed-ease), background-color var(--skeed-motion-base) var(--skeed-ease)',
        },
        '.skeed-cta-primary:hover': {
          'box-shadow': 'var(--skeed-cta-shadow-hover)',
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
          'min-height': 'var(--skeed-cta-min-height)',
          padding: '0 var(--skeed-cta-padding-x)',
          transition:
            'transform var(--skeed-motion-fast) var(--skeed-ease), border-color var(--skeed-motion-base) var(--skeed-ease), background-color var(--skeed-motion-base) var(--skeed-ease)',
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

function resolveTypographyPreset(options: SkeedTailwindOptions): SkeedTypographyPreset {
  if (typeof options.typography === 'object') {
    return options.typography;
  }

  const presetId = options.typography ?? typographyPresetForDemographic(options.demographic);
  return skeedTypographyPresets[presetId];
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
