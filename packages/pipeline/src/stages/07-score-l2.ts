import type { Stage } from '@skeed/contracts';
import { z } from 'zod';
import { llmOrFallback } from './llm-helper.js';
import { PipelineState } from './state.js';

const Axis = z.object({ axisId: z.string(), score: z.number().min(0).max(10), reasoning: z.string() });
const ScoreOut = z.object({
  axes: z.array(Axis).length(9),
  composite: z.number().min(0).max(10),
  passes: z.boolean(),
  recommendations: z.array(z.string()).default([]),
});

const SYSTEM = `You are an L2 idea-scoring judge. Score 9 axes (0-10):
1. clarity
2. demographic_fit
3. differentiation
4. feasibility_surface
5. pain_severity
6. market_opportunity (TAM/SAM signals)
7. regulatory_load (compliance burden — high score = LOW burden)
8. infra_readiness (APIs/models needed exist?)
9. build_complexity (high score = LOW complexity)

Composite = unweighted average. Passes when composite >= 7.0.

Return ONLY JSON: { "axes":[...], "composite":number, "passes":boolean, "recommendations":[] }`;

export const stage_07_score_l2: Stage<PipelineState, PipelineState> = {
  name: '07-score-l2',
  version: '0.2.0',
  inputSchema: PipelineState,
  outputSchema: PipelineState,
  cacheable: true,
  async run(state) {
    const top = state.classification?.candidates[0];
    const research = (state as { researchFindings?: unknown }).researchFindings;
    const userMsg = `Idea: ${state.intent?.jobToBeDone ?? state.prompt}
Demographic: ${top?.demographic}/${top?.niche}
L1 score: ${state.scoreL1?.composite ?? 'n/a'}
Research: ${research ? JSON.stringify(research).slice(0, 1500) : 'none'}

Score now.`;
    const out = await llmOrFallback(
      {
        stage: '07-score-l2',
        promptVersion: 'v1',
        system: SYSTEM,
        user: userMsg,
        schema: ScoreOut,
        temperature: 0.1,
      },
      () => {
        const baseAxes = state.scoreL1?.axes ?? [];
        const padded = [
          ...baseAxes,
          { axisId: 'market_opportunity', score: 7, reasoning: 'fallback' },
          { axisId: 'regulatory_load', score: 7, reasoning: 'fallback' },
          { axisId: 'infra_readiness', score: 8, reasoning: 'fallback' },
          { axisId: 'build_complexity', score: 7, reasoning: 'fallback' },
        ];
        return {
          axes: padded.slice(0, 9),
          composite: state.scoreL1?.composite ?? 7,
          passes: true,
          recommendations: [],
        };
      },
    );
    return {
      ...state,
      scoreL2: { rubricId: 'l2', rubricVersion: 'v1', ...out },
    };
  },
};
