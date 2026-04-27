import type { Stage } from '@skeed/contracts';
import { z } from 'zod';
import { llmOrFallback } from './llm-helper.js';
import { PipelineState } from './state.js';

const PainOut = z.object({
  painPoints: z
    .array(
      z.object({
        id: z.string(),
        description: z.string(),
        severity: z.number().int().min(1).max(5),
        frequency: z.number().int().min(1).max(5),
        evidence: z.array(z.string()).default([]),
      }),
    )
    .min(2)
    .max(6),
});

const SYSTEM = `You extract real pain points the target user faces today.

Return ONLY JSON:
{
  "painPoints": [
    { "id": "p1", "description": "...", "severity": 1-5, "frequency": 1-5, "evidence": ["..."] }
  ]
}

Rules:
- 2-6 pain points.
- Severity = how badly it hurts. Frequency = how often it happens.
- Evidence = short citation snippets (can be empty if inferred).
- Be concrete. No marketing fluff.`;

/** Stage 03 — Pain-Point Probing. */
export const stage_03_pain_points: Stage<PipelineState, PipelineState> = {
  name: '03-pain-points',
  version: '0.2.0',
  inputSchema: PipelineState,
  outputSchema: PipelineState,
  cacheable: true,
  async run(state) {
    const top = state.classification?.candidates[0];
    const userMsg = `Idea: """${state.intent?.jobToBeDone ?? state.prompt}"""
Demographic: ${top?.demographic ?? 'unknown'}
Niche: ${top?.niche ?? 'unknown'}

Extract pain points now.`;
    const out = await llmOrFallback(
      {
        stage: '03-pain-points',
        promptVersion: 'v1',
        system: SYSTEM,
        user: userMsg,
        schema: PainOut,
        temperature: 0.3,
      },
      () => ({
        painPoints: [
          {
            id: 'p1',
            description: 'Existing tools are too generic; off-the-shelf options miss demographic needs.',
            severity: 4,
            frequency: 4,
            evidence: [],
          },
          {
            id: 'p2',
            description: 'Setup friction is high; users abandon before value.',
            severity: 3,
            frequency: 5,
            evidence: [],
          },
        ],
      }),
    );
    return { ...state, painPoints: out.painPoints };
  },
};
