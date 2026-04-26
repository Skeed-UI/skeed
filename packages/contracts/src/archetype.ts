import { z } from 'zod';
import { AssetSlot, License } from './component.js';
import { Category, Framework } from './demographic.js';

/**
 * An Archetype is a token-only canonical component template.
 * Cross-product of (archetype × demographic × density) generates
 * the published component variants.
 *
 * Lives at: data/archetypes/<id>.archetype.tsx (TSX) +
 *           data/archetypes/<id>.archetype.json (this manifest)
 */
export const ArchetypeManifest = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  schemaVersion: z.literal(1),
  category: Category,
  description: z.string(),
  /**
   * Tokens this archetype consumes. The transformer will refuse to compile
   * if any consumed token is missing from the active DemographicPreset.
   */
  tokensUsed: z.array(z.string()).min(1),
  /**
   * Asset slots this archetype declares. Each component variant inherits these
   * unless overridden in its manifest.
   */
  assetSlots: z.array(AssetSlot).default([]),
  defaultVariantsPerDensity: z.number().int().min(1).default(1),
  frameworks: z.array(Framework).min(1),
  license: License,
  /**
   * Demographics this archetype is *invalid* for (e.g. a "transaction-row"
   * archetype is invalid for "kids"). Codegen skips these combinations.
   */
  demographicAntiPatterns: z.array(z.string()).default([]),
});
export type ArchetypeManifest = z.infer<typeof ArchetypeManifest>;
