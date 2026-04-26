import { z } from 'zod';
import { DemographicId } from './demographic.js';
import { LayoutNode } from './layout-dsl.js';
import { PainPoint, PsychologyProfile } from './psychology.js';
import { IdeaScore } from './score-rubric.js';

export const Intent = z.object({
  jobToBeDone: z.string(),
  primaryUserHypothesis: z.string().nullable(),
  frequency: z.enum(['realtime', 'daily', 'weekly', 'on-demand']).nullable(),
  dataInputs: z.array(z.string()),
  keyOutputs: z.array(z.string()),
  successSignals: z.array(z.string()),
  mentionedBrandHints: z.object({
    color: z.string().optional(),
    voice: z.array(z.string()).default([]),
  }),
  explicitConstraints: z.array(z.string()),
});
export type Intent = z.infer<typeof Intent>;

export const ClarificationOption = z.object({
  value: z.string(),
  label: z.string(),
  isDefault: z.boolean(),
  mapsToAxis: z.string(),
});

export const ClarificationQuestion = z.object({
  id: z.string(),
  templateKey: z.string(),
  prompt: z.string(),
  options: z.array(ClarificationOption).min(2).max(4),
});
export type ClarificationQuestion = z.infer<typeof ClarificationQuestion>;

export const DemographicCandidate = z.object({
  demographic: DemographicId,
  niche: z.string(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
});
export type DemographicCandidate = z.infer<typeof DemographicCandidate>;

export const ClassificationResult = z.object({
  candidates: z.array(DemographicCandidate).min(1).max(3),
  needsClarification: z.boolean(),
  questions: z.array(ClarificationQuestion).default([]),
});
export type ClassificationResult = z.infer<typeof ClassificationResult>;

export const DesignToken = z.object({
  name: z.string(),
  value: z.string(),
  role: z.string(),
  contrastsWith: z.array(z.string()).default([]),
});

export const DesignSystem = z.object({
  schemaVersion: z.literal(1),
  demographic: DemographicId,
  niche: z.string(),
  tokens: z.array(DesignToken),
  palette: z.object({
    primary: z.string(),
    neutral: z.string(),
    accent: z.string().optional(),
    semantic: z.record(z.string(), z.string()),
  }),
  type: z.object({
    stack: z.array(z.string()),
    scale: z.array(z.number()),
    lineHeight: z.number(),
  }),
  spacing: z.array(z.number()),
  radius: z.array(z.number()),
  density: z.enum(['compact', 'comfortable', 'spacious']),
  motion: z.object({
    duration: z.record(z.string(), z.number()),
    easing: z.record(z.string(), z.string()),
  }),
  iconography: z.object({
    packId: z.string(),
    weight: z.number(),
  }),
  voice: z.object({
    tone: z.array(z.string()),
    samples: z.record(z.string(), z.string()),
  }),
});
export type DesignSystem = z.infer<typeof DesignSystem>;

export const BrandAttributes = z.object({
  primaryHue: z.number().min(0).max(360),
  secondaryHue: z.number().min(0).max(360).optional(),
  moodKeywords: z.array(z.string()),
  visualMetaphors: z.array(z.string()),
  wordmarkStyle: z.string(),
  symbolArchetype: z.string(),
});
export type BrandAttributes = z.infer<typeof BrandAttributes>;

export const LogoCandidate = z.object({
  id: z.string(),
  svg: z.string(),
  archetype: z.string(),
  layout: z.enum(['stacked', 'horizontal', 'badge', 'monogram', 'mark-only', 'wordmark-only']),
  variants: z.object({
    favicon32: z.string(),
    favicon180: z.string(),
    monochrome: z.string(),
  }),
  altText: z.string(),
});
export type LogoCandidate = z.infer<typeof LogoCandidate>;

export const PageSpec = z.object({
  id: z.string(),
  route: z.string(),
  purpose: z.string(),
  slots: z.array(
    z.object({
      role: z.string(),
      intent: z.string(),
      candidateIds: z.array(z.string()).default([]),
      chosenId: z.string().nullable(),
    }),
  ),
});
export type PageSpec = z.infer<typeof PageSpec>;

export const SiteMap = z.object({
  pages: z.array(PageSpec),
  nav: z.object({
    pattern: z.enum(['tab', 'sidebar', 'bottom', 'top']),
    items: z.array(
      z.object({
        pageId: z.string(),
        label: z.string(),
        icon: z.string().optional(),
      }),
    ),
  }),
  dataModel: z.array(
    z.object({
      entity: z.string(),
      fields: z.array(z.object({ name: z.string(), type: z.string() })),
    }),
  ),
});
export type SiteMap = z.infer<typeof SiteMap>;

export const UserStory = z.object({
  id: z.string(),
  persona: z.string(),
  asA: z.string(),
  iWantTo: z.string(),
  soThat: z.string(),
  priority: z.enum(['P0', 'P1', 'P2']),
  acceptanceCriteria: z.array(z.string()),
});
export type UserStory = z.infer<typeof UserStory>;

export const LandingCandidate = z.object({
  id: z.string(),
  archetype: z.enum(['hero-led', 'story-led', 'conversion-focused']),
  layout: LayoutNode,
  preview: z.string(),
});
export type LandingCandidate = z.infer<typeof LandingCandidate>;

export const ScaffoldFile = z.object({
  path: z.string(),
  contents: z.string(),
  encoding: z.enum(['utf8', 'base64']),
  overwrite: z.boolean(),
});
export type ScaffoldFile = z.infer<typeof ScaffoldFile>;

export const Scaffold = z.object({
  manifestVersion: z.string(),
  files: z.array(ScaffoldFile),
  postInstall: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
});
export type Scaffold = z.infer<typeof Scaffold>;

export const PipelineRun = z.object({
  runId: z.string(),
  prompt: z.string(),
  registryVersion: z.string(),
  intent: Intent.optional(),
  classification: ClassificationResult.optional(),
  painPoints: z.array(PainPoint).optional(),
  scoreL1: IdeaScore.optional(),
  scoreL2: IdeaScore.optional(),
  psychology: PsychologyProfile.optional(),
  brand: BrandAttributes.optional(),
  logoChosen: LogoCandidate.optional(),
  designSystem: DesignSystem.optional(),
  userStories: z.array(UserStory).optional(),
  landingChosen: LandingCandidate.optional(),
  siteMap: SiteMap.optional(),
  scaffold: Scaffold.optional(),
});
export type PipelineRun = z.infer<typeof PipelineRun>;
