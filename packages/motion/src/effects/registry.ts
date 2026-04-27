/**
 * Effect registry - stores and retrieves effect generators
 */

import type { EffectName, EffectSpec } from '../grammar/types.js';
import type { EffectGenerator, RegisteredEffect, EffectContext, EffectOutput } from './types.js';

const registry = new Map<EffectName, RegisteredEffect>();

/**
 * Register an effect generator
 */
export function registerEffect(
  name: EffectName,
  generator: EffectGenerator,
  defaultParameters: Record<string, string | number | boolean> = {}
): void {
  registry.set(name, { name, generator, defaultParameters });
}

/**
 * Get a registered effect
 */
export function getEffect(name: EffectName): RegisteredEffect | undefined {
  return registry.get(name);
}

/**
 * Check if effect is registered
 */
export function hasEffect(name: EffectName): boolean {
  return registry.has(name);
}

/**
 * Execute an effect generator with merged parameters
 */
export function executeEffect(
  spec: EffectSpec,
  context: EffectContext
): EffectOutput {
  const registered = getEffect(spec.name);
  if (!registered) {
    // Return identity (no change) for unknown effects
    return { transforms: [] };
  }

  // Merge default parameters with provided ones
  const parameters = {
    ...registered.defaultParameters,
    ...spec.parameters,
  };

  return registered.generator(context, parameters);
}

/**
 * List all registered effect names
 */
export function listEffects(): EffectName[] {
  return Array.from(registry.keys());
}
