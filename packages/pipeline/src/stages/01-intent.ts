import type { Stage } from '@skeed/contracts';
import { PipelineState } from './state.js';

/**
 * Stage 01 — Extract structured Intent from raw prompt.
 * M1: hardcoded; M2 wires real LLM via Vercel AI SDK + @ai-sdk/anthropic.
 */
export const stage_01_intent: Stage<PipelineState, PipelineState> = {
  name: '01-intent',
  version: '0.1.0',
  inputSchema: PipelineState,
  outputSchema: PipelineState,
  cacheable: true,
  async run(state) {
    return {
      ...state,
      intent: {
        jobToBeDone: `Build: ${state.prompt}`,
        primaryUserHypothesis: 'A motivated end-user who wants this outcome',
        frequency: 'on-demand',
        dataInputs: [],
        keyOutputs: ['delivered outcome'],
        successSignals: ['user completes core task'],
        mentionedBrandHints: { voice: [] },
        explicitConstraints: [],
      },
    };
  },
};
