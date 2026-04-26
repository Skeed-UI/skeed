import type { DemographicPreset } from '@skeed/contracts/preset';
import type { Density } from '@skeed/contracts/demographic';
import { generateCSSVariables, type TokenOverrides } from '@skeed/core/token-resolver';

/**
 * Options for applying density to an archetype
 */
export interface DensityApplierOptions {
  /** The demographic preset */
  preset: DemographicPreset;
  /** The density to apply */
  density: Density;
  /** Optional overrides */
  overrides?: TokenOverrides;
  /** Whether to validate tokens */
  strict?: boolean;
}

/**
 * Result of applying density
 */
export interface DensityApplierResult {
  /** Resolved CSS variables for this density */
  cssVariables: Map<string, string>;
  /** Token substitutions for className transformation */
  tokenSubstitutions: Map<string, string>;
  /** Density configuration used */
  densityConfig: {
    padY: number;
    padX: number;
    gap: number;
    lineHeight: number;
  };
  /** Component ID suffix for this density */
  componentId: string;
}

/**
 * Token mapping from semantic tokens to concrete CSS variable references
 */
const TOKEN_TO_CSS_VAR: Record<string, string> = {
  // Density tokens
  'density-pady': '--skeed-current-pady',
  'density-padx': '--skeed-current-padx',
  'density-gap': '--skeed-current-gap',
  'density-lh': '--skeed-current-lh',
  
  // Common density references (will be replaced with current density)
  'skeed-density-cozy-pady': '--skeed-current-pady',
  'skeed-density-cozy-padx': '--skeed-current-padx',
  'skeed-density-cozy-gap': '--skeed-current-gap',
  'skeed-density-compact-pady': '--skeed-current-pady',
  'skeed-density-compact-padx': '--skeed-current-padx',
  'skeed-density-compact-gap': '--skeed-current-gap',
  'skeed-density-comfy-pady': '--skeed-current-pady',
  'skeed-density-comfy-padx': '--skeed-current-padx',
  'skeed-density-comfy-gap': '--skeed-current-gap',
};

/**
 * Apply density configuration to generate token substitutions
 */
export function applyDensity(options: DensityApplierOptions): DensityApplierResult {
  const { preset, density, overrides } = options;
  
  // Get density configuration
  const densityCfg = preset.density[density];
  
  // Apply overrides if present
  const finalConfig = {
    padY: overrides?.density?.[density]?.padY ?? densityCfg.padY,
    padX: overrides?.density?.[density]?.padX ?? densityCfg.padX,
    gap: overrides?.density?.[density]?.gap ?? densityCfg.gap,
    lineHeight: overrides?.density?.[density]?.lineHeight ?? densityCfg.lineHeight,
  };
  
  // Generate CSS variables
  const resolved = generateCSSVariables(preset, density, overrides);
  
  // Build CSS variable map
  const cssVariables = new Map<string, string>();
  for (const variable of resolved.cssVariables) {
    cssVariables.set(variable.name, variable.value);
  }
  
  // Add current density variables
  cssVariables.set('--skeed-current-density', density);
  cssVariables.set('--skeed-current-pady', `${finalConfig.padY}rem`);
  cssVariables.set('--skeed-current-padx', `${finalConfig.padX}rem`);
  cssVariables.set('--skeed-current-gap', `${finalConfig.gap}rem`);
  cssVariables.set('--skeed-current-lh', String(finalConfig.lineHeight));
  
  // Build token substitutions for Tailwind classes
  const tokenSubstitutions = new Map<string, string>();
  
  // Map density-specific tokens to current density values
  for (const [token, cssVar] of Object.entries(TOKEN_TO_CSS_VAR)) {
    const value = cssVariables.get(cssVar);
    if (value) {
      tokenSubstitutions.set(`skeed-${token}`, value);
    }
  }
  
  // Generate component ID
  const componentId = `${preset.id}/${density}`;
  
  return {
    cssVariables,
    tokenSubstitutions,
    densityConfig: finalConfig,
    componentId,
  };
}

/**
 * Transform a className string using density substitutions
 */
export function transformClassName(
  className: string,
  substitutions: Map<string, string>
): string {
  let result = className;
  
  // Replace each token with its substituted value
  for (const [token, value] of substitutions.entries()) {
    // Replace Tailwind arbitrary value syntax: p-[--skeed-density-cozy-pady]
    const pattern = new RegExp(`\\[--${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`, 'g');
    result = result.replace(pattern, value);
    
    // Replace CSS var reference syntax
    const varPattern = new RegExp(`var\\(--${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g');
    result = result.replace(varPattern, value);
  }
  
  return result;
}

/**
 * Get the Tailwind class for a spacing value using density tokens
 */
export function getSpacingClass(
  value: number,
  property: 'p' | 'px' | 'py' | 'm' | 'mx' | 'my' | 'gap' | 'space-x' | 'space-y',
  density: Density,
  preset: DemographicPreset
): string {
  // Find closest spacing token index
  const spacing = preset.spacing;
  let closestIdx = 0;
  let closestDiff = Math.abs(spacing[0] - value);
  
  for (let i = 1; i < spacing.length; i++) {
    const diff = Math.abs(spacing[i] - value);
    if (diff < closestDiff) {
      closestDiff = diff;
      closestIdx = i;
    }
  }
  
  // Return Tailwind class with CSS variable reference
  return `${property}-[--skeed-spacing-${closestIdx}]`;
}

/**
 * Get the Tailwind class for a radius value
 */
export function getRadiusClass(
  value: number,
  preset: DemographicPreset
): string {
  // Special case for full radius
  if (value >= 9999) {
    return 'rounded-[--skeed-radius-9999]';
  }
  
  // Find closest radius token index
  const radius = preset.radius;
  let closestIdx = 0;
  let closestDiff = Math.abs(radius[0] - value);
  
  for (let i = 1; i < radius.length; i++) {
    const diff = Math.abs(radius[i] - value);
    if (diff < closestDiff) {
      closestDiff = diff;
      closestIdx = i;
    }
  }
  
  return `rounded-[--skeed-radius-${closestIdx}]`;
}

/**
 * Validate that all density tokens in a className can be resolved
 */
export function validateDensityTokens(
  className: string,
  preset: DemographicPreset,
  density: Density
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  
  // Extract all CSS variable references
  const varRegex = /var\(--(skeed-[\w-]+)\)/g;
  const bracketRegex = /\[--(skeed-[\w-]+)\]/g;
  
  const tokens = new Set<string>();
  
  let match;
  while ((match = varRegex.exec(className)) !== null) {
    tokens.add(match[1]);
  }
  while ((match = bracketRegex.exec(className)) !== null) {
    tokens.add(match[1]);
  }
  
  // Check if density-specific tokens exist
  for (const token of tokens) {
    if (token.includes('density')) {
      // Check if this density exists in the preset
      const densityMatch = token.match(/density-([\w-]+)-/);
      if (densityMatch) {
        const tokenDensity = densityMatch[1];
        if (!['compact', 'cozy', 'comfy'].includes(tokenDensity)) {
          missing.push(token);
        }
      }
    }
  }
  
  return {
    valid: missing.length === 0,
    missing,
  };
}
