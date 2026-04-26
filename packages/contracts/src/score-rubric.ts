import { z } from 'zod';

export const RubricAxis = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  weight: z.number().min(0).max(1),
});

export const ScoreRubric = z.object({
  id: z.enum(['l1', 'l2']),
  version: z.string().regex(/^v\d+$/),
  schemaVersion: z.literal(1),
  threshold: z.number().min(0).max(10),
  axes: z.array(RubricAxis).min(1),
});
export type ScoreRubric = z.infer<typeof ScoreRubric>;

export const AxisScore = z.object({
  axisId: z.string(),
  score: z.number().min(0).max(10),
  reasoning: z.string(),
});

export const IdeaScore = z.object({
  rubricId: z.enum(['l1', 'l2']),
  rubricVersion: z.string(),
  axes: z.array(AxisScore),
  composite: z.number().min(0).max(10),
  passes: z.boolean(),
  recommendations: z.array(z.string()).default([]),
});
export type IdeaScore = z.infer<typeof IdeaScore>;
