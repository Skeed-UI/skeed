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
        altText: z.string().optional(),
      }),
    )
    .optional(),
  // Registry components selected by Stage 15 and emitted by Stage 17.
  selectedComponents: z
    .array(
      z.object({
        id: z.string(),
        fileName: z.string(),
        exportName: z.string(),
        source: z.string(),
        tokensCss: z.string(),
        manifest: z
          .object({
            name: z.string().optional(),
            archetypeId: z.string().optional(),
            description: z.string().optional(),
            assetSlots: z
              .array(
                z.object({
                  role: z.string(),
                  type: z.string(),
                  required: z.boolean().optional(),
                }),
              )
              .optional(),
            qualityTier: z.string().optional(),
            primitiveStack: z
              .array(z.union([z.string(), z.record(z.string(), z.unknown())]))
              .optional(),
            motionContract: z.record(z.string(), z.unknown()).optional(),
            interactionContract: z.record(z.string(), z.unknown()).optional(),
            contentSlots: z
              .array(
                z.object({
                  name: z.string(),
                  type: z.string(),
                  required: z.boolean().optional(),
                }),
              )
              .optional(),
            performanceBudget: z
              .object({
                clientJsKb: z.number().optional(),
                animationRuntime: z.string().optional(),
                serverComponentSafe: z.boolean().optional(),
              })
              .optional(),
            dependencies: z.array(z.string()).optional(),
            agentUsage: z.record(z.string(), z.unknown()).optional(),
          })
          .passthrough(),
        reasons: z.array(z.string()),
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
