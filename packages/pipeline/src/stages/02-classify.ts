import type { DemographicId, Stage } from '@skeed/contracts';
import { PipelineState } from './state.js';

/** Stage 02 — Demographic & Niche Classification. M1: prompt-keyword heuristic. */
export const stage_02_classify: Stage<PipelineState, PipelineState> = {
  name: '02-classify',
  version: '0.1.0',
  inputSchema: PipelineState,
  outputSchema: PipelineState,
  cacheable: true,
  async run(state) {
    const guess = inferDemographic(state.prompt);
    return {
      ...state,
      classification: {
        candidates: [
          {
            demographic: guess.demographic,
            niche: guess.niche,
            confidence: 0.82,
            reasoning: 'M1 hardcoded heuristic; M2 will use LLM classifier.',
          },
        ],
        needsClarification: false,
        questions: [],
      },
    };
  },
};

function inferDemographic(prompt: string): { demographic: DemographicId; niche: string } {
  const p = prompt.toLowerCase();
  if (p.includes('kid') || p.includes('child') || p.includes('school')) {
    return { demographic: 'kids', niche: 'learning' };
  }
  if (p.includes('finance') || p.includes('bank') || p.includes('money') || p.includes('invest')) {
    return { demographic: 'fintech', niche: 'consumer' };
  }
  if (p.includes('health') || p.includes('clinic') || p.includes('patient')) {
    return { demographic: 'health', niche: 'general' };
  }
  if (p.includes('gov') || p.includes('public') || p.includes('civic')) {
    return { demographic: 'gov', niche: 'general' };
  }
  return { demographic: 'productivity', niche: 'general' };
}
