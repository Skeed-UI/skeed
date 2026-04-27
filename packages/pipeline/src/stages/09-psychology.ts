import type { Stage } from '@skeed/contracts';
import { findRepoData } from '@skeed/asset-logo-svg';
import { loadDemographics } from '@skeed/demographics-loader';
import { PipelineState } from './state.js';

let _cache: Awaited<ReturnType<typeof loadDemographics>> | undefined;
async function loadOnce() {
  if (_cache) return _cache;
  const dataRoot = findRepoData();
  _cache = await loadDemographics({ dataRoot });
  return _cache;
}

/**
 * Stage 09 — Psychology lookup. Reads `data/demographics/<demo>/psychology/<niche>.json`
 * via the loader. Falls back to a synthesized profile if no exact match found.
 */
export const stage_09_psychology: Stage<PipelineState, PipelineState> = {
  name: '09-psychology',
  version: '0.2.0',
  inputSchema: PipelineState,
  outputSchema: PipelineState,
  cacheable: true,
  async run(state) {
    const top = state.classification?.candidates[0];
    if (!top) return state;
    try {
      const loaded = await loadOnce();
      const demo = loaded.demographics.get(top.demographic);
      if (demo) {
        // Try exact niche match, then any niche from this demographic, then synthesize.
        const exact = demo.psychology.get(top.niche);
        if (exact) return { ...state, psychology: exact };
        const first = [...demo.psychology.values()][0];
        if (first) return { ...state, psychology: { ...first, niche: top.niche } };
      }
    } catch (err) {
      process.stderr.write(`[skeed] psychology lookup failed; synthesizing. ${err instanceof Error ? err.message : String(err)}\n`);
    }
    return { ...state, psychology: synthesize(top.demographic, top.niche) };
  },
};

function synthesize(demographic: string, niche: string): PipelineState['psychology'] {
  const isKid = demographic === 'kids';
  const isGov = demographic === 'gov';
  const isHealth = demographic === 'health';
  return {
    demographic: demographic as never,
    niche,
    schemaVersion: 1,
    cognitiveLoadTarget: isKid ? 'low' : isGov ? 'medium' : 'medium',
    trustCuesNeeded: isKid
      ? ['mascot', 'soft_rounding', 'parental_controls']
      : isGov
        ? ['institutional_seal', 'flat_borders', 'audit_trail']
        : isHealth
          ? ['professional_credentials', 'privacy_indicators', 'verified_check']
          : ['testimonial', 'verified_check'],
    motivationPattern: isKid ? 'mastery' : 'intrinsic',
    formality: isGov ? 5 : isKid ? 1 : 3,
    noveltyTolerance: isKid ? 5 : 3,
    accessibilityFloor: isKid || isGov || isHealth ? 'AAA' : 'AA',
    forbiddenPatterns: isKid ? ['dark_pattern', 'urgency_timer', 'autoplay_av'] : [],
    research: { sources: [], notes: 'synthesized — no profile in data/demographics/<demo>/psychology/' },
  };
}
