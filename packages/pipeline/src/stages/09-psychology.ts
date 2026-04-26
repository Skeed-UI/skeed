import type { Stage } from '@skeed/contracts';
import { PipelineState } from './state.js';

/** Stage 09 — Psychology. M1: hardcoded profile keyed on demographic. */
export const stage_09_psychology: Stage<PipelineState, PipelineState> = {
  name: '09-psychology',
  version: '0.1.0',
  inputSchema: PipelineState,
  outputSchema: PipelineState,
  cacheable: true,
  async run(state) {
    const top = state.classification?.candidates[0];
    if (!top) return state;
    return {
      ...state,
      psychology: {
        demographic: top.demographic,
        niche: top.niche,
        schemaVersion: 1,
        cognitiveLoadTarget: top.demographic === 'kids' ? 'low' : 'medium',
        trustCuesNeeded:
          top.demographic === 'kids'
            ? ['mascot', 'soft_rounding']
            : ['testimonial', 'verified_check'],
        motivationPattern: top.demographic === 'kids' ? 'mastery' : 'intrinsic',
        formality: top.demographic === 'gov' ? 5 : top.demographic === 'kids' ? 1 : 3,
        noveltyTolerance: top.demographic === 'kids' ? 5 : 3,
        accessibilityFloor: top.demographic === 'kids' || top.demographic === 'gov' ? 'AAA' : 'AA',
        forbiddenPatterns: top.demographic === 'kids' ? ['dark_pattern', 'urgency_timer'] : [],
        research: { sources: [], notes: 'M1 hardcoded profile.' },
      },
    };
  },
};
