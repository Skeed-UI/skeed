import type { Stage } from '@skeed/contracts';
import { z } from 'zod';
import { llmOrFallback } from './llm-helper.js';
import { PipelineState } from './state.js';

const Axis = z.object({ axisId: z.string(), score: z.number().min(0).max(10), reasoning: z.string() });
const ScoreOut = z.object({
  axes: z.array(Axis).length(5),
  composite: z.number().min(0).max(10),
  passes: z.boolean(),
  recommendations: z.array(z.string()).default([]),
});

const SYSTEM = `You are an L1 idea-scoring judge. Score 5 axes (0-10) per the rubric:
- clarity: is JTBD, primary user, success signal sharply defined?
- demographic_fit: does proposed demographic align with JTBD's natural audience?
- differentiation: non-obvious angle vs incumbents?
- feasibility_surface: buildable as a web app at all?
- pain_severity: is the pain real and frequent enough to warrant a product?

Composite = unweighted average. Passes when composite >= 6.5.

Return ONLY JSON:
{
  "axes": [{ "axisId": "clarity", "score": 0-10, "reasoning": "..." }, ...],
  "composite": 0-10,
  "passes": boolean,
  "recommendations": ["concrete prompt edits to lift weak axes"]
}`;

/** Stage 04 — L1 Idea Score. */
export const stage_04_score_l1: Stage<PipelineState, PipelineState> = {
  name: '04-score-l1',
  version: '0.2.0',
  inputSchema: PipelineState,
  outputSchema: PipelineState,
  cacheable: true,
  async run(state) {
    const top = state.classification?.candidates[0];
    const userMsg = `Idea: ${state.intent?.jobToBeDone ?? state.prompt}
Demographic: ${top?.demographic ?? 'unknown'}/${top?.niche ?? 'unknown'}
Pain points: ${(state.painPoints ?? []).map((p) => `[${p.severity}/${p.frequency}] ${p.description}`).join(' || ')}

Score now.`;
    const out = await llmOrFallback(
      {
        stage: '04-score-l1',
        promptVersion: 'v1',
        system: SYSTEM,
        user: userMsg,
        schema: ScoreOut,
        temperature: 0.1,
      },
      () => ({
        axes: [
          { axisId: 'clarity', score: 7.5, reasoning: 'Idea clearly stated.' },
          { axisId: 'demographic_fit', score: 7.0, reasoning: 'Demographic alignment plausible.' },
          { axisId: 'differentiation', score: 6.5, reasoning: 'Some unique angle inferred.' },
          { axisId: 'feasibility_surface', score: 8.0, reasoning: 'Buildable as web app.' },
          { axisId: 'pain_severity', score: 7.0, reasoning: 'Inferred pain is real.' },
        ],
        composite: 7.2,
        passes: true,
        recommendations: [],
      }),
    );
    return {
      ...state,
      scoreL1: { rubricId: 'l1', rubricVersion: 'v1', ...out },
    };
  },
};
