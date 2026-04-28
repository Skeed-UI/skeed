import { findRepoData } from '@skeed/asset-logo-svg';
import type { Stage } from '@skeed/contracts';
import { loadDemographics } from '@skeed/demographics-loader';
import { type LandingArchetype, generateLandingCandidates } from '@skeed/landing-options';
import { PipelineState } from './state.js';

let _demoCache: Awaited<ReturnType<typeof loadDemographics>> | undefined;
async function loadOnce() {
  if (_demoCache) return _demoCache;
  _demoCache = await loadDemographics({ dataRoot: findRepoData() });
  return _demoCache;
}

/**
 * Stage 13 — Landing candidates. Generates candidates per landing-options
 * package; picks demographic + niche + tone-best variant; for `special_occasion`
 * also wires taste palette + music genre + RSVP style into the render context.
 */
export const stage_13_landing_options: Stage<PipelineState, PipelineState> = {
  name: '13-landing-options',
  version: '0.3.0',
  inputSchema: PipelineState,
  outputSchema: PipelineState,
  cacheable: true,
  async run(state) {
    const top = state.classification?.candidates[0];
    const projectName =
      state.intent?.jobToBeDone?.replace(/^Build:\s*/, '').slice(0, 60) ?? 'Skeed App';
    const tagline = state.userStories?.[0]?.iWantTo ?? 'Get started in seconds';
    const ctaLabel = state.designSystem?.voice.samples.cta ?? 'Get started';
    const features = (state.userStories ?? []).slice(0, 3).map((s) => ({
      title: s.iWantTo.slice(0, 60),
      body: s.soThat.slice(0, 120),
    }));
    while (features.length < 3) {
      features.push({ title: 'Built for you', body: 'Tuned to your audience.' });
    }

    const demographic = top?.demographic ?? 'productivity';
    const niche = top?.niche ?? 'general';
    const isSpecialOccasion = demographic === 'special_occasion';
    const isWaitlistIdea = /waitlist|coming soon|notify|early access/i.test(state.prompt);

    let event: Parameters<typeof generateLandingCandidates>[0]['context']['event'] = undefined;
    if (isSpecialOccasion) {
      const loaded = await loadOnce();
      const taste = pickTaste(loaded.demographics.get('special_occasion')?.tastes, niche);
      const eventDate = pickEventDate(state.prompt);
      const eventLocation = pickEventLocation(state.prompt);
      event = {
        ...(eventDate ? { eventDate } : {}),
        ...(eventLocation ? { eventLocation } : {}),
        ...(taste
          ? {
              rsvpStyle: taste.rsvpStyle,
              tasteId: taste.id,
              tasteLabel: taste.label,
              musicGenre: taste.musicGenre,
              musicSrc: musicSrcFor(taste.musicGenre),
            }
          : {}),
      };
    }

    const archetypes: LandingArchetype[] = isSpecialOccasion
      ? ['event-invitation', 'hero-led', 'story-led']
      : ['hero-led', 'story-led', 'conversion-focused'];

    const candidates = generateLandingCandidates({
      context: { projectName, tagline, ctaLabel, features, ...(event ? { event } : {}) },
      archetypes,
      includeWaitlist: isWaitlistIdea && !isSpecialOccasion,
    });

    const preferred: LandingArchetype = isSpecialOccasion
      ? 'event-invitation'
      : preferredArchetype(demographic, isWaitlistIdea);
    const chosen = candidates.find((c) => c.archetype === preferred) ?? candidates[0]!;

    const layout = {
      id: 'landing-root',
      type: 'col' as const,
      props: { gap: 0, align: 'stretch' as const },
      children: [
        {
          id: 'page',
          type: 'slot' as const,
          componentId: `landing/${chosen.archetype}`,
          bindings: {},
        },
      ],
    };

    return {
      ...state,
      landingChosen: {
        id: chosen.id,
        archetype: chosen.archetype as never,
        layout,
        preview: chosen.preview,
      },
      ...({
        landingTsx: chosen.tsx,
        landingCandidates: candidates,
        eventTaste: event
          ? {
              tasteId: event.tasteId,
              tasteLabel: event.tasteLabel,
              musicGenre: event.musicGenre,
              rsvpStyle: event.rsvpStyle,
            }
          : undefined,
      } as { landingTsx: string; landingCandidates: typeof candidates; eventTaste?: unknown }),
    };
  },
};

function preferredArchetype(
  demographic: string,
  isWaitlistIdea: boolean,
): 'hero-led' | 'story-led' | 'conversion-focused' {
  if (isWaitlistIdea) return 'conversion-focused';
  if (demographic === 'kids' || demographic === 'mental_wellness' || demographic === 'religious')
    return 'hero-led';
  if (demographic === 'gov' || demographic === 'health' || demographic === 'legal')
    return 'story-led';
  return 'conversion-focused';
}

function pickTaste(
  tastes: Awaited<ReturnType<typeof loadDemographics>>['demographics'] extends Map<string, infer V>
    ? V extends { tastes: infer T }
      ? T
      : never
    : never,
  niche: string,
): { id: string; label: string; rsvpStyle: string; musicGenre: string } | undefined {
  if (!tastes || !('tastes' in tastes)) return undefined;
  const list = tastes.tastes;
  const defaults: Record<string, string> = {
    wedding: 'classic_premium',
    birthday: 'wild_open',
    webinar: 'moderate_solemn',
    anniversary: 'classic_premium',
    gathering: 'open_moderate',
  };
  const id = defaults[niche] ?? 'open_moderate';
  return list.find((t) => t.id === id) ?? list[0];
}

function pickEventDate(prompt: string): string | undefined {
  const m = prompt.match(
    /\b(?:on\s+)?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{1,2}(?:,\s*\d{4})?/i,
  );
  return m?.[0]?.trim();
}

function pickEventLocation(prompt: string): string | undefined {
  const m = prompt.match(/\b(?:at|in)\s+([A-Z][\w\s&-]{3,40})/);
  return m?.[1]?.trim();
}

function musicSrcFor(genre: string): string {
  // Placeholder royalty-free clip URLs (CC0 / public-domain). Apps may swap these.
  const map: Record<string, string> = {
    'soft-piano': 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3',
    'string-quartet': 'https://cdn.pixabay.com/audio/2022/03/15/audio_d75e6b7a02.mp3',
    'ambient-room-tone': 'https://cdn.pixabay.com/audio/2024/02/05/audio_72b9eb89d2.mp3',
    'indie-folk': 'https://cdn.pixabay.com/audio/2023/06/28/audio_fc63ee2da9.mp3',
    afrobeats: 'https://cdn.pixabay.com/audio/2023/04/01/audio_5ae57aa3ce.mp3',
    'house-mix': 'https://cdn.pixabay.com/audio/2023/02/13/audio_f43f56b8d8.mp3',
    'rock-classic': 'https://cdn.pixabay.com/audio/2022/10/16/audio_dabc9c0e2c.mp3',
    neoclassical: 'https://cdn.pixabay.com/audio/2022/11/22/audio_b3ec56b3ed.mp3',
    synthwave: 'https://cdn.pixabay.com/audio/2024/01/14/audio_9e2b3a7cba.mp3',
    'lofi-beats': 'https://cdn.pixabay.com/audio/2022/02/22/audio_d0c6ff1ead.mp3',
  };
  return map[genre] ?? '';
}
