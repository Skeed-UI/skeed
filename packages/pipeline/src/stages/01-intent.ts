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

Return ONLY a JSON object. DO NOT copy the example values below - generate fresh, specific content based on the user's prompt:
{
  "jobToBeDone": "<brief description of what the user wants to accomplish>",
  "primaryUserHypothesis": "<who the primary user is> or null",
  "frequency": "realtime|daily|weekly|on-demand|null",
  "dataInputs": ["<what data goes into the app>"],
  "keyOutputs": ["<what value comes out>"],
  "successSignals": ["<measurable indicators of success>"],
  "mentionedBrandHints": { "color": "<hex or named color if mentioned>", "voice": ["<tone descriptors>"] },
  "explicitConstraints": ["<any limitations or requirements>"]
}

IMPORTANT: Generate specific, original content based on the user's product idea. Do NOT echo these placeholder descriptions.`;

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
        validate: (value) => validateIntent(value, state.prompt),
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

function validateIntent(value: z.infer<typeof IntentExtraction>, prompt: string): string[] {
  const issues: string[] = [];
  const serialized = JSON.stringify(value).toLowerCase();
  if (/<[^>]+>/.test(serialized)) issues.push('contains placeholder angle-bracket text');
  const promptTerms = prompt.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 4);
  if (promptTerms.length > 0 && !promptTerms.some((term) => serialized.includes(term))) {
    issues.push('intent does not retain meaningful prompt terms');
  }
  const jobLower = value.jobToBeDone.toLowerCase();
  if (promptTerms.length > 0 && !promptTerms.some((term) => jobLower.includes(term))) {
    issues.push('jobToBeDone must reference a meaningful term from the user prompt');
  }
  if (/analyze product ideas|structured intent|extract.*intent/i.test(value.jobToBeDone)) {
    issues.push('jobToBeDone echoes the system prompt instead of describing the user idea');
  }
  if (value.jobToBeDone.trim().length < 8) issues.push('jobToBeDone is too short');
  if (value.successSignals.length === 0) issues.push('missing success signals');
  return issues;
}
