import type { Stage } from '@skeed/contracts';
import { PipelineState } from './state.js';

/** Stage 08 — Score Gate 2. Passthrough. */
export const stage_08_gate_2: Stage<PipelineState, PipelineState> = {
  name: '08-gate-2',
  version: '0.1.0',
  inputSchema: PipelineState,
  outputSchema: PipelineState,
  cacheable: false,
  async run(state) {
    return state;
  },
};
