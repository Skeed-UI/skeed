export type LandingArchetype = 'hero-led' | 'story-led' | 'conversion-focused' | 'event-invitation';
export type SubVariant = 'waitlist-teaser' | 'actual-landing';

export interface SectionSpec {
  role: string;
  archetypeId: string;
  bindings?: Record<string, string>;
}

export interface LandingArchetypeSpec {
  id: LandingArchetype;
  description: string;
  baseSections: SectionSpec[];
  /** Sub-variant overrides — replace specific roles with new archetypes. */
  variants: Record<SubVariant, Partial<Record<string, SectionSpec | null>>>;
}

export const ARCHETYPES: Record<LandingArchetype, LandingArchetypeSpec> = {
  'hero-led': {
    id: 'hero-led',
    description: 'Centered hero, three-up feature grid, social proof, single CTA.',
    baseSections: [
      { role: 'navbar', archetypeId: 'navbar' },
      { role: 'hero', archetypeId: 'hero' },
      { role: 'features', archetypeId: 'feature-grid' },
      { role: 'testimonial', archetypeId: 'testimonial' },
      { role: 'cta', archetypeId: 'card' },
      { role: 'footer', archetypeId: 'footer' },
    ],
    variants: {
      'waitlist-teaser': {
        features: null,
        testimonial: null,
        cta: { role: 'cta', archetypeId: 'signup-form' },
      },
      'actual-landing': {},
    },
  },
  'story-led': {
    id: 'story-led',
    description: 'Asymmetric hero, story rows alternating image/text, quote, CTA.',
    baseSections: [
      { role: 'navbar', archetypeId: 'navbar' },
      { role: 'hero', archetypeId: 'hero' },
      { role: 'story-row-1', archetypeId: 'card' },
      { role: 'story-row-2', archetypeId: 'card' },
      { role: 'testimonial', archetypeId: 'testimonial' },
      { role: 'cta', archetypeId: 'card' },
      { role: 'footer', archetypeId: 'footer' },
    ],
    variants: {
      'waitlist-teaser': {
        'story-row-2': null,
        cta: { role: 'cta', archetypeId: 'signup-form' },
      },
      'actual-landing': {},
    },
  },
  'event-invitation': {
    id: 'event-invitation',
    description:
      'Hero with event title + date, story-style details, RSVP form, photos, music toggle.',
    baseSections: [
      { role: 'event-hero', archetypeId: 'hero' },
      { role: 'event-details', archetypeId: 'feature-grid' },
      { role: 'story', archetypeId: 'card' },
      { role: 'rsvp', archetypeId: 'rsvp-form' },
      { role: 'gallery', archetypeId: 'feature-grid' },
      { role: 'footer', archetypeId: 'footer' },
    ],
    variants: {
      'waitlist-teaser': {
        gallery: null,
        story: null,
      },
      'actual-landing': {},
    },
  },
  'conversion-focused': {
    id: 'conversion-focused',
    description: 'Slim navbar, split hero with form, pain/solution, pricing, FAQ, CTA.',
    baseSections: [
      { role: 'navbar', archetypeId: 'navbar' },
      { role: 'hero', archetypeId: 'hero' },
      { role: 'pain', archetypeId: 'feature-grid' },
      { role: 'pricing', archetypeId: 'pricing-card' },
      { role: 'faq', archetypeId: 'faq' },
      { role: 'cta', archetypeId: 'card' },
      { role: 'footer', archetypeId: 'footer' },
    ],
    variants: {
      'waitlist-teaser': {
        pricing: null,
        faq: null,
        cta: { role: 'cta', archetypeId: 'signup-form' },
      },
      'actual-landing': {},
    },
  },
};

export function applyVariant(spec: LandingArchetypeSpec, variant: SubVariant): SectionSpec[] {
  const overrides = spec.variants[variant];
  return spec.baseSections
    .map((s) => {
      if (overrides[s.role] === null) return null;
      const override = overrides[s.role];
      if (override) return override;
      return s;
    })
    .filter((s): s is SectionSpec => s !== null);
}
