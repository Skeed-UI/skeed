import type { Stage } from '@skeed/contracts';
import { z } from 'zod';
import { llmOrFallback } from './llm-helper.js';
import { PipelineState } from './state.js';

/**
 * Stage 06 — Lite-mode research. Pulls a structured market/regulatory/infra
 * snapshot from the LLM (using its training-data knowledge). M4 will replace
 * this with the real AutoResearchClaw bridge.
 */
const ResearchOut = z.object({
  marketSnapshot: z.string(),
  competitors: z.array(z.string()).default([]),
  regulatoryNotes: z.array(z.string()).default([]),
  infraReadiness: z.string(),
  technicalFeasibility: z.string(),
  flags: z.array(z.string()).default([]),
});
type ResearchOut = z.infer<typeof ResearchOut>;

const SYSTEM = `You produce a fast lite-mode research brief for a product idea.

Return ONLY JSON:
{
  "marketSnapshot": "1-paragraph TAM/SAM signal + saturation",
  "competitors": ["name1", "name2"],
  "regulatoryNotes": ["COPPA / GDPR / HIPAA / PCI / Section 508 callouts that apply"],
  "infraReadiness": "are required APIs/models/services available today?",
  "technicalFeasibility": "solo-builder feasibility verdict",
  "flags": ["red flags that should block shipping"]
}`;

export const stage_06_research: Stage<PipelineState, PipelineState> = {
  name: '06-research',
  version: '0.2.0',
  inputSchema: PipelineState,
  outputSchema: PipelineState,
  cacheable: true,
  async run(state) {
    const top = state.classification?.candidates[0];
    const userMsg = `Idea: ${state.intent?.jobToBeDone ?? state.prompt}
Demographic: ${top?.demographic ?? 'unknown'}/${top?.niche ?? 'unknown'}

Produce the lite-mode research brief now.`;
    const out = await llmOrFallback<ResearchOut>(
      {
        stage: '06-research' as never,
        promptVersion: 'v1',
        system: SYSTEM,
        user: userMsg,
        schema: ResearchOut,
        temperature: 0.2,
        maxTokens: 1500,
      },
      () => ({
        marketSnapshot: 'lite-mode skipped — no LLM provider; assume mid-saturation niche.',
        competitors: [],
        regulatoryNotes: [],
        infraReadiness: 'unknown without research',
        technicalFeasibility: 'plausible for a solo builder',
        flags: [],
      }),
    );
    return { ...state, researchFindings: out };
  },
};
