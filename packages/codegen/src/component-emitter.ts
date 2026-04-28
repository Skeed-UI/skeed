import type { DemographicPreset, Density } from '@skeed/contracts';
import type { TokenOverrides } from '@skeed/core/token-resolver';

/**
 * Archetype definition structure
 */
export interface ArchetypeDefinition {
  id: string;
  category: 'atom' | 'molecule' | 'organism' | 'template' | 'page';
  source: string; // TSX source code
  imports: string[];
  tokens: string[]; // Token references used
  props: ArchetypeProp[];
}

/**
 * Archetype property definition
 */
export interface ArchetypeProp {
  name: string;
  type: string;
  required: boolean;
  default?: unknown;
}

/**
 * Component emission options
 */
export interface ComponentEmitterOptions {
  /** Archetype definition */
  archetype: ArchetypeDefinition;
  /** Demographic preset */
  preset: DemographicPreset;
  /** Density to apply */
  density: Density;
  /** Optional overrides */
  overrides?: TokenOverrides;
  /** Component variant */
  variant?: string;
}

/**
 * Generated component output
 */
export interface GeneratedComponent {
  /** Component ID */
  id: string;
  /** Resolved TSX source */
  source: string;
  /** Component manifest */
  manifest: ComponentManifest;
  /** CSS variables used */
  cssVariables: Map<string, string>;
  /** Dependencies to import */
  dependencies: string[];
}

/**
 * Component manifest metadata
 */
export interface ComponentManifest {
  id: string;
  archetypeId: string;
  demographicId: string;
  density: Density;
  variant?: string;
  wcagLevel: 'AA' | 'AAA';
  tokens: string[];
  contentHash: string;
  framework: 'react' | 'vue' | 'svelte' | 'web-components';
}

/**
 * Token substitution mapping
 */
interface TokenSubstitution {
  original: string;
  replacement: string;
  type: 'color' | 'spacing' | 'radius' | 'density' | 'font' | 'motion' | 'shadow' | 'other';
}

/**
 * Emit a resolved component from an archetype
 */
export async function emitComponent(options: ComponentEmitterOptions): Promise<GeneratedComponent> {
  const { archetype, preset, density, overrides, variant = 'default' } = options;

  // Generate CSS variables for this preset/density combination
  const { generateCSSVariables } = await import('@skeed/core/token-resolver');
  const resolved = generateCSSVariables(preset, density, overrides);

  // Build CSS variable map
  const cssVariables = new Map<string, string>();
  for (const variable of resolved.cssVariables) {
    cssVariables.set(variable.name, variable.value);
  }

  // Add current density variables
  const densityCfg = preset.density[density];
  cssVariables.set('--skeed-current-density', density);
  cssVariables.set('--skeed-current-pady', `${densityCfg.padY}rem`);
  cssVariables.set('--skeed-current-padx', `${densityCfg.padX}rem`);
  cssVariables.set('--skeed-current-gap', `${densityCfg.gap}rem`);
  cssVariables.set('--skeed-current-lh', String(densityCfg.lineHeight));

  // Transform source code
  const substitutions = buildTokenSubstitutions(archetype.tokens, cssVariables);
  let source = transformSource(archetype.source, substitutions);

  // Add component header comment
  const header = generateComponentHeader(archetype, preset, density, variant);
  source = header + source;

  // Generate component ID
  const id = `${preset.id}/${archetype.id}/${density}/${variant}`;

  // Calculate content hash for caching
  const contentHash = generateContentHash(source);

  // Determine WCAG level based on demographic
  const wcagLevel = isAAAStrict(preset.id) ? 'AAA' : 'AA';

  return {
    id,
    source,
    manifest: {
      id,
      archetypeId: archetype.id,
      demographicId: preset.id,
      density,
      variant,
      wcagLevel,
      tokens: archetype.tokens,
      contentHash,
      framework: 'react', // Default framework
    },
    cssVariables,
    dependencies: archetype.imports,
  };
}

/**
 * Build token substitutions from CSS variables
 */
function buildTokenSubstitutions(
  tokens: string[],
  cssVariables: Map<string, string>,
): TokenSubstitution[] {
  const substitutions: TokenSubstitution[] = [];

  for (const token of tokens) {
    const cssVar = tokenToCssVariable(token);
    const value = cssVariables.get(cssVar);

    if (value) {
      const type = inferTokenType(token);
      substitutions.push({
        original: token,
        replacement: value,
        type,
      });
    }
  }

  return substitutions;
}

