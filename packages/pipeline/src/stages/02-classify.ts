import type { DemographicId, Stage } from '@skeed/contracts';
import { z } from 'zod';
import { llmOrFallback } from './llm-helper.js';
import { PipelineState } from './state.js';

const DEMOGRAPHIC_IDS = [
  'kids',
  'teens',
  'working_class',
  'education',
  'religious',
  'mental_wellness',
  'health',
  'legal',
  'erp',
  'sales_crm',
  'hightech',
  'social',
  'monitoring',
  'classic',
  'fintech',
  'ai_apps',
  'marketplace',
  'listings',
  'gov',
  'military',
  'productivity',
  'special_occasion',
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

Return ONLY JSON. Generate FRESH, SPECIFIC values - do NOT echo placeholder text:
{
  "candidates": [
    { "demographic": "<MUST be one of the IDs listed above>", "niche": "<specific niche name>", "confidence": 0.0-1.0, "reasoning": "<why this demographic fits>" }
  ],
  "needsClarification": <true if low confidence, else false>
}

Rules:
- Generate SPECIFIC niche names (e.g., "fitness_tracker" not "<specific niche name>")
- Up to 3 candidates ranked by confidence.
- needsClarification = true only when top confidence < 0.75 OR gap to second < 0.20.
- demographic MUST be one of the IDs from the list above (copy exact ID).`;

/** Stage 02 — Demographic & Niche Classification. */
export const stage_02_classify: Stage<PipelineState, PipelineState> = {
  name: '02-classify',
  version: '0.2.0',
  inputSchema: PipelineState,
  outputSchema: PipelineState,
  cacheable: true,
  async run(state) {
    if (state.classification?.candidates.length) {
      return state;
    }

    const result = await llmOrFallback(
      {
        stage: '02-classify',
        promptVersion: 'v1',
        system: SYSTEM,
        user: `Idea: """${state.intent?.jobToBeDone ?? state.prompt}"""\n\nClassify now.`,
        schema: ClassifyOut,
        temperature: 0.1,
        validate: (value) => validateClassification(value, state.prompt),
      },
      () => {
        const guess = heuristic(state.prompt);
        return {
          candidates: [
            {
              demographic: guess.demographic,
              niche: guess.niche,
              confidence: guess.confidence,
              reasoning: 'heuristic fallback (no LLM provider)',
            },
          ],
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

function heuristic(prompt: string): {
  demographic: DemographicId;
  niche: string;
  confidence: number;
} {
  const p = prompt.toLowerCase();
  if (/wedding/.test(p))
    return { demographic: 'special_occasion', niche: 'wedding', confidence: 0.9 };
  if (/birthday|bday/.test(p))
    return { demographic: 'special_occasion', niche: 'birthday', confidence: 0.9 };
  if (/webinar/.test(p))
    return { demographic: 'special_occasion', niche: 'webinar', confidence: 0.86 };
  if (/anniversary/.test(p))
    return { demographic: 'special_occasion', niche: 'anniversary', confidence: 0.9 };
  if (
    /(dinner\s+(night|party)|launch\s+party|baby\s+shower|graduation\s+party|gala|reunion|housewarming|engagement\s+party|game\s+night|rsvp)/.test(
      p,
    )
  ) {
    return { demographic: 'special_occasion', niche: 'gathering', confidence: 0.84 };
  }
  if (
    /(fitness|runner|running|workout|exercise|training plan|marathon|steps|sleep|nutrition)/.test(p)
  ) {
    return { demographic: 'health', niche: 'wellness_tracking', confidence: 0.88 };
  }
  if (/kid|child|school/.test(p))
    return { demographic: 'kids', niche: 'learning', confidence: 0.82 };
  if (/teen/.test(p)) return { demographic: 'teens', niche: 'social', confidence: 0.82 };
  if (/finance|bank|money|invest|trad|crypto/.test(p))
    return { demographic: 'fintech', niche: 'consumer', confidence: 0.84 };
  if (/health|clinic|patient|medical/.test(p))
    return { demographic: 'health', niche: 'general', confidence: 0.84 };
  if (/gov|public|civic/.test(p)) return { demographic: 'gov', niche: 'general', confidence: 0.82 };
  if (/legal|law|attorney/.test(p))
    return { demographic: 'legal', niche: 'general', confidence: 0.84 };
  if (/sales|crm|lead/.test(p))
    return { demographic: 'sales_crm', niche: 'general', confidence: 0.82 };
  if (/marketplace|sell|buyer/.test(p))
    return { demographic: 'marketplace', niche: 'general', confidence: 0.82 };
  if (/listing|directory/.test(p))
    return { demographic: 'listings', niche: 'general', confidence: 0.82 };
  if (/wellness|meditat|therapy|mental/.test(p))
    return { demographic: 'mental_wellness', niche: 'general', confidence: 0.84 };
  if (/\bai\b|chatbot|\bllm\b|\bgpt\b|\bagent\b/.test(p))
    return { demographic: 'ai_apps', niche: 'general', confidence: 0.82 };
  if (/erp|enterprise|inventory/.test(p))
    return { demographic: 'erp', niche: 'general', confidence: 0.82 };
  if (/military|defense|tactical/.test(p))
    return { demographic: 'military', niche: 'general', confidence: 0.84 };
  if (/social|community|network/.test(p))
    return { demographic: 'social', niche: 'general', confidence: 0.82 };
  if (/monitor|observ|metrics|dashboard/.test(p))
    return { demographic: 'monitoring', niche: 'general', confidence: 0.82 };
  if (/religion|church|faith/.test(p))
    return { demographic: 'religious', niche: 'general', confidence: 0.82 };
  if (/education|teach|learn|course/.test(p))
    return { demographic: 'education', niche: 'general', confidence: 0.82 };
  if (/focus|standup|remote\s+work|work\s+from\s+home|todo|task|productiv/.test(p)) {
    return { demographic: 'productivity', niche: 'general', confidence: 0.82 };
  }
  return { demographic: 'productivity', niche: 'general', confidence: 0.65 };
}

function validateClassification(value: z.infer<typeof ClassifyOut>, prompt: string): string[] {
  const issues: string[] = [];
  const top = value.candidates[0];
  if (!top) issues.push('missing top candidate');
  for (const candidate of value.candidates) {
    if (/<[^>]+>/.test(candidate.niche) || /specific niche/i.test(candidate.niche)) {
      issues.push('candidate niche is placeholder-like');
    }
    if (candidate.confidence < 0.2 || candidate.confidence > 1) {
      issues.push('candidate confidence is out of expected range');
    }
  }
  if (
    value.candidates.length > 1 &&
    value.candidates[0]!.confidence < value.candidates[1]!.confidence
  ) {
    issues.push('candidates are not ranked by confidence');
  }
  if (top) {
    const evidence = demographicEvidence(prompt);
    if (evidence.length > 0 && !evidence.includes(top.demographic)) {
      issues.push(
        `top demographic "${top.demographic}" contradicts prompt evidence (${evidence.join(',')})`,
      );
    }
  }
  return issues;
}

function demographicEvidence(prompt: string): readonly DemographicId[] {
  const p = prompt.toLowerCase();
  const matches = new Set<DemographicId>();
  if (/(wedding|birthday|anniversary|webinar|gala|reunion|baby shower|rsvp)/.test(p))
    matches.add('special_occasion');
  if (/\bkid|child|toddler|preschool|elementary|grade school\b/.test(p)) matches.add('kids');
  if (/\bteen|teenager|highschool|high school\b/.test(p)) matches.add('teens');
  if (/(bank|finance|invest|crypto|trading|payment)/.test(p)) matches.add('fintech');
  if (
    /(clinic|patient|medical|health|therapy|hipaa|wellness|fitness|runner|running|workout|exercise|marathon|training plan|steps|sleep|nutrition)/.test(
      p,
    )
  ) {
    matches.add('health');
  }
  if (/(govern|civic|public sector|municipal)/.test(p)) matches.add('gov');
  if (/(legal|attorney|law\b|compliance officer)/.test(p)) matches.add('legal');
  if (/(crm|sales pipeline|lead gen|outbound)/.test(p)) matches.add('sales_crm');
  if (/(marketplace|buyers|sellers)/.test(p)) matches.add('marketplace');
  if (/(directory|listings|catalog)/.test(p)) matches.add('listings');
  if (/(meditat|mental health|mindful|anxiety|therap)/.test(p)) matches.add('mental_wellness');
  if (/(\bai\b|chatbot|llm|gpt|agent)/.test(p)) matches.add('ai_apps');
  if (/(erp|inventory|warehouse|supply chain)/.test(p)) matches.add('erp');
  if (/(military|tactical|defense|special forces)/.test(p)) matches.add('military');
  if (/(\bsocial\b|community|forum|messaging)/.test(p)) matches.add('social');
  if (/(monitor|observability|metrics|telemetry|dashboard)/.test(p)) matches.add('monitoring');
  if (/(religion|church|faith|prayer|worship)/.test(p)) matches.add('religious');
  if (/(course|teach|tutor|learn|education|school)/.test(p)) matches.add('education');
  if (/(focus|productiv|todo|task|standup|remote work|work from home)/.test(p))
    matches.add('productivity');
  return Array.from(matches);
}
