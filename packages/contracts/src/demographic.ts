import { z } from 'zod';

/**
 * The closed enum of demographic verticals Skeed targets.
 *
 * Adding a new demographic is a quarterly RFC process — the enum stays closed
 * to keep retrieval filtering fast and the catalog coherent. For long-tail or
 * exploratory targeting, every component also carries an open `tags[]` field.
 */
export const DemographicId = z.enum([
  'kids',
  'teens',
  'working_class',
  'education',
  'religious',
  'mental_wellness',
  'health',
  'legal',
  'erp',
  'sales_crm',
  'hightech',
  'social',
  'monitoring',
  'classic',
  'fintech',
  'ai_apps',
  'marketplace',
  'listings',
  'gov',
  'military',
  'productivity',
]);
export type DemographicId = z.infer<typeof DemographicId>;

export const Density = z.enum(['compact', 'cozy', 'comfy']);
export type Density = z.infer<typeof Density>;

export const Framework = z.enum(['react', 'vue', 'svelte', 'web-components']);
export type Framework = z.infer<typeof Framework>;

export const Category = z.enum(['atom', 'molecule', 'organism', 'template', 'block', 'page']);
export type Category = z.infer<typeof Category>;

export const WcagLevel = z.enum(['A', 'AA', 'AAA']);
export type WcagLevel = z.infer<typeof WcagLevel>;
