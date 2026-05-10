export type SkeedThemeTone = 'calm' | 'precise' | 'premium';

export type SkeedTypeStep = {
  size: string;
  lineHeight: string;
  letterSpacing: string;
  weight: string;
};

export type SkeedTypographyProfile = {
  id: string;
  label: string;
  rationale: string;
  fonts: {
    body: string;
    display: string;
    mono: string;
  };
  fontFamilies: string[];
  hero: SkeedTypeStep;
  title: SkeedTypeStep;
  section: SkeedTypeStep;
  body: SkeedTypeStep;
  caption: SkeedTypeStep;
  eyebrowTracking: string;
  cta: {
    radius: string;
    minHeight: string;
    paddingX: string;
    shadow: string;
    primaryWeight: string;
    secondaryWeight: string;
  };
};

const sansFallback =
  'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const serifFallback = 'Georgia, Cambria, "Times New Roman", ui-serif, serif';

const familyQuery: Record<string, string> = {
  'Atkinson Hyperlegible': 'Atkinson+Hyperlegible:wght@400;700',
  'Cormorant Garamond': 'Cormorant+Garamond:wght@500;600;700',
  'Crimson Text': 'Crimson+Text:wght@400;600;700',
  Fraunces: 'Fraunces:opsz,wght@9..144,500;9..144,650;9..144,750',
  'IBM Plex Sans': 'IBM+Plex+Sans:wght@400;500;600;700',
  Inter: 'Inter:wght@400;500;600;700;800',
  'Inter Tight': 'Inter+Tight:wght@500;600;700;800',
  'Libre Baskerville': 'Libre+Baskerville:wght@400;700',
  Nunito: 'Nunito:wght@400;600;700;800',
  'Source Sans 3': 'Source+Sans+3:wght@400;600;700;800',
};

export function themeToneForDemographic(demographic: string | undefined): SkeedThemeTone {
  const key = normalizeDemographic(demographic);
  if (
    [
      'health',
      'wellness',
      'mental_wellness',
      'clinical',
      'education',
      'gov',
      'government',
      'public_sector',
      'kids',
      'classic',
      'legal',
      'religious',
      'military',
      'working_class',
    ].includes(key)
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
      'finance',
      'marketplace',
      'listings',
      'enterprise',
    ].includes(key)
  ) {
    return 'precise';
  }
  return 'premium';
}

export function typographyForDemographic(demographic: string | undefined): SkeedTypographyProfile {
  const key = normalizeDemographic(demographic);
  const profile = profileForKey(key);
  return {
    ...profile,
    fontFamilies: profile.fontFamilies.filter((family, index, all) => all.indexOf(family) === index),
  };
}

export function renderFontHeadLinks(profile: SkeedTypographyProfile): string {
  const families = profile.fontFamilies
    .map((family) => familyQuery[family])
    .filter((query): query is string => Boolean(query));
  if (families.length === 0) return '';
  const href = `https://fonts.googleapis.com/css2?${families
    .map((family) => `family=${family}`)
    .join('&')}&display=swap`;
  return `      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="${href}" rel="stylesheet" />
      </head>`;
}

export function themeTraceForDemographic(demographic: string | undefined) {
  const typography = typographyForDemographic(demographic);
  return {
    demographic: normalizeDemographic(demographic) || 'productivity',
    typography: {
      label: typography.label,
      body: typography.fonts.body,
      display: typography.fonts.display,
      rationale: typography.rationale,
      loadedFontFamilies: typography.fontFamilies,
    },
    motionTone: themeToneForDemographic(demographic),
    defaults: {
      smartText: true,
      adaptiveGrids: true,
      cssFirstMicroInteractions: true,
      reducedMotion: true,
    },
  };
}

