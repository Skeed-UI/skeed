import type { DemographicId, Stage } from '@skeed/contracts';
import { z } from 'zod';
import { llmOrFallback } from './llm-helper.js';
import { PipelineState } from './state.js';

const DEMOGRAPHIC_IDS = [
  'kids', 'teens', 'working_class', 'education', 'religious', 'mental_wellness',
  'health', 'legal', 'erp', 'sales_crm', 'hightech', 'social', 'monitoring',
  'classic', 'fintech', 'ai_apps', 'marketplace', 'listings', 'gov', 'military',
  'productivity', 'special_occasion',
] as const satisfies readonly DemographicId[];

const Candidate = z.object({
  demographic: z.enum(DEMOGRAPHIC_IDS),
  niche: z.string(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
});
const ClassifyOut = z.object({
  candidates: z.array(Candidate).min(1).max(3),
  needsClarification: z.boolean(),
});

const SYSTEM = `You classify product ideas into one of these demographics:
${DEMOGRAPHIC_IDS.join(', ')}

Return ONLY JSON:
{
  "candidates": [
    { "demographic": "<id>", "niche": "<one-word niche>", "confidence": 0.0-1.0, "reasoning": "..." }
  ],
  "needsClarification": false
}

Rules:
- Up to 3 candidates ranked by confidence.
- needsClarification = true only when top confidence < 0.75 OR gap to second < 0.20.
- Only use demographic ids from the list above.`;

/** Stage 02 — Demographic & Niche Classification. */
export const stage_02_classify: Stage<PipelineState, PipelineState> = {
  name: '02-classify',
  version: '0.2.0',
  inputSchema: PipelineState,
  outputSchema: PipelineState,
  cacheable: true,
  async run(state) {
    const result = await llmOrFallback(
      {
        stage: '02-classify',
        promptVersion: 'v1',
        system: SYSTEM,
        user: `Idea: """${state.intent?.jobToBeDone ?? state.prompt}"""\n\nClassify now.`,
        schema: ClassifyOut,
        temperature: 0.1,
      },
      () => {
        const guess = heuristic(state.prompt);
        return {
          candidates: [{ demographic: guess.demographic, niche: guess.niche, confidence: 0.65, reasoning: 'heuristic fallback (no LLM provider)' }],
          needsClarification: false,
        };
      },
    );
    return {
      ...state,
      classification: { ...result, questions: [] },
    };
  },
};

function heuristic(prompt: string): { demographic: DemographicId; niche: string } {
  const p = prompt.toLowerCase();
  if (/wedding/.test(p)) return { demographic: 'special_occasion', niche: 'wedding' };
  if (/birthday|bday/.test(p)) return { demographic: 'special_occasion', niche: 'birthday' };
  if (/webinar/.test(p)) return { demographic: 'special_occasion', niche: 'webinar' };
  if (/anniversary/.test(p)) return { demographic: 'special_occasion', niche: 'anniversary' };
  if (/(dinner\s+(night|party)|launch\s+party|baby\s+shower|graduation\s+party|gala|reunion|housewarming|engagement\s+party|game\s+night|rsvp)/.test(p)) {
    return { demographic: 'special_occasion', niche: 'gathering' };
  }
  if (/kid|child|school/.test(p)) return { demographic: 'kids', niche: 'learning' };
  if (/teen/.test(p)) return { demographic: 'teens', niche: 'social' };
  if (/finance|bank|money|invest|trad|crypto/.test(p)) return { demographic: 'fintech', niche: 'consumer' };
  if (/health|clinic|patient|medical/.test(p)) return { demographic: 'health', niche: 'general' };
  if (/gov|public|civic/.test(p)) return { demographic: 'gov', niche: 'general' };
  if (/legal|law|attorney/.test(p)) return { demographic: 'legal', niche: 'general' };
  if (/sales|crm|lead/.test(p)) return { demographic: 'sales_crm', niche: 'general' };
  if (/marketplace|sell|buyer/.test(p)) return { demographic: 'marketplace', niche: 'general' };
  if (/listing|directory/.test(p)) return { demographic: 'listings', niche: 'general' };
  if (/wellness|meditat|therapy|mental/.test(p)) return { demographic: 'mental_wellness', niche: 'general' };
  if (/ai|chatbot|llm|gpt|agent/.test(p)) return { demographic: 'ai_apps', niche: 'general' };
  if (/erp|enterprise|inventory/.test(p)) return { demographic: 'erp', niche: 'general' };
  if (/military|defense|tactical/.test(p)) return { demographic: 'military', niche: 'general' };
  if (/social|community|network/.test(p)) return { demographic: 'social', niche: 'general' };
  if (/monitor|observ|metrics|dashboard/.test(p)) return { demographic: 'monitoring', niche: 'general' };
  if (/religion|church|faith/.test(p)) return { demographic: 'religious', niche: 'general' };
  if (/education|teach|learn|course/.test(p)) return { demographic: 'education', niche: 'general' };
  return { demographic: 'productivity', niche: 'general' };
}
