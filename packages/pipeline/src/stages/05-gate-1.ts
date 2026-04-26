import type { Stage } from '@skeed/contracts';
import { PipelineState } from './state.js';

/** Stage 05 — Score Gate 1. M1: passthrough; CLI surfaces gate as approval prompt. */
export const stage_05_gate_1: Stage<PipelineState, PipelineState> = {
  name: '05-gate-1',
  version: '0.1.0',
  inputSchema: PipelineState,
  outputSchema: PipelineState,
  cacheable: false,
  async run(state) {
    return state;
  },
};