/**
 * Convert a semantic token to CSS variable name
 */
function tokenToCssVariable(token: string): string {
  // Handle different token formats
  if (token.startsWith('skeed-')) {
    return `--${token}`;
  }

  // Convert dot notation to CSS variable format
  // e.g., color.brand.500 → --skeed-color-brand-500
  const parts = token.split('.');
  return `--skeed-${parts.join('-')}`;
}

/**
 * Infer token type from token string
 */
function inferTokenType(token: string): TokenSubstitution['type'] {
  if (token.includes('color')) return 'color';
  if (token.includes('spacing')) return 'spacing';
  if (token.includes('radius')) return 'radius';
  if (token.includes('density')) return 'density';
  if (token.includes('font')) return 'font';
  if (token.includes('motion')) return 'motion';
  if (token.includes('shadow')) return 'shadow';
  return 'other';
}

/**
 * Transform source code with token substitutions
 */
function transformSource(source: string, substitutions: TokenSubstitution[]): string {
  let result = source;

  // Sort substitutions by length (longest first) to avoid partial replacements
  const sorted = [...substitutions].sort((a, b) => b.original.length - a.original.length);

  for (const sub of sorted) {
    // Replace CSS variable syntax
    const varPattern = new RegExp(`var\\(${escapeRegex(tokenToCssVariable(sub.original))}\\)`, 'g');
    result = result.replace(varPattern, sub.replacement);

    // Replace Tailwind bracket syntax
    const bracketPattern = new RegExp(
      `\\[${escapeRegex(tokenToCssVariable(sub.original))}\\]`,
      'g',
    );
    result = result.replace(bracketPattern, sub.replacement);
  }

  return result;
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Generate component header comment
 */
function generateComponentHeader(
  archetype: ArchetypeDefinition,
  preset: DemographicPreset,
  density: Density,
  variant: string,
): string {
  const lines = [
    '/**',
    ` * @generated Component: ${archetype.id}`,
    ` * @demographic ${preset.id}`,
    ` * @density ${density}`,
    ` * @variant ${variant}`,
    ` * @category ${archetype.category}`,
    ` * @schemaVersion 1`,
    ` * @generatedAt ${new Date().toISOString()}`,
    ' * ',
    ' * DO NOT EDIT: This file is auto-generated from archetype:',
    ` *   - Source: ${archetype.id}`,
    ` *   - Preset: ${preset.id}`,
    ' */',
    '',
  ];

  return lines.join('\n');
}

/**
 * Generate content hash for caching
 */
function generateContentHash(content: string): string {
  // Simple hash for now - in production use crypto.subtle or similar
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Check if demographic requires AAA strict accessibility
 */
function isAAAStrict(demographicId: string): boolean {
  const aaaStrictDemographics = ['kids', 'education', 'health', 'gov', 'mental_wellness'];
  return aaaStrictDemographics.includes(demographicId);
}

/**
 * Emit component manifest file
 */
export function emitManifest(component: GeneratedComponent): string {
  return JSON.stringify(component.manifest, null, 2);
}

/**
 * Emit CSS variables for a component
 */
export function emitCSSVariables(component: GeneratedComponent): string {
  const lines: string[] = [
    `/* CSS Variables for ${component.id} */`,
    `:root[data-skeed-preset="${component.manifest.demographicId}"][data-skeed-density="${component.manifest.density}"] {`,
  ];

  for (const [name, value] of component.cssVariables) {
    lines.push(`  ${name}: ${value};`);
  }

  lines.push('}');
  return lines.join('\n');
}

/**
 * Validate that a component can be emitted
 */
export function validateEmission(
  archetype: ArchetypeDefinition,
  preset: DemographicPreset,
  density: Density,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check all tokens can be resolved
  for (const token of archetype.tokens) {
    const cssVar = tokenToCssVariable(token);
    // This is a simplified check - in reality would use token resolver
    if (!cssVar.startsWith('--skeed-')) {
      errors.push(`Invalid token format: ${token}`);
    }
  }

  // Check density exists in preset
  if (!preset.density[density]) {
    errors.push(`Density ${density} not found in preset ${preset.id}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
