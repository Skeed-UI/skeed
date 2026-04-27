import type { Stage, StageContext } from '@skeed/contracts';
import { PipelineState } from './state.js';

export const stage_08_gate_2: Stage<PipelineState, PipelineState> = {
  name: '08-gate-2',
  version: '0.2.0',
  inputSchema: PipelineState,
  outputSchema: PipelineState,
  cacheable: false,
  async run(state, ctx: StageContext) {
    ctx.emit({
      stage: '08-gate-2',
      type: 'token',
      data: { kind: 'gate', score: state.scoreL2?.composite ?? 0, passes: state.scoreL2?.passes ?? true },
    });
    return state;
  },
};
