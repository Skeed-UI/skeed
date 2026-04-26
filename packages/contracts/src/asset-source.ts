import type { DemographicId } from './demographic.js';
import type { AssetSlotType } from './component.js';

export interface AssetRequest {
  slotRole: string;
  slotType: AssetSlotType;
  demographic: DemographicId;
  niche?: string;
  intent: string;
  styleHint?: string;
  size?: { width: number; height: number };
  brandColor?: string;
}

export interface AssetResult {
  bytes: Uint8Array;
  mime: string;
  width?: number;
  height?: number;
  altText: string;
  license: string;
  attribution?: { source: string; url?: string; author?: string };
  costCents?: number;
  cacheKey: string;
}

/**
 * Plugin contract for any asset source (AI gen, stock, programmatic SVG).
 *
 * Implementations live in `packages/asset-source-<name>/` and are registered
 * by `@skeed/cli` reading `skeed.config.json`. The router calls `match()`
 * on every registered source for a given slot and picks the highest scorer.
 */
export interface AssetSource {
  /** Unique id, e.g. "fal", "unsplash", "svg-composer". */
  readonly id: string;
  /** Whether this source can satisfy a slot, and how well (0..1). */
  match(req: AssetRequest): { score: number; reason: string };
  /** Fetch (or generate) the asset. Caching is the router's responsibility. */
  fetch(req: AssetRequest): Promise<AssetResult>;
  /** Optional: upfront cost estimate for budget gating. */
  estimateCost?(req: AssetRequest): number;
}
