import type { ResearchFindings, Stage } from '@skeed/contracts';
import { BrowserUseResearchBridge, WebResearchBridge } from '@skeed/research-bridge';
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
  version: '0.3.0',
  inputSchema: PipelineState,
  outputSchema: PipelineState,
  cacheable: true,
  async run(state) {
    const top = state.classification?.candidates[0];
    if (top) {
      const brief = {
        idea: state.intent?.jobToBeDone ?? state.prompt,
        demographic: top.demographic,
        niche: top.niche,
        painPoints: state.painPoints ?? [],
        scope: ['market', 'demographic', 'regulatory', 'infra', 'tech'] as const,
        budgetTokens: 1800,
        timeoutMs: 7000,
      };
      if (process.env.BROWSER_USE_API_KEY && process.env.SKEED_DEEP_RESEARCH === '1') {
        try {
          const deep = new BrowserUseResearchBridge();
          const findings = await deep.run({ ...brief, timeoutMs: 120000, scope: [...brief.scope] });
          return { ...state, researchFindings: findings };
        } catch (err) {
          process.stderr.write(
            `[skeed] browser-use deep research failed; falling back to web bridge. ${err instanceof Error ? err.message : String(err)}\n`,
          );
        }
      }
      const bridge = new WebResearchBridge();
      try {
        const findings = await bridge.run({ ...brief, scope: [...brief.scope] });
        return { ...state, researchFindings: findings };
      } catch (err) {
        process.stderr.write(
          `[skeed] web research bridge failed; using LLM-lite research. ${err instanceof Error ? err.message : String(err)}\n`,
        );
      }
    }

    const userMsg = `Idea: ${state.intent?.jobToBeDone ?? state.prompt}
Demographic: ${top?.demographic ?? 'unknown'}/${top?.niche ?? 'unknown'}

Produce the lite-mode research brief now.`;
    const out = await llmOrFallback<ResearchOut>(
      {
        stage: '06-research',
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
    return { ...state, researchFindings: normalizeLiteResearch(state, out) };
  },
};

function normalizeLiteResearch(state: PipelineState, out: ResearchOut): ResearchFindings {
  const top = state.classification?.candidates[0];
  return {
    schemaVersion: 1,
    brief: {
      idea: state.intent?.jobToBeDone ?? state.prompt,
      demographic: top?.demographic ?? 'productivity',
      niche: top?.niche ?? 'general',
      painPoints: state.painPoints ?? [],
      scope: ['market', 'demographic', 'regulatory', 'infra', 'tech'],
    },
    source: 'lite',
    durationMs: 0,
    market: {
      tamSignal: out.marketSnapshot,
      saturation: /high|crowded|saturat/i.test(out.marketSnapshot)
        ? 'high'
        : /low|niche/i.test(out.marketSnapshot)
          ? 'low'
          : 'medium',
      trends: [],
      competitors: out.competitors.map((name) => ({
        name,
        positioning: 'LLM-lite inferred competitor',
        strengths: [],
        weaknesses: ['unverified without web bridge citation'],
      })),
    },
    regulatory: {
      items: out.regulatoryNotes.map((note) => ({
        jurisdiction: 'unknown',
        regulation: note.split(/[:/-]/)[0]?.trim() || 'regulatory note',
        applicability: 'speculative',
        summary: note,
      })),
      overallBurden: out.regulatoryNotes.length > 2 ? 'medium' : 'low',
    },
    infra: {
      items: [
        {
          capability: out.infraReadiness,
          available: !/unknown|not ready|unavailable/i.test(out.infraReadiness),
          candidates: [],
          notes: out.technicalFeasibility,
        },
      ],
      readiness: /unknown|partial/i.test(out.infraReadiness) ? 'partial' : 'ready',
    },
    tech: {
      buildComplexity: /complex|months|hard/i.test(out.technicalFeasibility) ? 'months' : 'weeks',
      ossBuildingBlocks: ['Next.js', 'React', 'Zod'],
      risks: out.flags,
    },
    citations: [],
    warnings: out.flags,
  };
}
