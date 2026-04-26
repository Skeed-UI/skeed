import { z } from 'zod';
import { DemographicId } from './demographic.js';
import { PainPoint } from './psychology.js';

export const ResearchScope = z.enum(['market', 'demographic', 'regulatory', 'infra', 'tech']);
export type ResearchScope = z.infer<typeof ResearchScope>;

export const ResearchBrief = z.object({
  idea: z.string(),
  demographic: DemographicId,
  niche: z.string(),
  painPoints: z.array(PainPoint),
  scope: z.array(ResearchScope).min(1),
  budgetTokens: z.number().int().positive().optional(),
  timeoutMs: z.number().int().positive().optional(),
});
export type ResearchBrief = z.infer<typeof ResearchBrief>;

const Competitor = z.object({
  name: z.string(),
  url: z.string().optional(),
  positioning: z.string(),
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
});

const RegulatoryItem = z.object({
  jurisdiction: z.string(),
  regulation: z.string(),
  applicability: z.enum(['hard', 'soft', 'speculative']),
  summary: z.string(),
});

const InfraItem = z.object({
  capability: z.string(),
  available: z.boolean(),
  candidates: z.array(z.string()).default([]),
  notes: z.string().default(''),
});

export const ResearchFindings = z.object({
  schemaVersion: z.literal(1),
  brief: ResearchBrief,
  source: z.enum(['autoresearchclaw', 'lite']),
  durationMs: z.number().int().nonnegative(),
  market: z
    .object({
      tamSignal: z.string(),
      saturation: z.enum(['low', 'medium', 'high', 'unknown']),
      trends: z.array(z.string()).default([]),
      competitors: z.array(Competitor).default([]),
    })
    .optional(),
  demographic: z
    .object({
      validatedPainPoints: z.array(PainPoint).default([]),
      personas: z.array(z.string()).default([]),
      willingnessToPay: z.string().optional(),
      channels: z.array(z.string()).default([]),
    })
    .optional(),
  regulatory: z
    .object({
      items: z.array(RegulatoryItem).default([]),
      overallBurden: z.enum(['low', 'medium', 'high', 'blocker']),
    })
    .optional(),
  infra: z
    .object({
      items: z.array(InfraItem).default([]),
      readiness: z.enum(['ready', 'partial', 'not-ready']),
    })
    .optional(),
  tech: z
    .object({
      buildComplexity: z.enum(['weekend', 'weeks', 'months', 'years']),
      ossBuildingBlocks: z.array(z.string()).default([]),
      risks: z.array(z.string()).default([]),
    })
    .optional(),
  citations: z.array(z.object({ url: z.string(), title: z.string() })).default([]),
  warnings: z.array(z.string()).default([]),
});
export type ResearchFindings = z.infer<typeof ResearchFindings>;

export interface ResearchEngine {
  readonly id: string;
  run(brief: ResearchBrief, signal?: AbortSignal): Promise<ResearchFindings>;
}
