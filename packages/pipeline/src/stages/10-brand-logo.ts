import type { Stage } from '@skeed/contracts';
import { PipelineState } from './state.js';

/** Stage 10 — Brand attrs + SVG logo. M1: hardcoded one logo candidate. */
export const stage_10_brand_logo: Stage<PipelineState, PipelineState> = {
  name: '10-brand-logo',
  version: '0.1.0',
  inputSchema: PipelineState,
  outputSchema: PipelineState,
  cacheable: true,
  async run(state) {
    const top = state.classification?.candidates[0];
    const demographic = top?.demographic ?? 'productivity';
    const palette = palettes[demographic] ?? palettes.productivity!;
    const projectName = state.intent?.jobToBeDone?.replace(/^Build:\s*/, '').slice(0, 24) ?? 'Skeed App';

    const brand = {
      primaryHue: palette.hue,
      moodKeywords:
        demographic === 'kids'
          ? ['playful', 'safe', 'bright']
          : demographic === 'gov'
            ? ['trustworthy', 'plain', 'calm']
            : ['confident', 'modern', 'clear'],
      visualMetaphors: demographic === 'kids' ? ['balloon', 'star'] : ['arrow', 'circle'],
      wordmarkStyle: demographic === 'kids' ? 'rounded-chunky' : 'geometric-sans',
      symbolArchetype: demographic === 'kids' ? 'mascot' : 'monogram',
    };

    const svg = renderLogoSvg(projectName, palette);
    const logo = {
      id: 'logo-1',
      svg,
      archetype: brand.symbolArchetype,
      layout: 'horizontal' as const,
      variants: {
        favicon32: svg,
        favicon180: svg,
        monochrome: svg.replace(palette.fill, '#000000'),
      },
      altText: `${projectName} logo`,
    };

    return { ...state, brand, logoChosen: logo };
  },
};

const palettes: Record<string, { hue: number; fill: string; bg: string }> = {
  kids: { hue: 12, fill: '#FF6B35', bg: '#FFF7ED' },
  fintech: { hue: 220, fill: '#1D4ED8', bg: '#EFF6FF' },
  gov: { hue: 215, fill: '#1E3A8A', bg: '#F8FAFC' },
  productivity: { hue: 248, fill: '#4F46E5', bg: '#EEF2FF' },
  health: { hue: 178, fill: '#0D9488', bg: '#F0FDFA' },
};

function renderLogoSvg(name: string, p: { fill: string; bg: string }): string {
  const initial = (name.trim()[0] ?? 'S').toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="${name} logo"><rect width="64" height="64" rx="16" fill="${p.fill}"/><text x="32" y="42" text-anchor="middle" font-family="ui-sans-serif,system-ui" font-size="34" font-weight="800" fill="${p.bg}">${initial}</text></svg>`;
}
