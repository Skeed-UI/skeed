import type { Density } from '@skeed/contracts/demographic';
import type { DemographicPreset } from '@skeed/contracts/preset';

/**
 * Token reference structure for semantic tokens like:
 * - color.brand.500
 * - spacing.4
 * - density.cozy.padY
 * - motion.duration.fast
 */
export interface TokenRef {
  namespace:
    | 'color'
    | 'spacing'
    | 'radius'
    | 'density'
    | 'font'
    | 'motion'
    | 'border'
    | 'shadow'
    | 'icon';
  path: string[];
}

/**
 * Represents a resolved CSS variable
 */
export interface CSSVariable {
  name: string;
  value: string;
  role: string;
}

/**
 * Full set of resolved tokens for a design system
 */
export interface ResolvedTokens {
  cssVariables: CSSVariable[];
  contrastPairs: ContrastPair[];
  metadata: {
    demographicId: string;
    density: Density;
    overridesApplied: string[];
  };
}

/**
 * Contrast pair for WCAG validation
 */
export interface ContrastPair {
  foreground: string;
  background: string;
  ratio: number;
  passesAA: boolean;
  passesAAA: boolean;
}

/**
 * Token override from brand attributes or user config
 */
export interface TokenOverrides {
  color?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  density?: Partial<
    Record<
      Density,
      {
        padY?: number;
        padX?: number;
        gap?: number;
        lineHeight?: number;
      }
    >
  >;
  motion?: {
    profile?: 'none' | 'subtle' | 'playful' | 'dramatic';
  };
}

/**
 * Parse a semantic token reference from a string
 * @example parseTokenRef('color.brand.500') → { namespace: 'color', path: ['brand', '500'] }
 * @example parseTokenRef('spacing.4') → { namespace: 'spacing', path: ['4'] }
 */
export function parseTokenRef(token: string): TokenRef | null {
  const parts = token.split('.');
  if (parts.length < 2) return null;

  const namespace = parts[0] as TokenRef['namespace'];
  const validNamespaces: TokenRef['namespace'][] = [
    'color',
    'spacing',
    'radius',
    'density',
    'font',
    'motion',
    'border',
    'shadow',
    'icon',
  ];

  if (!validNamespaces.includes(namespace)) {
    return null;
  }

  return {
    namespace,
    path: parts.slice(1),
  };
}

/**
 * Generate CSS variable name from token reference
 * @example tokenToCssVar({ namespace: 'color', path: ['brand', '500'] }) → '--skeed-color-brand-500'
 */
export function tokenToCssVar(ref: TokenRef): string {
  const path = ref.path.join('-');
  return `--skeed-${ref.namespace}-${path}`;
}

/**
 * Resolve a token value from a preset with optional overrides
 */
export function resolveToken(
  ref: TokenRef,
  preset: DemographicPreset,
  overrides?: TokenOverrides,
): string | null {
  switch (ref.namespace) {
    case 'color': {
      const [ramp, shade] = ref.path;
      if (!ramp || !shade) return null;

      // Check overrides first
      if (overrides?.color?.primary && ramp === 'brand' && shade === '500') {
        return overrides.color.primary;
      }
      if (overrides?.color?.secondary && ramp === 'brand' && shade === '600') {
        return overrides.color.secondary;
      }

      const rampData = preset.palette[ramp as keyof typeof preset.palette];
      if (typeof rampData === 'object' && rampData !== null) {
        return (rampData as Record<string, string>)[shade] || null;
      }
      return null;
    }

    case 'spacing': {
      const [idx] = ref.path;
      if (!idx) return null;
      const index = Number.parseInt(idx, 10);
      if (Number.isNaN(index) || index < 0 || index >= preset.spacing.length) {
        return null;
      }
      return `${preset.spacing[index]}rem`;
    }

    case 'radius': {
      const [idx] = ref.path;
      if (!idx) return null;
      const index = Number.parseInt(idx, 10);
      if (Number.isNaN(index) || index < 0 || index >= preset.radius.length) {
        return null;
      }
      // 9999 is special for full radius
      if (preset.radius[index] === 9999) {
        return '9999px';
      }
      return `${preset.radius[index]}rem`;
    }

    case 'density': {
      const [density, prop] = ref.path;
      if (!density || !prop) return null;

      const densityConfig = preset.density[density as Density];
      if (!densityConfig) return null;

      // Check overrides
      const overrideValue =
        overrides?.density?.[density as Density]?.[prop as 'padY' | 'padX' | 'gap' | 'lineHeight'];
      if (overrideValue !== undefined) {
        return prop === 'lineHeight' ? String(overrideValue) : `${overrideValue}rem`;
      }

      const value = densityConfig[prop as keyof typeof densityConfig];
      return prop === 'lineHeight' ? String(value) : `${value}rem`;
    }

    case 'font': {
      const [role, prop] = ref.path;
      if (!role || !prop) return null;

      const fontConfig = preset.typography[role as 'display' | 'body' | 'mono' | 'numeric'];
      if (!fontConfig || typeof fontConfig !== 'object') return null;

      if (prop === 'family') {
        const family = fontConfig.family;
        const fallback = fontConfig.fallback;
        return [family, ...fallback].join(', ');
      }

      const propValue = (fontConfig as unknown as Record<string, string | number | string[]>)[prop];
      return typeof propValue === 'string' ? propValue : null;
    }

    case 'motion': {
      const [type, name] = ref.path;
      if (!type || !name) return null;

      if (type === 'duration') {
        const ms = preset.motion.durations[name];
        return ms ? `${ms}ms` : null;
      }

      if (type === 'easing') {
        return preset.motion.easings[name] || null;
      }

      return null;
    }

    case 'shadow': {
      const [idx] = ref.path;
      if (!idx) return null;
      const index = Number.parseInt(idx, 10);
      if (Number.isNaN(index) || index < 0 || index >= preset.elevation.shadows.length) {
        return null;
      }
      return preset.elevation.shadows[index] ?? null;
    }

    case 'border': {
      const [prop] = ref.path;
      if (!prop) return null;

      if (prop === 'width') {
        return `${preset.borders.width}px`;
      }
      if (prop === 'style') {
        return preset.borders.style;
      }

      return null;
    }

    case 'icon': {
      const [prop] = ref.path;
      if (!prop) return null;

      if (prop === 'pack') {
        return preset.iconography.pack;
      }
      if (prop === 'style') {
        return preset.iconography.style;
      }

      return null;
    }

    default:
      return null;
  }
}

