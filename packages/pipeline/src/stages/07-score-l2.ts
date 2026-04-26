import type { Stage } from '@skeed/contracts';
import { PipelineState } from './state.js';

/** Stage 07 — Score L2. M1: same as L1 since research is lite-mode skipped. */
export const stage_07_score_l2: Stage<PipelineState, PipelineState> = {
  name: '07-score-l2',
  version: '0.1.0',
  inputSchema: PipelineState,
  outputSchema: PipelineState,
  cacheable: true,
  async run(state) {
    return {
      ...state,
      scoreL2: state.scoreL1
        ? { ...state.scoreL1, rubricId: 'l2', rubricVersion: 'v1' }
        : state.scoreL2,
    };
  },
};
