import { z } from 'zod';
import { DemographicId, Density } from './demographic.js';

const ColorRamp = z.object({
  '50': z.string(),
  '100': z.string(),
  '200': z.string(),
  '300': z.string(),
  '400': z.string(),
  '500': z.string(),
  '600': z.string(),
  '700': z.string(),
  '800': z.string(),
  '900': z.string(),
  '950': z.string().optional(),
});
export type ColorRamp = z.infer<typeof ColorRamp>;

const FontStack = z.object({
  family: z.string(),
  fallback: z.array(z.string()),
  weights: z.array(z.number()),
  features: z.array(z.string()).default([]),
});
export type FontStack = z.infer<typeof FontStack>;

const ContrastPair = z.object({
  fg: z.string(),
  bg: z.string(),
  ratio: z.number().min(1),
  passesAA: z.boolean(),
  passesAAA: z.boolean(),
});

const Palette = z.object({
  brand: ColorRamp,
  neutral: ColorRamp,
  success: ColorRamp,
  warning: ColorRamp,
  danger: ColorRamp,
  info: ColorRamp,
  contrastPairs: z.array(ContrastPair).default([]),
});

const Typography = z.object({
  display: FontStack,
  body: FontStack,
  mono: FontStack,
  numeric: FontStack,
  scale: z.array(z.number()).min(5),
});

const DensityConfig = z.object({
  padY: z.number(),
  padX: z.number(),
  gap: z.number(),
  lineHeight: z.number(),
});

const Motion = z.object({
  profile: z.enum(['none', 'subtle', 'playful', 'dramatic']),
  durations: z.record(z.string(), z.number()),
  easings: z.record(z.string(), z.string()),
});

const Iconography = z.object({
  style: z.enum(['line', 'duotone', 'glyph', '3d', 'illustrated']),
  pack: z.string(),
});

const Borders = z.object({
  width: z.number(),
  style: z.enum(['solid', 'dashed', 'double']),
  treatment: z.enum(['flat', 'soft', 'hard']),
});

const Elevation = z.object({
  shadows: z.array(z.string()),
  surfaceTreatment: z.enum(['flat', 'raised', 'glass', 'paper']),
});

/**
 * Constraints the SVG logo composer reads to filter primitives per demographic.
 * E.g. kids only allows `rounded` shapes + `chunky-sans` wordmarks.
 */
const LogoPrimitiveConstraints = z.object({
  allowedShapeKinds: z.array(z.string()),
  allowedMarkKinds: z.array(z.string()),
  allowedWordmarkStyles: z.array(z.string()),
  allowedContainerStyles: z.array(z.string()),
});

export const DemographicPreset = z.object({
  id: DemographicId,
  schemaVersion: z.literal(1),
  palette: Palette,
  typography: Typography,
  spacing: z.array(z.number()),
  radius: z.array(z.number()),
  density: z.object({
    compact: DensityConfig,
    cozy: DensityConfig,
    comfy: DensityConfig,
  }),
  motion: Motion,
  iconography: Iconography,
  borders: Borders,
  elevation: Elevation,
  illustrationStylePrompt: z.string(),
  logoPrimitiveConstraints: LogoPrimitiveConstraints,
  defaultDensity: Density,
  voice: z.object({
    tone: z.array(z.string()),
    samples: z.record(z.string(), z.string()),
  }),
});
export type DemographicPreset = z.infer<typeof DemographicPreset>;
