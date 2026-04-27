import type { Stage } from '@skeed/contracts';
import { AssetsRouter } from '@skeed/assets-router';
import { PipelineState } from './state.js';

/**
 * Stage 16 — Asset population. Walks the chosen IA + landing slots, asks the
 * AssetsRouter for each non-logo asset (logo comes from Stage 10). Writes
 * resolved asset blobs to state for Stage 17 to emit to disk.
 */
export const stage_16_assets: Stage<PipelineState, PipelineState> = {
  name: '16-assets',
  version: '0.2.0',
  inputSchema: PipelineState,
  outputSchema: PipelineState,
  cacheable: false,
  async run(state) {
    const router = new AssetsRouter({ sources: [] }); // placeholder is auto-appended
    const assets: NonNullable<PipelineState['resolvedAssets']> = [];

    if (state.logoChosen) {
      assets.push({
        slot: 'logo',
        kind: 'logo',
        sourceId: 'svg-composer',
        relativePath: 'public/logo.svg',
        contents: state.logoChosen.svg,
        encoding: 'utf8',
      });
    }

    // For M2: emit one hero illustration via router (placeholder fallback).
    const top = state.classification?.candidates[0];
    if (top) {
      try {
        const reqBase: Parameters<AssetsRouter['route']>[0] = {
          slotRole: 'hero',
          slotType: 'hero_illustration',
          demographic: top.demographic,
          niche: top.niche,
          intent: state.intent?.jobToBeDone?.slice(0, 80) ?? 'hero illustration',
          size: { width: 1200, height: 600 },
        };
        if (state.designSystem?.palette.primary) reqBase.brandColor = state.designSystem.palette.primary;
        const heroResult = await router.route(reqBase);
        assets.push({
          slot: 'hero',
          kind: 'hero_illustration',
          sourceId: heroResult.sourceId,
          relativePath: 'public/hero.svg',
          contents: new TextDecoder().decode(heroResult.bytes),
          encoding: 'utf8',
        });
      } catch (err) {
        process.stderr.write(`[skeed] hero asset fetch failed: ${err instanceof Error ? err.message : String(err)}\n`);
      }
    }

    return { ...state, resolvedAssets: assets };
  },
};
