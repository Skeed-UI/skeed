import type { Stage } from '@skeed/contracts';
import { PipelineState } from './state.js';

/** Stage 03 — Pain-Point Probing. M1: derives one default pain. */
export const stage_03_pain_points: Stage<PipelineState, PipelineState> = {
  name: '03-pain-points',
  version: '0.1.0',
  inputSchema: PipelineState,
  outputSchema: PipelineState,
  cacheable: true,
  async run(state) {
    return {
      ...state,
      painPoints: [
        {
          id: 'p1',
          description: 'Existing tools are too generic; off-the-shelf options miss demographic needs.',
          severity: 4,
          frequency: 4,
          evidence: [],
        },
        {
          id: 'p2',
          description: 'Setup friction is high; users abandon before value.',
          severity: 3,
          frequency: 5,
          evidence: [],
        },
      ],
    };
  },
};
