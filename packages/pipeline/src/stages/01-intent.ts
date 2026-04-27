import type { Stage } from '@skeed/contracts';
import { z } from 'zod';
import { llmOrFallback } from './llm-helper.js';
import { PipelineState } from './state.js';

const IntentExtraction = z.object({
  jobToBeDone: z.string(),
  primaryUserHypothesis: z.string().nullable(),
  frequency: z.enum(['realtime', 'daily', 'weekly', 'on-demand']).nullable(),
  dataInputs: z.array(z.string()),
  keyOutputs: z.array(z.string()),
  successSignals: z.array(z.string()),
  mentionedBrandHints: z
    .object({ color: z.string().optional(), voice: z.array(z.string()).default([]) })
    .default({ voice: [] }),
  explicitConstraints: z.array(z.string()),
});

const SYSTEM = `You analyze product ideas and extract a structured Intent.

Return ONLY a JSON object with these keys, no prose, no markdown fences:
{
  "jobToBeDone": "what the user is hiring this product to do",
  "primaryUserHypothesis": "who the primary user is, single sentence (or null)",
  "frequency": "realtime|daily|weekly|on-demand|null",
  "dataInputs": ["..."],
  "keyOutputs": ["..."],
  "successSignals": ["how we know it works"],
  "mentionedBrandHints": { "color": "optional", "voice": ["optional"] },
  "explicitConstraints": ["any caps the user mentioned"]
}`;

/** Stage 01 — Extract structured Intent from raw prompt. */
export const stage_01_intent: Stage<PipelineState, PipelineState> = {
  name: '01-intent',
  version: '0.2.0',
  inputSchema: PipelineState,
  outputSchema: PipelineState,
  cacheable: true,
  async run(state) {
    const intent = await llmOrFallback(
      {
        stage: '01-intent',
        promptVersion: 'v1',
        system: SYSTEM,
        user: `Prompt: """${state.prompt}"""\n\nReturn the JSON object now.`,
        schema: IntentExtraction,
        temperature: 0.1,
        maxTokens: 800,
      },
      () => ({
        jobToBeDone: `Build: ${state.prompt}`,
        primaryUserHypothesis: 'A motivated end-user who wants this outcome',
        frequency: 'on-demand' as const,
        dataInputs: [],
        keyOutputs: ['delivered outcome'],
        successSignals: ['user completes core task'],
        mentionedBrandHints: { voice: [] },
        explicitConstraints: [],
      }),
    );
    return { ...state, intent };
  },
};
