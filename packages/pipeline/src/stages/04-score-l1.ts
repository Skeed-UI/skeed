import type { Stage } from '@skeed/contracts';
import { PipelineState } from './state.js';

/** Stage 04 — Idea Score L1. M1: passing 5-axis score. */
export const stage_04_score_l1: Stage<PipelineState, PipelineState> = {
  name: '04-score-l1',
  version: '0.1.0',
  inputSchema: PipelineState,
  outputSchema: PipelineState,
  cacheable: true,
  async run(state) {
    return {
      ...state,
      scoreL1: {
        rubricId: 'l1',
        rubricVersion: 'v1',
        axes: [
          { axisId: 'clarity', score: 7.5, reasoning: 'Idea clearly stated.' },
          { axisId: 'demographic_fit', score: 7.0, reasoning: 'Demographic alignment plausible.' },
          { axisId: 'differentiation', score: 6.5, reasoning: 'Some unique angle inferred.' },
          { axisId: 'feasibility_surface', score: 8.0, reasoning: 'Buildable as web app.' },
          { axisId: 'pain_severity', score: 7.0, reasoning: 'Inferred pain is real.' },
        ],
        composite: 7.2,
        passes: true,
        recommendations: [],
      },
    };
  },
};
