import type { AssetRequest, AssetResult, AssetSource } from '@skeed/contracts';
import { programmaticPlaceholder } from './placeholder.js';

export interface RouterOptions {
  /** Sources registered in priority order. */
  sources: AssetSource[];
  /** When true, errors from a chosen source fall through to the next-scoring source. */
  fallback?: boolean;
}

export interface RouteResult extends AssetResult {
  sourceId: string;
  attempts: Array<{ sourceId: string; score: number; ok: boolean; error?: string }>;
}

/** Asset router with ranked match() + automatic fallback chain. */
export class AssetsRouter {
  private readonly sources: AssetSource[];

  constructor(opts: RouterOptions) {
    // Always append the placeholder so fetch() is never empty-handed.
    const hasPlaceholder = opts.sources.some((s) => s.id === programmaticPlaceholder.id);
    this.sources = hasPlaceholder ? opts.sources : [...opts.sources, programmaticPlaceholder];
  }

  /** Score every source, sort by score desc, try each in order until one succeeds. */
  async route(req: AssetRequest): Promise<RouteResult> {
    const ranked = this.sources
      .map((source) => ({ source, score: source.match(req).score }))
      .sort((a, b) => b.score - a.score);

    const attempts: RouteResult['attempts'] = [];
    let lastError: Error | undefined;
    for (const { source, score } of ranked) {
      try {
        const result = await source.fetch(req);
        attempts.push({ sourceId: source.id, score, ok: true });
        return { ...result, sourceId: source.id, attempts };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        attempts.push({ sourceId: source.id, score, ok: false, error: message });
        lastError = err instanceof Error ? err : new Error(message);
      }
    }
    throw new Error(`asset router exhausted all sources: ${lastError?.message ?? 'unknown'}`);
  }
}
