import { z } from 'zod';
import { Category, DemographicId, Density, Framework, WcagLevel } from './demographic.js';
import { PsychologySignals } from './psychology.js';

export const AssetSlotType = z.enum([
  'logo',
  'hero_illustration',
  'content_photo',
  'decorative',
  'icon',
  'avatar',
  'wordmark',
  'background',
]);
export type AssetSlotType = z.infer<typeof AssetSlotType>;

export const AssetSlot = z.object({
  role: z.string(),
  type: AssetSlotType,
  required: z.boolean().default(true),
  fallbackHint: z.string().optional(),
});

export const Variant = z.object({
  id: z.string(),
  label: z.string(),
  props: z.record(z.string(), z.unknown()).default({}),
  preview: z.object({
    thumb: z.string(),
    story: z.string().optional(),
  }),
});

export const Accessibility = z.object({
  wcagLevel: WcagLevel,
  ageAppropriate: z.object({
    min: z.number().int().min(0),
    max: z.number().int().min(0),
  }),
  cognitiveLoad: z.enum(['minimal', 'low', 'medium', 'high']),
  reducedMotionSafe: z.boolean(),
  screenReaderTested: z.boolean(),
});
export type Accessibility = z.infer<typeof Accessibility>;

export const License = z.enum(['MIT', 'Apache-2.0', 'CC-BY-4.0', 'CC0-1.0', 'skeed-commercial']);
export type License = z.infer<typeof License>;

export const Attribution = z.object({
  source: z.enum(['shadcn', '21st', 'magicui', 'aceternity', 'open-doodles', 'undraw', 'original']),
  url: z.string().url().optional(),
  author: z.string().optional(),
});

export const ComponentSource = z.object({
  framework: Framework,
  path: z.string(),
});

export const ComponentDemographicWeight = z.object({
  id: DemographicId,
  weight: z.number().min(0).max(1),
});

export const ComponentQualityTier = z.enum(['flagship', 'generated', 'legacy']);
export type ComponentQualityTier = z.infer<typeof ComponentQualityTier>;

export const PrimitiveStackItem = z.object({
  library: z.string(),
  primitive: z.string(),
  purpose: z.string().optional(),
});

export const InteractionContract = z.object({
  keyboard: z.array(z.string()).default([]),
  pointer: z.array(z.string()).default([]),
  focus: z.array(z.string()).default([]),
  screenReader: z.array(z.string()).default([]),
});

export const MotionContract = z.object({
  tone: z.enum(['calm', 'precise', 'premium', 'playful', 'clinical', 'enterprise']),
  cssFirst: z.boolean().default(true),
  reducedMotion: z.string(),
  continuous: z.boolean().default(false),
});

export const ContentSlot = z.object({
  name: z.string(),
  type: z.enum(['text', 'richText', 'image', 'icon', 'stat', 'action', 'collection']),
  required: z.boolean().default(true),
  guidance: z.string().optional(),
});

export const PerformanceBudget = z.object({
  clientJsKb: z.number().min(0).default(0),
  animationRuntime: z.enum(['none', 'css', 'motion']).default('css'),
  serverComponentSafe: z.boolean().default(true),
});

export const AgentUsage = z.object({
  whenToUse: z.array(z.string()).default([]),
  whenNotToUse: z.array(z.string()).default([]),
  installNotes: z.array(z.string()).default([]),
  propExamples: z.record(z.string(), z.unknown()).default({}),
});

/**
 * Canonical metadata for a single Skeed component.
 *
 * One file = one component. Lives at:
 *   data/components/<demographic>/<archetype>/<density>/<variant>/manifest.skeed.json
 *
 * The TSX source lives in a sibling `component.skeed.tsx`.
 */
export const ComponentManifest = z.object({
  id: z.string().regex(/^[a-z_]+\/[a-z0-9-]+\/[a-z0-9-]+(\/[a-z0-9-]+)?$/, {
    message: 'id must match <demographic>/<archetype>/<density>/<variant> in lowercase-kebab',
  }),
  name: z.string(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  schemaVersion: z.literal(1),
  category: Category,
  archetypeId: z.string(),
  demographics: z.array(ComponentDemographicWeight).min(1),
  density: Density,
  tags: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  aiIntentPhrases: z.array(z.string()).min(1, {
    message: 'at least one ai_intent_phrase is required for retrieval',
  }),
  exampleIntents: z.array(z.string()).default([]),
  antiPatterns: z.array(z.string()).default([]),
  psychologySignals: PsychologySignals,
  accessibility: Accessibility,
  variants: z.array(Variant).default([]),
  dependencies: z.array(z.string()).default([]),
  registryDependencies: z.array(z.string()).default([]),
  frameworks: z.array(Framework).min(1),
  tokensUsed: z.array(z.string()).default([]),
  assetSlots: z.array(AssetSlot).default([]),
  conversionPsychology: z.array(z.string()).default([]),
  license: License,
  attribution: Attribution.optional(),
  source: z.array(ComponentSource).min(1),
  preview: z.object({
    thumb: z.string(),
    storybookUrl: z.string().optional(),
  }),
  qualityTier: ComponentQualityTier.default('generated'),
  primitiveStack: z.array(PrimitiveStackItem).default([]),
  interactionContract: InteractionContract.default({
    keyboard: [],
    pointer: [],
    focus: [],
    screenReader: [],
  }),
  motionContract: MotionContract.default({
    tone: 'precise',
    cssFirst: true,
    reducedMotion: 'Disable non-essential transitions and continuous effects.',
    continuous: false,
  }),
  contentSlots: z.array(ContentSlot).default([]),
  performanceBudget: PerformanceBudget.default({
    clientJsKb: 0,
    animationRuntime: 'css',
    serverComponentSafe: true,
  }),
  agentUsage: AgentUsage.default({
    whenToUse: [],
    whenNotToUse: [],
    installNotes: [],
    propExamples: {},
  }),
});
export type ComponentManifest = z.infer<typeof ComponentManifest>;
