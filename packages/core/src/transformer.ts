import type { Density } from '@skeed/contracts/demographic';
import type { DemographicPreset } from '@skeed/contracts/preset';
import { type TokenOverrides, generateCSSVariables } from './token-resolver.js';
import { type TokenRef, parseTokenRef, tokenToCssVar } from './tokens.js';

export interface TransformerOptions {
  /** Strict mode throws on unresolved tokens; non-strict emits a CSS comment. */
  strict?: boolean;
  /** Density to use for generation */
  density?: Density;
  /** Brand/user overrides */
  overrides?: TokenOverrides;
  /** Include density-specific CSS */
  includeDensityVars?: boolean;
}

export interface TransformerOutput {
  cssVarsBlock: string;
  densityCssBlock: string | undefined;
  unresolvedTokens: string[];
  metadata: {
    demographicId: string;
    density: Density;
    totalTokens: number;
  };
}

/**
 * Walks a DemographicPreset and emits a `:root[data-skeed-preset="..."]`
 * scoped block of CSS custom properties. Deterministic: same preset → byte-identical output.
 *
 * Enhanced to support density-specific generation and brand overrides.
 */
export function presetToCssVars(
  preset: DemographicPreset,
  opts: TransformerOptions = {},
): TransformerOutput {
  const density = opts.density ?? preset.defaultDensity;
  const lines: string[] = [];
  const unresolved: string[] = [];

  // Use new token resolver for comprehensive CSS generation
  const resolved = generateCSSVariables(preset, density, opts.overrides);

  // Generate CSS variables from resolved tokens
  for (const variable of resolved.cssVariables) {
    lines.push(`  ${variable.name}: ${variable.value};`);
  }

  if (opts.strict && unresolved.length > 0) {
    throw new Error(`unresolved tokens in preset ${preset.id}: ${unresolved.join(', ')}`);
  }

  const mainBlock = `:root[data-skeed-preset="${preset.id}"] {\n${lines.join('\n')}\n}\n`;

  // Generate density-specific CSS if requested
  let densityBlock: string | undefined;
  if (opts.includeDensityVars) {
    const densityLines: string[] = [];

    // Add density-specific overrides
    const densityCfg = preset.density[density as keyof typeof preset.density];
    densityLines.push(`  --skeed-current-density: ${density};`);
    densityLines.push(`  --skeed-current-pady: ${densityCfg.padY}rem;`);
    densityLines.push(`  --skeed-current-padx: ${densityCfg.padX}rem;`);
    densityLines.push(`  --skeed-current-gap: ${densityCfg.gap}rem;`);
    densityLines.push(`  --skeed-current-lh: ${densityCfg.lineHeight};`);

    densityBlock = `:root[data-skeed-density="${density}"] {\n${densityLines.join('\n')}\n}\n`;
  }

  return {
    cssVarsBlock: mainBlock,
    densityCssBlock: densityBlock,
    unresolvedTokens: unresolved,
    metadata: {
      demographicId: preset.id,
      density,
      totalTokens: resolved.cssVariables.length,
    },
  };
}

/** Verify that a list of token refs can all be resolved against a preset. */
export function verifyTokensResolve(
  preset: DemographicPreset,
  tokens: string[],
): { ok: boolean; unresolved: string[] } {
  const unresolved: string[] = [];
  for (const raw of tokens) {
    const ref = parseTokenRef(raw);
    if (!ref) {
      unresolved.push(raw);
      continue;
    }
    if (!resolveAgainstPreset(preset, ref)) {
      unresolved.push(raw);
    }
  }
  return { ok: unresolved.length === 0, unresolved };
}

function resolveAgainstPreset(preset: DemographicPreset, ref: TokenRef): boolean {
  switch (ref.namespace) {
    case 'color': {
      const [ramp, shade] = ref.path;
      if (!ramp || !shade) return false;
      const palette = preset.palette as unknown as Record<string, Record<string, string> | unknown>;
      const r = palette[ramp];
      return typeof r === 'object' && r !== null && shade in (r as Record<string, string>);
    }
    case 'spacing': {
      const [idx] = ref.path;
      if (!idx) return false;
      const i = Number.parseInt(idx, 10);
      return Number.isInteger(i) && i >= 0 && i < preset.spacing.length;
    }
    case 'radius': {
      const [idx] = ref.path;
      if (!idx) return false;
      const i = Number.parseInt(idx, 10);
      return Number.isInteger(i) && i >= 0 && i < preset.radius.length;
    }
    case 'density': {
      const [bucket] = ref.path;
      return bucket === 'compact' || bucket === 'cozy' || bucket === 'comfy';
    }
    case 'font': {
      const [role] = ref.path;
      return role === 'display' || role === 'body' || role === 'mono' || role === 'numeric';
    }
    case 'motion': {
      const [kind, name] = ref.path;
      if (!kind || !name) return false;
      if (kind === 'duration') return name in preset.motion.durations;
      if (kind === 'easing') return name in preset.motion.easings;
      return false;
    }
    case 'border': {
      const [field] = ref.path;
      return field === 'width' || field === 'style';
    }
    case 'shadow': {
      const [idx] = ref.path;
      if (!idx) return false;
      const i = Number.parseInt(idx, 10);
      return Number.isInteger(i) && i >= 0 && i < preset.elevation.shadows.length;
    }
    case 'icon': {
      // Icon tokens reference the preset's iconography pack id.
      const [field] = ref.path;
      return field === 'pack' || field === 'style';
    }
    default:
      return false;
  }
}

export { tokenToCssVar };
