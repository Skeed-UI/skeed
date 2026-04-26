import type { Stage } from '@skeed/contracts';
import { PipelineState } from './state.js';

/** Stage 12 — User stories. M1: 3 generic stories per demographic. */
export const stage_12_user_stories: Stage<PipelineState, PipelineState> = {
  name: '12-user-stories',
  version: '0.1.0',
  inputSchema: PipelineState,
  outputSchema: PipelineState,
  cacheable: true,
  async run(state) {
    const persona = state.classification?.candidates[0]?.demographic ?? 'user';
    return {
      ...state,
      userStories: [
        {
          id: 'us-1',
          persona,
          asA: persona,
          iWantTo: 'understand the product within 10 seconds of landing',
          soThat: 'I can decide whether to engage',
          priority: 'P0',
          acceptanceCriteria: ['hero clearly states value prop', 'one obvious CTA above the fold'],
        },
        {
          id: 'us-2',
          persona,
          asA: persona,
          iWantTo: 'sign up or join a waitlist with one form',
          soThat: 'I can be notified when ready',
          priority: 'P0',
          acceptanceCriteria: ['email-only minimum', 'success confirmation visible'],
        },
        {
          id: 'us-3',
          persona,
          asA: persona,
          iWantTo: 'see proof that others trust this product',
          soThat: 'I feel safe engaging',
          priority: 'P1',
          acceptanceCriteria: ['testimonial or count', 'trust badge present'],
        },
      ],
    };
  },
};
