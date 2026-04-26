import type { Stage } from '@skeed/contracts';
import { PipelineState } from './state.js';

/** Stage 14 — Information Architecture. M1: minimal sitemap (landing + thanks). */
export const stage_14_ia: Stage<PipelineState, PipelineState> = {
  name: '14-ia',
  version: '0.1.0',
  inputSchema: PipelineState,
  outputSchema: PipelineState,
  cacheable: true,
  async run(state) {
    return {
      ...state,
      siteMap: {
        pages: [
          {
            id: 'home',
            route: '/',
            purpose: 'landing',
            slots: [
              { role: 'hero', intent: 'state value prop', candidateIds: [], chosenId: null },
              { role: 'features', intent: 'list 3 benefits', candidateIds: [], chosenId: null },
              { role: 'cta', intent: 'capture email or signup', candidateIds: [], chosenId: null },
            ],
          },
          {
            id: 'thanks',
            route: '/thanks',
            purpose: 'confirmation',
            slots: [{ role: 'hero', intent: 'thank user', candidateIds: [], chosenId: null }],
          },
        ],
        nav: { pattern: 'top', items: [{ pageId: 'home', label: 'Home' }] },
        dataModel: [],
      },
    };
  },
};
