/**
 * Skeed Codegen Package
 * 
 * Component generation engine that transforms archetypes × presets × densities
 * into resolved, runnable components.
 * 
 * @example
 * ```typescript
 * import { generateVariants, emitComponent } from '@skeed/codegen';
 * 
 * // Generate all 3,600 components
 * const result = await generateVariants({
 *   archetypes: await loadArchetypes(),
 *   demographics: ['kids', 'fintech', 'health'],
 *   loadPreset: async (id) => await loadPreset(id),
 *   onProgress: (p) => console.log(`${p.percentage}% complete`),
 * });
 * 
 * // Or generate a single component
 * const component = await emitComponent({
 *   archetype: buttonArchetype,
 *   preset: kidsPreset,
 *   density: 'cozy',
 * });
 * ```
 */

export {
  // Component emitter
  emitComponent,
  emitManifest,
  emitCSSVariables,
  validateEmission,
  type ComponentEmitterOptions,
  type GeneratedComponent,
  type ComponentManifest,
  type ArchetypeDefinition,
  type ArchetypeProp,
} from './component-emitter.js';

export {
  // Density applier
  applyDensity,
  transformClassName,
  getSpacingClass,
  getRadiusClass,
  validateDensityTokens,
  type DensityApplierOptions,
  type DensityApplierResult,
} from './density-applier.js';

export {
  // Generate variants
  generateVariants,
  generateArchetypeVariants,
  generateDemographicVariants,
  validateGenerationOptions,
  type GenerateVariantsOptions,
  type GenerationProgress,
  type GenerationResult,
  type GenerationStats,
  type GenerationFailure,
  type CacheStats,
} from './generate-variants.js';
