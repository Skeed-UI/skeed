import { z } from 'zod';

export const GuardSeverity = z.enum(['warning', 'error', 'fatal']);
export type GuardSeverity = z.infer<typeof GuardSeverity>;

export const GuardViolation = z.object({
  guardId: z.string(),
  severity: GuardSeverity,
  message: z.string(),
  location: z
    .object({
      file: z.string().optional(),
      line: z.number().int().optional(),
      componentId: z.string().optional(),
    })
    .optional(),
  fixSuggestion: z.string().optional(),
});
export type GuardViolation = z.infer<typeof GuardViolation>;

export const GuardResult = z.object({
  guardId: z.string(),
  passed: z.boolean(),
  violations: z.array(GuardViolation),
  autoFixed: z.boolean().default(false),
});
export type GuardResult = z.infer<typeof GuardResult>;

export interface Guard<TInput> {
  readonly id: string;
  readonly description: string;
  /** Whether failures of this guard block emission (`fatal`) or only warn. */
  readonly defaultSeverity: GuardSeverity;
  check(input: TInput): Promise<GuardResult>;
}
