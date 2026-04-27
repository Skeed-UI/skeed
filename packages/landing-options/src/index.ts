import {
  ARCHETYPES,
  type LandingArchetype,
  type SubVariant,
  applyVariant,
} from './archetypes.js';
import { type RenderContext, renderLanding } from './render.js';

export interface LandingCandidate {
  id: string;
  archetype: LandingArchetype;
  variant: SubVariant;
  tsx: string;
  preview: string;
}

export interface GenerateOptions {
  context: RenderContext;
  archetypes?: LandingArchetype[];
  includeWaitlist?: boolean;
}

/** Generate landing page candidates. Returns 3-6 candidates depending on flags. */
export function generateLandingCandidates(opts: GenerateOptions): LandingCandidate[] {
  const archetypes = opts.archetypes ?? (Object.keys(ARCHETYPES) as LandingArchetype[]);
  const variants: SubVariant[] = opts.includeWaitlist ? ['actual-landing', 'waitlist-teaser'] : ['actual-landing'];
  const out: LandingCandidate[] = [];
  for (const archId of archetypes) {
    const spec = ARCHETYPES[archId];
    for (const variant of variants) {
      const sections = applyVariant(spec, variant);
      const tsx = renderLanding(sections, opts.context);
      out.push({
        id: `${archId}--${variant}`,
        archetype: archId,
        variant,
        tsx,
        preview: spec.description,
      });
    }
  }
  return out;
}

export { ARCHETYPES, type LandingArchetype, type SubVariant, type RenderContext };
