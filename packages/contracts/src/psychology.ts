import { z } from 'zod';
import { DemographicId, WcagLevel } from './demographic.js';

export const TrustCue = z.enum([
  'institutional_seal',
  'soft_rounding',
  'monospaced_numerics',
  'mascot',
  'muted_palette',
  'verified_check',
  'audit_trail',
  'flat_borders',
  'compliance_badge',
  'testimonial',
  'expert_byline',
]);
export type TrustCue = z.infer<typeof TrustCue>;

export const PsychologySignals = z.object({
  colorTemp: z.enum(['cold', 'cool', 'neutral', 'warm', 'hot']),
  density: z.enum(['compact', 'cozy', 'comfy']),
  formality: z.number().int().min(0).max(4),
  motionIntensity: z.enum(['none', 'subtle', 'playful', 'dramatic']),
  contrast: z.enum(['low', 'medium', 'high', 'max']),
  playfulness: z.number().int().min(0).max(4),
  trustCues: z.array(TrustCue).default([]),
});
export type PsychologySignals = z.infer<typeof PsychologySignals>;

/**
 * Result of Stage 3 (Persona & Psychology Derivation).
 * Deterministic lookup against `data/demographics/<demo>/psychology/<niche>.json`.
 */
export const PsychologyProfile = z.object({
  demographic: DemographicId,
  niche: z.string(),
  schemaVersion: z.literal(1),
  cognitiveLoadTarget: z.enum(['minimal', 'low', 'medium', 'high', 'dense']),
  trustCuesNeeded: z.array(TrustCue),
  motivationPattern: z.enum(['intrinsic', 'extrinsic', 'social', 'fear', 'mastery']),
  formality: z.number().int().min(1).max(5),
  noveltyTolerance: z.number().int().min(1).max(5),
  accessibilityFloor: z.union([WcagLevel, z.literal('AAA-motor')]),
  forbiddenPatterns: z.array(z.string()),
  research: z.object({
    sources: z.array(z.string()).default([]),
    notes: z.string().default(''),
  }),
});
export type PsychologyProfile = z.infer<typeof PsychologyProfile>;

export const PainPoint = z.object({
  id: z.string(),
  description: z.string(),
  severity: z.number().int().min(1).max(5),
  frequency: z.number().int().min(1).max(5),
  evidence: z.array(z.string()).default([]),
});
export type PainPoint = z.infer<typeof PainPoint>;
