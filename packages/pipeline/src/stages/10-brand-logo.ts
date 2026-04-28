import { composeLogoCandidates } from '@skeed/asset-logo-svg';
import type { Stage } from '@skeed/contracts';
import { z } from 'zod';
import { llmOrFallback } from './llm-helper.js';
import { PipelineState } from './state.js';

const BrandOut = z.object({
  primaryHue: z.number().min(0).max(360),
  secondaryHue: z.number().min(0).max(360).optional(),
  moodKeywords: z.array(z.string()).min(1).max(8),
  visualMetaphors: z.array(z.string()).min(1).max(6),
  wordmarkStyle: z.string(),
  symbolArchetype: z.string(),
});

const SYSTEM = `You design BrandAttributes for a product. Use the demographic + niche + psychology to pick coherent visual attributes.

Return ONLY JSON:
{
  "primaryHue": 0-360 (HSL hue, integer),
  "secondaryHue": 0-360 (optional accent),
  "moodKeywords": ["3-6 short words capturing the brand feeling"],
  "visualMetaphors": ["1-4 concrete visual ideas (e.g. balloon, compass)"],
  "wordmarkStyle": "one phrase, e.g. 'rounded-chunky' or 'geometric-sans'",
  "symbolArchetype": "one phrase, e.g. 'mascot', 'monogram', 'mark'"
}`;

/** Stage 10 — Brand attributes (LLM) → 4 SVG logo candidates (composer). */
export const stage_10_brand_logo: Stage<PipelineState, PipelineState> = {
  name: '10-brand-logo',
  version: '0.2.0',
  inputSchema: PipelineState,
  outputSchema: PipelineState,
  cacheable: true,
  async run(state) {
    const top = state.classification?.candidates[0];
    const psy = state.psychology;
    const demographic = top?.demographic ?? 'productivity';
    const projectName =
      state.intent?.jobToBeDone?.replace(/^Build:\s*/, '').slice(0, 40) ?? 'Skeed App';

    const brand = await llmOrFallback(
      {
        stage: '10-brand-logo',
        promptVersion: 'v1',
        system: SYSTEM,
        user: `Project: ${projectName}
Demographic: ${demographic}/${top?.niche ?? 'general'}
Psychology: formality=${psy?.formality ?? 3}, motivation=${psy?.motivationPattern ?? 'intrinsic'}, motion=playful?${demographic === 'kids'}
Pain points: ${(state.painPoints ?? [])
          .slice(0, 2)
          .map((p) => p.description)
          .join(' | ')}

Design brand attributes now.`,
        schema: BrandOut,
        temperature: 0.5,
      },
      () => fallbackBrand(demographic),
    );

    const candidates = await composeLogoCandidates({
      projectName,
      demographicId: demographic,
      brand,
      count: 4,
    });

    return {
      ...state,
      brand,
      logoChosen: candidates[0]!,
      ...({ logoCandidates: candidates } as { logoCandidates: typeof candidates }),
    };
  },
};

function fallbackBrand(demographic: string): z.infer<typeof BrandOut> {
  const hues: Record<string, number> = {
    kids: 12,
    fintech: 220,
    gov: 215,
    productivity: 248,
    health: 178,
    education: 35,
    mental_wellness: 280,
  };
  return {
    primaryHue: hues[demographic] ?? 248,
    moodKeywords: demographic === 'kids' ? ['playful', 'safe'] : ['confident', 'modern'],
    visualMetaphors: demographic === 'kids' ? ['balloon', 'star'] : ['arrow', 'circle'],
    wordmarkStyle: demographic === 'kids' ? 'rounded-chunky' : 'geometric-sans',
    symbolArchetype: demographic === 'kids' ? 'mascot' : 'monogram',
  };
}
