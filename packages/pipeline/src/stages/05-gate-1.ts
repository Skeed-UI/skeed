import type { Stage, StageContext } from '@skeed/contracts';
import { PipelineState } from './state.js';

/**
 * Stage 05 — Score Gate 1. The orchestrator emits a `gate-1` event so the host
 * UI (CLI or browser preview) can pause for user decision. Returns state with
 * a marker; CLI is responsible for halting before invoking the next stage when
 * `passes` is false and `--yes` is not set.
 */
export const stage_05_gate_1: Stage<PipelineState, PipelineState> = {
  name: '05-gate-1',
  version: '0.2.0',
  inputSchema: PipelineState,
  outputSchema: PipelineState,
  cacheable: false,
  async run(state, ctx: StageContext) {
    ctx.emit({
      stage: '05-gate-1',
      type: 'token',
      data: { kind: 'gate', score: state.scoreL1?.composite ?? 0, passes: state.scoreL1?.passes ?? true },
    });
    return state;
  },
};
