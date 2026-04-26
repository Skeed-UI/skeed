import type { Stage } from '@skeed/contracts';
import { PipelineState } from './state.js';

/** Stage 06 — Deep research. M1: skipped (lite-mode passthrough). M4 wires AutoResearchClaw. */
export const stage_06_research: Stage<PipelineState, PipelineState> = {
  name: '06-research',
  version: '0.1.0',
  inputSchema: PipelineState,
  outputSchema: PipelineState,
  cacheable: true,
  async run(state) {
    return state;
  },
};
