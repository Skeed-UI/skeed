/**
 * Contrast Validation Guard
 *
 * Ensures WCAG AA/AAA contrast compliance for generated components.
 * Auto-fixes contrast issues where possible.
 */

// Local implementation of getContrastRatio (also available in @skeed/core)
function getLuminance(hex: string): number {
  const rgb = hex
    .replace('#', '')
    .match(/.{2}/g)
    ?.map((x) => {
      const v = Number.parseInt(x, 16) / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
  if (!rgb || rgb.length !== 3) return 0;
  const [r, g, b] = rgb;
  if (r === undefined || g === undefined || b === undefined) return 0;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

export interface ContrastValidationOptions {
  /** Foreground color (text) */
  foreground: string;
  /** Background color */
  background: string;
  /** Required WCAG level */
  level: 'AA' | 'AAA' | undefined;
  /** Text size (for determining if this is large text) */
  textSize: 'normal' | 'large' | undefined;
  /** Component demographic for strictness */
  demographicId: string | undefined;
}

export interface ContrastValidationResult {
  /** Whether contrast passes */
  valid: boolean;
  /** Contrast ratio (e.g., 4.5, 7.0) */
  ratio: number;
  /** Required minimum ratio */
  requiredRatio: number;
  /** Whether it passes AA */
  passesAA: boolean;
  /** Whether it passes AAA */
  passesAAA: boolean;
  /** Suggested fix if invalid */
  suggestion: ContrastFixSuggestion | undefined;
}

export interface ContrastFixSuggestion {
  /** Type of fix */
  type: 'darken-foreground' | 'lighten-foreground' | 'darken-background' | 'lighten-background';
  /** Suggested foreground color */
  foreground: string;
  /** Suggested background color */
  background: string;
  /** New contrast ratio */
  newRatio: number;
}

// Minimum contrast ratios per WCAG 2.1
const AA_RATIOS = {
  normal: 4.5,
  large: 3,
};

const AAA_RATIOS = {
  normal: 7,
  large: 4.5,
};

// AAA-strict demographics
const AAA_STRICT_DEMOGRAPHICS = ['kids', 'education', 'health', 'gov', 'mental_wellness'];

/**
 * Validate contrast between two colors
 */
export function validateContrast(options: ContrastValidationOptions): ContrastValidationResult {
  const { foreground, background, level = 'AA', textSize = 'normal', demographicId } = options;

  // Auto-upgrade to AAA for strict demographics
  const effectiveLevel =
    demographicId && AAA_STRICT_DEMOGRAPHICS.includes(demographicId) ? 'AAA' : level;

  const ratio = getContrastRatio(foreground, background);
  const requiredRatio = effectiveLevel === 'AAA' ? AAA_RATIOS[textSize] : AA_RATIOS[textSize];

  const passesAA = ratio >= AA_RATIOS[textSize];
  const passesAAA = ratio >= AAA_RATIOS[textSize];

  const valid = effectiveLevel === 'AAA' ? passesAAA : passesAA;

  let suggestion: ContrastFixSuggestion | undefined;
  if (!valid) {
    suggestion = generateFixSuggestion(foreground, background, requiredRatio);
  }

  return {
    valid,
    ratio,
    requiredRatio,
    passesAA,
    passesAAA,
    suggestion,
  };
}

/**
 * Generate a fix suggestion for failing contrast
 */
function generateFixSuggestion(
  foreground: string,
  background: string,
  requiredRatio: number,
): ContrastFixSuggestion | undefined {
  // Try lightening foreground
  const lightenedFg = lightenColor(foreground, 0.2);
  const lightenedFgRatio = getContrastRatio(lightenedFg, background);
  if (lightenedFgRatio >= requiredRatio) {
    return {
      type: 'lighten-foreground',
      foreground: lightenedFg,
      background,
      newRatio: lightenedFgRatio,
    };
  }

  // Try darkening foreground
  const darkenedFg = darkenColor(foreground, 0.2);
  const darkenedFgRatio = getContrastRatio(darkenedFg, background);
  if (darkenedFgRatio >= requiredRatio) {
    return {
      type: 'darken-foreground',
      foreground: darkenedFg,
      background,
      newRatio: darkenedFgRatio,
    };
  }

  // Try darkening background
  const darkenedBg = darkenColor(background, 0.2);
  const darkenedBgRatio = getContrastRatio(foreground, darkenedBg);
  if (darkenedBgRatio >= requiredRatio) {
    return {
      type: 'darken-background',
      foreground,
      background: darkenedBg,
      newRatio: darkenedBgRatio,
    };
  }

  // Try lightening background
  const lightenedBg = lightenColor(background, 0.2);
  const lightenedBgRatio = getContrastRatio(foreground, lightenedBg);
  if (lightenedBgRatio >= requiredRatio) {
    return {
      type: 'lighten-background',
      foreground,
      background: lightenedBg,
      newRatio: lightenedBgRatio,
    };
  }

  return undefined;
}

/**
 * Lighten a hex color by a percentage
 */
function lightenColor(hex: string, percent: number): string {
  const num = Number.parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent * 100);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
  const B = Math.min(255, (num & 0x0000ff) + amt);
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

/**
 * Darken a hex color by a percentage
 */
function darkenColor(hex: string, percent: number): string {
  const num = Number.parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent * 100);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00ff) - amt);
  const B = Math.max(0, (num & 0x0000ff) - amt);
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

/**
 * Batch validate multiple contrast pairs
 */
export function validateContrastPairs(
  pairs: Array<{
    foreground: string;
    background: string;
    textSize: 'normal' | 'large' | undefined;
  }>,
  options: Omit<ContrastValidationOptions, 'foreground' | 'background'>,
): ContrastValidationResult[] {
  return pairs.map((pair) =>
    validateContrast({
      ...options,
      foreground: pair.foreground,
      background: pair.background,
      textSize: pair.textSize,
    }),
  );
}

/**
 * Check if a demographic requires AAA contrast
 */
export function requiresAAA(demographicId: string): boolean {
  return AAA_STRICT_DEMOGRAPHICS.includes(demographicId);
}

/**
 * Format contrast result as human-readable string
 */
export function formatContrastResult(result: ContrastValidationResult): string {
  if (result.valid) {
    return `✅ Contrast ${result.ratio.toFixed(2)}:1 passes ${result.passesAAA ? 'AAA' : 'AA'}`;
  }

  let msg = `❌ Contrast ${result.ratio.toFixed(2)}:1 fails ${result.passesAAA ? 'AAA' : 'AA'} (need ${result.requiredRatio}:1)`;

  if (result.suggestion) {
    msg += `\n   → Suggestion: ${result.suggestion.type}`;
    msg += ` (would give ${result.suggestion.newRatio.toFixed(2)}:1)`;
  }

  return msg;
}