/**
 * Calculate relative luminance of a color
 */
function getLuminance(hex: string): number {
  const rgb = hex
    .replace('#', '')
    .match(/.{2}/g)
    ?.map((x) => {
      const v = Number.parseInt(x, 16) / 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });

  if (!rgb || rgb.length !== 3) return 0;
  const [r, g, b] = rgb;
  if (r === undefined || g === undefined || b === undefined) return 0;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Validate and auto-fix contrast ratios for WCAG compliance
 */
export function validateContrast(
  pairs: ContrastPair[],
  minAARatio = 4.5,
  minAAARatio = 7,
): { valid: boolean; violations: ContrastPair[]; fixed: ContrastPair[] } {
  const violations: ContrastPair[] = [];
  const fixed: ContrastPair[] = [];

  for (const pair of pairs) {
    const passesAA = pair.ratio >= minAARatio;
    const passesAAA = pair.ratio >= minAAARatio;

    if (!passesAA) {
      violations.push(pair);
    } else if (!pair.passesAA || !pair.passesAAA) {
      // Pair was fixed or is now valid
      fixed.push({ ...pair, passesAA, passesAAA });
    }
  }

  return {
    valid: violations.length === 0,
    violations,
    fixed,
  };
}

/**
 * Generate all CSS variables from a preset with optional overrides
 */
export function generateCSSVariables(
  preset: DemographicPreset,
  density: Density,
  overrides?: TokenOverrides,
): ResolvedTokens {
  const cssVariables: CSSVariable[] = [];

  // Generate color palette variables
  for (const [ramp, shades] of Object.entries(preset.palette)) {
    if (ramp === 'contrastPairs' || typeof shades !== 'object' || shades === null) {
      continue;
    }
    for (const [shade, value] of Object.entries(shades as Record<string, string>)) {
      const ref: TokenRef = { namespace: 'color', path: [ramp, shade] };
      let resolvedValue = resolveToken(ref, preset, overrides);

      // Apply brand color overrides
      if (ramp === 'brand') {
        if (shade === '500' && overrides?.color?.primary) {
          resolvedValue = overrides.color.primary;
        } else if (shade === '600' && overrides?.color?.secondary) {
          resolvedValue = overrides.color.secondary;
        }
      }

      cssVariables.push({
        name: tokenToCssVar(ref),
        value: resolvedValue || value,
        role: `${ramp} ${shade}`,
      });
    }
  }

  // Generate spacing variables
  preset.spacing.forEach((value, idx) => {
    const ref: TokenRef = { namespace: 'spacing', path: [String(idx)] };
    cssVariables.push({
      name: tokenToCssVar(ref),
      value: `${value}rem`,
      role: `spacing step ${idx}`,
    });
  });

  // Generate radius variables
  preset.radius.forEach((value, idx) => {
    const ref: TokenRef = { namespace: 'radius', path: [String(idx)] };
    cssVariables.push({
      name: tokenToCssVar(ref),
      value: value === 9999 ? '9999px' : `${value}rem`,
      role: `radius step ${idx}`,
    });
  });

  // Generate density variables for all densities
  for (const [densityName, config] of Object.entries(preset.density)) {
    const densityRef: TokenRef = { namespace: 'density', path: [densityName, 'pady'] };
    const padYValue = overrides?.density?.[densityName as Density]?.padY ?? config.padY;
    cssVariables.push({
      name: tokenToCssVar(densityRef),
      value: `${padYValue}rem`,
      role: `${densityName} vertical padding`,
    });

    const padXRef: TokenRef = { namespace: 'density', path: [densityName, 'padx'] };
    const padXValue = overrides?.density?.[densityName as Density]?.padX ?? config.padX;
    cssVariables.push({
      name: tokenToCssVar(padXRef),
      value: `${padXValue}rem`,
      role: `${densityName} horizontal padding`,
    });

    const gapRef: TokenRef = { namespace: 'density', path: [densityName, 'gap'] };
    const gapValue = overrides?.density?.[densityName as Density]?.gap ?? config.gap;
    cssVariables.push({
      name: tokenToCssVar(gapRef),
      value: `${gapValue}rem`,
      role: `${densityName} gap`,
    });

    const lhRef: TokenRef = { namespace: 'density', path: [densityName, 'lh'] };
    const lhValue = overrides?.density?.[densityName as Density]?.lineHeight ?? config.lineHeight;
    cssVariables.push({
      name: tokenToCssVar(lhRef),
      value: String(lhValue),
      role: `${densityName} line height`,
    });
  }

  // Generate motion variables
  for (const [name, ms] of Object.entries(preset.motion.durations)) {
    const ref: TokenRef = { namespace: 'motion', path: ['duration', name] };
    cssVariables.push({
      name: tokenToCssVar(ref),
      value: `${ms}ms`,
      role: `motion duration ${name}`,
    });
  }

  for (const [name, easing] of Object.entries(preset.motion.easings)) {
    const ref: TokenRef = { namespace: 'motion', path: ['easing', name] };
    cssVariables.push({
      name: tokenToCssVar(ref),
      value: easing,
      role: `motion easing ${name}`,
    });
  }

  // Generate shadow variables
  preset.elevation.shadows.forEach((shadow, idx) => {
    const ref: TokenRef = { namespace: 'shadow', path: [String(idx)] };
    cssVariables.push({
      name: tokenToCssVar(ref),
      value: shadow,
      role: `shadow level ${idx}`,
    });
  });

  // Generate border variables
  cssVariables.push({
    name: '--skeed-border-width',
    value: `${preset.borders.width}px`,
    role: 'border width',
  });
  cssVariables.push({
    name: '--skeed-border-style',
    value: preset.borders.style,
    role: 'border style',
  });

  // Generate font variables
  for (const role of ['display', 'body', 'mono', 'numeric'] as const) {
    const config = preset.typography[role];
    if (!config) continue;

    const familyRef: TokenRef = { namespace: 'font', path: [role, 'family'] };
    const familyValue = config.family;
    const fallbackValue = config.fallback;
    cssVariables.push({
      name: tokenToCssVar(familyRef),
      value: [familyValue, ...fallbackValue].join(', '),
      role: `${role} font family`,
    });
  }

  // Process contrast pairs
  const contrastPairs: ContrastPair[] =
    preset.palette.contrastPairs?.map((pair) => {
      // Resolve the color values
      const fgParts = pair.fg.split('.');
      const bgParts = pair.bg.split('.');

      const fgRef: TokenRef = { namespace: 'color', path: fgParts };
      const bgRef: TokenRef = { namespace: 'color', path: bgParts };

      const resolvedFg = resolveToken(fgRef, preset, overrides);
      const resolvedBg = resolveToken(bgRef, preset, overrides);
      const fgValue = resolvedFg ?? '#000000';
      const bgValue = resolvedBg ?? '#ffffff';

      const ratio = getContrastRatio(fgValue, bgValue);

      return {
        foreground: pair.fg,
        background: pair.bg,
        ratio,
        passesAA: ratio >= 4.5,
        passesAAA: ratio >= 7,
      };
    }) ?? [];

  return {
    cssVariables,
    contrastPairs,
    metadata: {
      demographicId: preset.id,
      density,
      overridesApplied: overrides ? Object.keys(overrides) : [],
    },
  };
}

/**
 * Check if a token exists in the preset
 */
export function tokenExists(ref: TokenRef, preset: DemographicPreset): boolean {
  return resolveToken(ref, preset) !== null;
}