function profileForKey(key: string): SkeedTypographyProfile {
  const base = baseProfile();
  if (['health', 'wellness', 'fitness', 'mental_wellness', 'clinical'].includes(key)) {
    return {
      ...base,
      id: 'wellness-accessible',
      label: key === 'mental_wellness' ? 'Atkinson soft' : 'Atkinson + Inter',
      rationale: 'clear, calm, accessible reading for care and health decisions',
      fonts: {
        ...base.fonts,
        body: `Atkinson Hyperlegible, Inter, ${sansFallback}`,
        display: `Inter, Atkinson Hyperlegible, ${sansFallback}`,
      },
      fontFamilies: ['Atkinson Hyperlegible', 'Inter'],
      hero: step('clamp(2.35rem, 5vw, 4.35rem)', '1.04', '0', '720'),
      title: step('clamp(1.75rem, 3vw, 2.65rem)', '1.12', '0', '680'),
      section: step('clamp(1.25rem, 2vw, 1.55rem)', '1.25', '0', '650'),
      body: step('1rem', '1.72', '0', '400'),
      caption: step('.875rem', '1.5', '0', '500'),
      cta: { ...base.cta, minHeight: '2.75rem', paddingX: '1.125rem', radius: '10px' },
    };
  }

  if (['productivity', 'developer_tools', 'crm', 'sales_crm', 'monitoring', 'erp'].includes(key)) {
    return {
      ...base,
      id: 'operational-plex',
      label: key === 'erp' ? 'IBM Plex Ops' : 'IBM Plex + Inter',
      rationale: 'compact rhythm for repeated professional workflows and dense status scanning',
      fonts: {
        ...base.fonts,
        body: `"IBM Plex Sans", Inter, ${sansFallback}`,
        display: key === 'erp' ? `"IBM Plex Sans", Inter, ${sansFallback}` : `Inter Tight, "IBM Plex Sans", Inter, ${sansFallback}`,
      },
      fontFamilies: ['IBM Plex Sans', 'Inter', ...(key === 'erp' ? [] : ['Inter Tight'])],
      hero: step('clamp(2rem, 4vw, 3.85rem)', '.98', '0', '760'),
      title: step('clamp(1.5rem, 2.5vw, 2.35rem)', '1.08', '0', '720'),
      section: step('clamp(1.125rem, 1.6vw, 1.45rem)', '1.22', '0', '680'),
      body: step('.9375rem', '1.58', '0', '400'),
      caption: step('.8125rem', '1.42', '0', '520'),
      eyebrowTracking: '.04em',
      cta: {
        ...base.cta,
        minHeight: '2.375rem',
        paddingX: '.875rem',
        radius: '7px',
        shadow: '0 6px 14px rgba(15, 23, 42, .10)',
      },
    };
  }

  if (['ai', 'assistant', 'voice', 'creator_tools', 'ai_apps', 'hightech'].includes(key)) {
    return {
      ...base,
      id: 'assistant-tight',
      label: key === 'hightech' ? 'Inter Tight Tech' : 'Inter Tight',
      rationale: 'modern assistant surfaces with controlled expressiveness and crisp technical hierarchy',
      fonts: {
        ...base.fonts,
        body: key === 'hightech' ? `"IBM Plex Sans", Inter, ${sansFallback}` : `Inter, ${sansFallback}`,
        display:
          key === 'hightech'
            ? `Inter Tight, "IBM Plex Sans", Inter, ${sansFallback}`
            : `Inter Tight, Inter, ${sansFallback}`,
      },
      fontFamilies: key === 'hightech' ? ['Inter Tight', 'IBM Plex Sans', 'Inter'] : ['Inter Tight', 'Inter'],
      hero: step('clamp(2.6rem, 7vw, 5.25rem)', '.96', '0', '780'),
      title: step('clamp(1.875rem, 3.25vw, 3rem)', '1.04', '0', '740'),
      section: step('clamp(1.25rem, 2vw, 1.7rem)', '1.16', '0', '690'),
      body: step('1rem', '1.62', '0', '400'),
      caption: step('.875rem', '1.44', '0', '520'),
      cta: {
        ...base.cta,
        minHeight: '2.75rem',
        paddingX: '1.125rem',
        radius: '12px',
        shadow: '0 12px 28px rgba(79, 70, 229, .22)',
        primaryWeight: '700',
      },
    };
  }

  if (['kids', 'youth', 'gen_alpha', 'teens'].includes(key)) {
    const teen = key === 'teens';
    return {
      ...base,
      id: teen ? 'teen-friendly-tight' : 'kid-readable-rounded',
      label: teen ? 'Nunito + Inter Tight' : 'Nunito',
      rationale: teen
        ? 'confident, friendly surfaces for older students without childish cues'
        : 'round, readable, playful shapes with strong control and motion caps',
      fonts: {
        ...base.fonts,
        body: `Nunito, Inter, ${sansFallback}`,
        display: teen ? `Inter Tight, Nunito, Inter, ${sansFallback}` : `Nunito, Inter, ${sansFallback}`,
      },
      fontFamilies: teen ? ['Nunito', 'Inter Tight', 'Inter'] : ['Nunito', 'Inter'],
      hero: step('clamp(2.45rem, 7vw, 5rem)', '1', '0', teen ? '760' : '800'),
      title: step('clamp(1.875rem, 3.5vw, 2.85rem)', '1.08', '0', teen ? '740' : '760'),
      section: step('clamp(1.375rem, 2.25vw, 1.8rem)', '1.18', '0', '720'),
      body: step('1.0625rem', '1.7', '0', '450'),
      caption: step('.875rem', '1.48', '0', '600'),
      cta: {
        ...base.cta,
        minHeight: '3rem',
        paddingX: '1.25rem',
        radius: teen ? '12px' : '14px',
        shadow: '0 12px 24px rgba(15, 23, 42, .14)',
        primaryWeight: teen ? '720' : '760',
        secondaryWeight: '680',
      },
    };
  }

  if (['education', 'learning', 'students', 'teachers'].includes(key)) {
    return {
      ...base,
      id: 'education-atkinson',
      label: 'Atkinson',
      rationale: 'low cognitive load for lessons, rubrics, and admin work',
      fonts: {
        ...base.fonts,
        body: `Atkinson Hyperlegible, Inter, ${sansFallback}`,
        display: `Atkinson Hyperlegible, Inter, ${sansFallback}`,
      },
      fontFamilies: ['Atkinson Hyperlegible', 'Inter'],
      hero: step('clamp(2.25rem, 5vw, 4.1rem)', '1.06', '0', '720'),
      title: step('clamp(1.75rem, 2.75vw, 2.65rem)', '1.14', '0', '690'),
      section: step('clamp(1.25rem, 2vw, 1.6rem)', '1.28', '0', '660'),
      body: step('1rem', '1.76', '0', '400'),
      caption: step('.875rem', '1.52', '0', '520'),
      cta: { ...base.cta, minHeight: '2.75rem', paddingX: '1.125rem', radius: '9px' },
    };
  }

  if (['gov', 'government', 'public_sector', 'civic', 'nonprofit', 'military', 'working_class'].includes(key)) {
    return {
      ...base,
      id: key === 'military' ? 'command-source-plex' : 'civic-source',
      label: key === 'military' ? 'Source Sans Command' : key === 'working_class' ? 'Source Sans Practical' : 'Source Sans 3',
      rationale:
        key === 'military'
          ? 'disciplined status hierarchy for serious operational contexts'
          : 'plain-language clarity with strong accessibility and practical task focus',
      fonts: {
        ...base.fonts,
        body: `"Source Sans 3", Inter, ${sansFallback}`,
        display:
          key === 'military'
            ? `"IBM Plex Sans", "Source Sans 3", ${sansFallback}`
            : `"Source Sans 3", Inter, ${sansFallback}`,
      },
      fontFamilies: key === 'military' ? ['Source Sans 3', 'IBM Plex Sans'] : ['Source Sans 3', 'Inter'],
      hero: step('clamp(2rem, 4.5vw, 3.85rem)', '1.08', '0', '720'),
      title: step('clamp(1.625rem, 2.5vw, 2.4rem)', '1.16', '0', '690'),
      section: step('clamp(1.25rem, 1.8vw, 1.6rem)', '1.28', '0', '660'),
      body: step('1rem', '1.76', '0', '400'),
      caption: step('.875rem', '1.52', '0', '520'),
      cta: { ...base.cta, minHeight: '2.75rem', radius: '6px', shadow: 'none', primaryWeight: '700' },
    };
  }

  if (['classic', 'legal', 'religious', 'heritage', 'traditional'].includes(key)) {
    const religious = key === 'religious';
    const legal = key === 'legal';
    return {
      ...base,
      id: religious ? 'reverent-cormorant' : legal ? 'legal-baskerville' : 'classic-editorial',
      label: religious ? 'Cormorant + Crimson' : 'Libre Baskerville',
      rationale:
        religious
          ? 'reverent editorial texture without ornate illegibility'
          : legal
            ? 'formal authority balanced with readable body copy'
            : 'editorial trust and durable serif hierarchy',
      fonts: {
        ...base.fonts,
        body: legal ? `"Source Sans 3", Inter, ${sansFallback}` : `"Crimson Text", ${serifFallback}`,
        display: religious
          ? `"Cormorant Garamond", "Libre Baskerville", ${serifFallback}`
          : `"Libre Baskerville", ${serifFallback}`,
      },
      fontFamilies: religious
        ? ['Cormorant Garamond', 'Crimson Text', 'Libre Baskerville']
        : legal
          ? ['Libre Baskerville', 'Source Sans 3', 'Inter']
          : ['Libre Baskerville', 'Crimson Text'],
      hero: step('clamp(2.45rem, 5.8vw, 5rem)', '.99', '0', legal ? '700' : religious ? '600' : '700'),
      title: step('clamp(1.875rem, 3vw, 2.85rem)', '1.08', '0', legal ? '700' : religious ? '600' : '700'),
      section: step('clamp(1.25rem, 2vw, 1.7rem)', '1.26', '0', religious ? '600' : '700'),
      body: step('1rem', legal ? '1.72' : '1.82', '0', '400'),
      caption: step('.875rem', '1.5', '.01em', '540'),
      eyebrowTracking: '.05em',
      cta: {
        ...base.cta,
        minHeight: '2.625rem',
        paddingX: '1.125rem',
        radius: '5px',
        shadow: '0 8px 18px rgba(15, 23, 42, .10)',
        primaryWeight: legal ? '700' : '600',
        secondaryWeight: '560',
      },
    };
  }

  if (['enterprise', 'finance', 'fintech', 'b2b', 'security'].includes(key)) {
    return {
      ...base,
      id: 'finance-plex',
      label: 'IBM Plex Finance',
      rationale: 'precise numeracy and premium financial confidence',
      fonts: {
        ...base.fonts,
        body: `"IBM Plex Sans", Inter, ${sansFallback}`,
        display: `Inter Tight, "IBM Plex Sans", Inter, ${sansFallback}`,
      },
      fontFamilies: ['IBM Plex Sans', 'Inter Tight', 'Inter'],
      hero: step('clamp(2rem, 4vw, 3.85rem)', '.98', '0', '760'),
      title: step('clamp(1.5rem, 2.5vw, 2.35rem)', '1.08', '0', '720'),
      section: step('clamp(1.125rem, 1.6vw, 1.45rem)', '1.24', '0', '680'),
      body: step('.9375rem', '1.58', '0', '400'),
      caption: step('.8125rem', '1.42', '0', '520'),
      eyebrowTracking: '.04em',
      cta: { ...base.cta, minHeight: '2.375rem', paddingX: '.875rem', radius: '6px', shadow: '0 4px 10px rgba(15, 23, 42, .08)' },
    };
  }

  if (['marketplace', 'special_occasion', 'luxury', 'fashion', 'hospitality', 'portfolio', 'premium'].includes(key)) {
    const event = key === 'special_occasion';
    return {
      ...base,
      id: event ? 'event-fraunces' : 'commerce-fraunces',
      label: event ? 'Fraunces Event' : 'Fraunces Commerce',
      rationale: event
        ? 'celebratory editorial presence with readable actions'
        : 'warm merchandising hierarchy with conversion energy',
      fonts: {
        ...base.fonts,
        body: `Inter, ${sansFallback}`,
        display: event ? `Fraunces, "Cormorant Garamond", ${serifFallback}` : `Fraunces, Inter Tight, Inter, ${sansFallback}`,
      },
      fontFamilies: event ? ['Fraunces', 'Cormorant Garamond', 'Inter'] : ['Fraunces', 'Inter Tight', 'Inter'],
      hero: step('clamp(2.75rem, 6vw, 5.5rem)', '.96', '0', '650'),
      title: step('clamp(2rem, 3.5vw, 3.35rem)', '1', '0', '650'),
      section: step('clamp(1.375rem, 2.25vw, 1.8rem)', '1.2', '0', '650'),
      body: step('1rem', '1.72', '0', '400'),
      caption: step('.8125rem', '1.5', '.04em', '560'),
      eyebrowTracking: '.08em',
      cta: { ...base.cta, minHeight: '2.75rem', paddingX: '1.25rem', radius: event ? '18px' : '12px', shadow: '0 12px 30px rgba(15, 23, 42, .16)' },
    };
  }

  if (['listings', 'social'].includes(key)) {
    return {
      ...base,
      id: key === 'social' ? 'social-nunito' : 'listing-inter-tight',
      label: key === 'social' ? 'Nunito Social' : 'Inter Browse',
      rationale: key === 'social' ? 'approachable participation and belonging' : 'scannable comparison and inventory browsing',
      fonts: {
        ...base.fonts,
        body: key === 'social' ? `Nunito, Inter, ${sansFallback}` : `Inter, ${sansFallback}`,
        display: key === 'social' ? `Nunito, Inter Tight, Inter, ${sansFallback}` : `Inter Tight, Inter, ${sansFallback}`,
      },
      fontFamilies: key === 'social' ? ['Nunito', 'Inter Tight', 'Inter'] : ['Inter Tight', 'Inter'],
      hero: step('clamp(2.35rem, 5.5vw, 4.5rem)', '1.02', '0', '760'),
      title: step('clamp(1.75rem, 3vw, 2.75rem)', '1.08', '0', '720'),
      section: step('clamp(1.25rem, 2vw, 1.625rem)', '1.2', '0', '680'),
      body: step('1rem', '1.65', '0', '400'),
      caption: step('.875rem', '1.45', '0', '520'),
      cta: { ...base.cta, radius: key === 'social' ? '18px' : '10px' },
    };
  }

  return base;
}

function baseProfile(): SkeedTypographyProfile {
  return {
    id: 'neutral-inter',
    label: 'Inter',
    rationale: 'neutral product typography for broad SaaS-style interfaces',
    fonts: {
      body: `Inter, ${sansFallback}`,
      display: `Inter Tight, Inter, ${sansFallback}`,
      mono: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace',
    },
    fontFamilies: ['Inter Tight', 'Inter'],
    hero: step('clamp(2.5rem, 6vw, 4.85rem)', '.98', '0', '760'),
    title: step('clamp(1.875rem, 3vw, 2.85rem)', '1.05', '0', '720'),
    section: step('clamp(1.25rem, 2vw, 1.7rem)', '1.18', '0', '680'),
    body: step('1rem', '1.65', '0', '400'),
    caption: step('.875rem', '1.45', '0', '500'),
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
}

function step(
  size: string,
  lineHeight: string,
  letterSpacing: string,
  weight: string,
): SkeedTypeStep {
  return { letterSpacing, lineHeight, size, weight };
}

function normalizeDemographic(demographic: string | undefined): string {
  return demographic?.toLowerCase().replace(/[\s-]+/g, '_') ?? '';
}
