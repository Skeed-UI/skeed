import type { Stage } from '@skeed/contracts';
import { PipelineState } from './state.js';

/** Stage 16 — Asset population. M1: writes chosen logo SVG only. */
export const stage_16_assets: Stage<PipelineState, PipelineState> = {
  name: '16-assets',
  version: '0.1.0',
  inputSchema: PipelineState,
  outputSchema: PipelineState,
  cacheable: true,
  async run(state) {
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
    return { ...state, resolvedAssets: assets };
  },
};
