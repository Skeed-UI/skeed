import type { Stage } from '@skeed/contracts';
import { PipelineState } from './state.js';

/** Stage 13 — Landing candidates. M1: emits one chosen "hero-led" candidate using LayoutNode DSL. */
export const stage_13_landing_options: Stage<PipelineState, PipelineState> = {
  name: '13-landing-options',
  version: '0.1.0',
  inputSchema: PipelineState,
  outputSchema: PipelineState,
  cacheable: true,
  async run(state) {
    const layout = {
      id: 'landing-root',
      type: 'col' as const,
      props: { gap: 0, align: 'stretch' as const },
      children: [
        { id: 'navbar', type: 'slot' as const, componentId: 'navbar/default', bindings: {} },
        { id: 'hero', type: 'slot' as const, componentId: 'hero/default', bindings: {} },
        { id: 'features', type: 'slot' as const, componentId: 'feature-grid/default', bindings: {} },
        { id: 'cta', type: 'slot' as const, componentId: 'card/cta', bindings: {} },
        { id: 'footer', type: 'slot' as const, componentId: 'footer/default', bindings: {} },
      ],
    };
    return {
      ...state,
      landingChosen: {
        id: 'landing-1',
        archetype: 'hero-led',
        layout,
        preview: 'M1 placeholder — full preview rendered in M3 via packages/landing-options.',
      },
    };
  },
};
