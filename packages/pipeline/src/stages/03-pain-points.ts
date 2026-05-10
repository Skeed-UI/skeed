import { findRepoData } from '@skeed/asset-logo-svg';
import type { Stage } from '@skeed/contracts';
import { loadDemographics } from '@skeed/demographics-loader';
import { z } from 'zod';
import { llmOrFallback } from './llm-helper.js';
import { PipelineState } from './state.js';

let _painCache: Awaited<ReturnType<typeof loadDemographics>> | undefined;
async function loadPainCache() {
  if (_painCache) return _painCache;
  const dataRoot = findRepoData();
  _painCache = await loadDemographics({ dataRoot });
  return _painCache;
}

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
        validate: (value) => validatePainPoints(value, state.prompt),
      },
      async () => ({ painPoints: await fallbackPainPointsAsync(top?.demographic, top?.niche) }),
    );
    return { ...state, painPoints: out.painPoints };
  },
};

async function fallbackPainPointsAsync(
  demographic?: string,
  niche?: string,
): Promise<z.infer<typeof PainOut>['painPoints']> {
  if (demographic) {
    try {
      const cache = await loadPainCache();
      const demo = cache.demographics.get(demographic as never);
      if (demo) {
        const exact = niche ? demo.painPoints.get(niche) : undefined;
        const file = exact ?? [...demo.painPoints.values()][0];
        if (file && file.points.length > 0) {
          return file.points.slice(0, 6).map((point, index) => ({
            id: point.id || `p${index + 1}`,
            description: point.description,
            severity: point.severity,
            frequency: point.frequency,
            evidence: point.evidence ?? [],
          }));
        }
      }
    } catch {
      /* fall through to heuristic library */
    }
  }
  return fallbackPainPoints(demographic, niche);
}

function validatePainPoints(value: z.infer<typeof PainOut>, prompt: string): string[] {
  const issues: string[] = [];
  const promptTerms = prompt.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 4);
  const ids = new Set<string>();
  for (const point of value.painPoints) {
    if (ids.has(point.id)) issues.push(`duplicate pain point id ${point.id}`);
    ids.add(point.id);
    const desc = point.description.trim();
    if (desc.length < 16) issues.push(`pain point ${point.id} description too short`);
    if (/<[^>]+>/.test(desc) || /lorem ipsum|placeholder/i.test(desc)) {
      issues.push(`pain point ${point.id} contains placeholder text`);
    }
    if (/\bextract.*pain points\b|return only json/i.test(desc)) {
      issues.push(`pain point ${point.id} echoes the system prompt`);
    }
  }
  if (promptTerms.length > 0) {
    const joined = value.painPoints.map((p) => p.description.toLowerCase()).join(' ');
    if (!promptTerms.some((term) => joined.includes(term))) {
      issues.push('pain points do not mention any term from the user prompt');
    }
  }
  return issues;
}

function fallbackPainPoints(demographic = 'productivity', niche = 'general'): z.infer<typeof PainOut>['painPoints'] {
  const library: Record<string, Array<Omit<z.infer<typeof PainOut>['painPoints'][number], 'id'>>> = {
    kids: [
      {
        description: `Children need ${niche} flows that are simple, safe, and not overstimulating.`,
        severity: 5,
        frequency: 4,
        evidence: ['heuristic: child-directed UX requires low cognitive load and guardian trust'],
      },
      {
        description: 'Parents and guardians need visible controls before they trust the experience.',
        severity: 4,
        frequency: 4,
        evidence: ['heuristic: trust and consent are launch blockers for kids products'],
      },
    ],
    health: [
      {
        description: `${niche} users need privacy-safe guidance without accidental medical promises.`,
        severity: 5,
        frequency: 4,
        evidence: ['heuristic: health workflows carry privacy and expectation risk'],
      },
      {
        description: 'Users abandon health tools when next steps are ambiguous or jargon-heavy.',
        severity: 4,
        frequency: 5,
        evidence: ['heuristic: clarity and reassurance are core health UX needs'],
      },
    ],
    fintech: [
      {
        description: `${niche} users need confidence that money-related actions are secure and reversible.`,
        severity: 5,
        frequency: 4,
        evidence: ['heuristic: financial UX depends on trust, auditability, and clear consequences'],
      },
      {
        description: 'Users struggle when fees, balances, or risk are hidden behind vague copy.',
        severity: 4,
        frequency: 5,
        evidence: ['heuristic: financial decisions require transparent information scent'],
      },
    ],
    special_occasion: [
      {
        description: `${niche} organizers need guests to understand details without repeated follow-up messages.`,
        severity: 4,
        frequency: 5,
        evidence: ['heuristic: event products win by reducing coordination churn'],
      },
      {
        description: 'Hosts need the page to feel personal, not like a generic template.',
        severity: 3,
        frequency: 4,
        evidence: ['heuristic: occasion UX depends on taste, tone, and emotional fit'],
      },
    ],
    erp: [
      {
        description: `${niche} teams lose time when operational state is split across spreadsheets and messages.`,
        severity: 5,
        frequency: 5,
        evidence: ['heuristic: ERP buyers value reduced reconciliation work'],
      },
      {
        description: 'Managers need audit trails before trusting generated workflow surfaces.',
        severity: 4,
        frequency: 4,
        evidence: ['heuristic: enterprise workflows require accountability'],
      },
    ],
    mental_wellness: [
      {
        description: `${niche} users need a calm experience that avoids shame, pressure, and overload.`,
        severity: 5,
        frequency: 4,
        evidence: ['heuristic: wellness UX should reduce emotional load'],
      },
      {
        description: 'Users need gentle re-entry after missing routines or sessions.',
        severity: 4,
        frequency: 5,
        evidence: ['heuristic: adherence tools fail when they punish lapses'],
      },
    ],
  };
  const selected = library[demographic] ?? [
    {
      description: `${niche} users need the product to solve a concrete workflow instead of feeling generic.`,
      severity: 4,
      frequency: 4,
      evidence: ['heuristic: specificity is the main fallback quality lever'],
    },
    {
      description: 'Setup friction is high; users abandon before reaching the first useful outcome.',
      severity: 3,
      frequency: 5,
      evidence: ['heuristic: time-to-value drives early activation'],
    },
  ];
  return selected.map((point, index) => ({ id: `p${index + 1}`, ...point }));
}
