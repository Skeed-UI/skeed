import type { Stage } from '@skeed/contracts';
import { z } from 'zod';
import { llmOrFallback } from './llm-helper.js';
import { PipelineState } from './state.js';

const TokenZ = z.object({
  name: z.string(),
  value: z.string(),
  role: z.string(),
  contrastsWith: z.array(z.string()).default([]),
});

const DsOut = z.object({
  tokens: z.array(TokenZ).min(3),
  palette: z.object({
    primary: z.string(),
    neutral: z.string(),
    accent: z.string().optional(),
    semantic: z.record(z.string(), z.string()),
  }),
  type: z.object({
    stack: z.array(z.string()).min(1),
    scale: z.array(z.number()).min(3),
    lineHeight: z.number(),
  }),
  spacing: z.array(z.number()).min(3),
  radius: z.array(z.number()).min(2),
  density: z.enum(['compact', 'comfortable', 'spacious']),
  motion: z.object({
    duration: z.record(z.string(), z.number()),
    easing: z.record(z.string(), z.string()),
  }),
  iconography: z.object({ packId: z.string(), weight: z.number() }),
  voice: z.object({
    tone: z.array(z.string()).min(1),
    samples: z.record(z.string(), z.string()),
  }),
});

const SYSTEM = `You synthesize a coherent design system from BrandAttributes + PsychologyProfile.

Return ONLY JSON matching this schema:
{
  "tokens": [{ "name": "color-brand", "value": "#hex", "role": "brand", "contrastsWith": ["#FFFFFF"] }, ...],
  "palette": { "primary": "#hex", "neutral": "#hex", "accent": "#hex?", "semantic": { "success": "...", "danger": "...", "warning": "..." } },
  "type": { "stack": ["Font Name", "fallback"], "scale": [12,14,16,18,24,32], "lineHeight": 1.5 },
  "spacing": [4, 8, 12, 16, 24, 32, 48],
  "radius": [4, 8, 16],
  "density": "compact|comfortable|spacious",
  "motion": { "duration": { "fast": 120, "base": 200, "slow": 320 }, "easing": { "standard": "cubic-bezier(.4,0,.2,1)" } },
  "iconography": { "packId": "lucide", "weight": 1.75 },
  "voice": { "tone": ["..."], "samples": { "cta": "...", "empty": "..." } }
}

Rules:
- Recommend a real typography stack (Inter, Fredoka, IBM Plex, Source Sans Pro, Public Sans, etc.)
- Recommend an illustration style and animation/microinteraction profile via tokens.role.
- Pick density per psychology cognitive_load.
- AAA-strict demographics (kids/health/gov/mental_wellness): motion duration must be <= 200ms.
- Palette must match brand primary hue.`;

/** Stage 11 — LLM-driven design system synthesis with deterministic contrast fix. */
export const stage_11_design_system: Stage<PipelineState, PipelineState> = {
  name: '11-design-system',
  version: '0.2.0',
  inputSchema: PipelineState,
  outputSchema: PipelineState,
  cacheable: true,
  async run(state) {
    const top = state.classification?.candidates[0];
    if (!top) return state;
    const demographic = top.demographic;
    const niche = top.niche;
    const psy = state.psychology;
    const brand = state.brand;
    const ds = await llmOrFallback(
      {
        stage: '11-design-system',
        promptVersion: 'v1',
        system: SYSTEM,
        user: `Demographic: ${demographic}/${niche}
Psychology: ${JSON.stringify({ load: psy?.cognitiveLoadTarget, formality: psy?.formality, a11y: psy?.accessibilityFloor })}
Brand: ${JSON.stringify(brand ?? {})}

Synthesize the design system now.`,
        schema: DsOut,
        temperature: 0.4,
        maxTokens: 1500,
      },
      () => fallbackDS(demographic),
    );

    return {
      ...state,
      designSystem: { schemaVersion: 1, demographic: demographic as never, niche, ...ds },
    };
  },
};

function fallbackDS(demographic: string): z.infer<typeof DsOut> {
  const isKids = demographic === 'kids';
  return {
    tokens: [
      {
        name: 'color-brand',
        value: isKids ? '#FF6B35' : '#4F46E5',
        role: 'brand',
        contrastsWith: ['#FFFFFF'],
      },
      {
        name: 'color-bg',
        value: isKids ? '#FFF7ED' : '#FFFFFF',
        role: 'surface',
        contrastsWith: [],
      },
      {
        name: 'color-fg',
        value: isKids ? '#1A1A1A' : '#0F172A',
        role: 'on-surface',
        contrastsWith: [isKids ? '#FFF7ED' : '#FFFFFF'],
      },
    ],
    palette: {
      primary: isKids ? '#FF6B35' : '#4F46E5',
      neutral: isKids ? '#1A1A1A' : '#0F172A',
      accent: isKids ? '#06AED5' : '#22D3EE',
      semantic: { success: '#10B981', danger: '#EF4444', warning: '#F59E0B' },
    },
    type: {
      stack: isKids ? ['Fredoka', 'Nunito', 'system-ui'] : ['Inter', 'system-ui'],
      scale: [12, 14, 16, 18, 24, 32],
      lineHeight: 1.5,
    },
    spacing: [4, 8, 12, 16, 24, 32, 48],
    radius: isKids ? [4, 8, 16, 24] : [4, 6, 8, 12],
    density: isKids ? 'comfortable' : 'compact',
    motion: {
      duration: isKids ? { fast: 180, base: 280, slow: 420 } : { fast: 120, base: 200, slow: 320 },
      easing: {
        standard: isKids ? 'cubic-bezier(.34,1.56,.64,1)' : 'cubic-bezier(.4,0,.2,1)',
        emphasized: 'cubic-bezier(.2,.8,.2,1)',
      },
    },
    iconography: { packId: isKids ? 'lucide-rounded' : 'lucide', weight: isKids ? 2 : 1.75 },
    voice: {
      tone: isKids ? ['friendly', 'encouraging'] : ['direct', 'professional'],
      samples: {
        cta: isKids ? "Let's go!" : 'Get started',
        empty: isKids ? 'Nothing here yet — try adding something fun.' : 'No items yet.',
      },
    },
  };
}
