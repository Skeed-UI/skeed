import {
  BrandAttributes,
  ClassificationResult,
  DesignSystem,
  Intent,
  LandingCandidate,
  LogoCandidate,
  PipelineRun,
  Scaffold,
  SiteMap,
  UserStory,
} from '@skeed/contracts/pipeline-types';
import { PainPoint, PsychologyProfile } from '@skeed/contracts/psychology';
import { IdeaScore } from '@skeed/contracts/score-rubric';
import { z } from 'zod';

/**
 * Threaded state object passed between every pipeline stage.
 * Each stage adds its slice and returns the same shape.
 *
 * Stages 1-16 share input=output=PipelineState. Stage 17 reads state and
 * returns Scaffold (the final emit).
 */
export const PipelineState = PipelineRun.extend({
  // Backend selector (Stage 14.5) writes here.
  backendPlan: z
    .object({
      stack: z.array(z.string()),
      envVars: z.array(
        z.object({
          name: z.string(),
          required: z.boolean(),
          example: z.string().optional(),
        }),
      ),
      npmPackages: z.array(z.string()),
      apiRoutes: z.array(z.object({ path: z.string(), template: z.string() })).default([]),
      migrations: z.array(z.string()).default([]),
    })
    .optional(),
  // Per-page composed components from Stage 15
  composedPages: z
    .array(
      z.object({
        pageId: z.string(),
        route: z.string(),
        tsx: z.string(),
      }),
    )
    .optional(),
  // Resolved asset paths from Stage 16
  resolvedAssets: z
    .array(
      z.object({
        slot: z.string(),
        kind: z.enum([
          'logo',
          'hero_illustration',
          'content_photo',
          'decorative',
          'icon',
          'avatar',
        ]),
        sourceId: z.string(),
        relativePath: z.string(),
        contents: z.string(),
        encoding: z.enum(['utf8', 'base64']),
      }),
    )
    .optional(),
}).passthrough();
export type PipelineState = z.infer<typeof PipelineState>;

export {
  Intent,
  ClassificationResult,
  PainPoint,
  IdeaScore,
  PsychologyProfile,
  BrandAttributes,
  LogoCandidate,
  DesignSystem,
  UserStory,
  LandingCandidate,
  SiteMap,
  Scaffold,
};
