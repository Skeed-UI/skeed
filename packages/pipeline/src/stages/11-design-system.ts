import type { Stage } from '@skeed/contracts';
import { PipelineState } from './state.js';

/** Stage 11 — Design System. M1: hardcoded preset per demographic. */
export const stage_11_design_system: Stage<PipelineState, PipelineState> = {
  name: '11-design-system',
  version: '0.1.0',
  inputSchema: PipelineState,
  outputSchema: PipelineState,
  cacheable: true,
  async run(state) {
    const top = state.classification?.candidates[0];
    if (!top) return state;
    const demographic = top.demographic;
    const ds = designSystems[demographic] ?? designSystems.productivity!;
    return {
      ...state,
      designSystem: {
        schemaVersion: 1,
        demographic,
        niche: top.niche,
        ...ds,
      },
    };
  },
};

type PartialDS = Omit<NonNullable<PipelineState['designSystem']>, 'demographic' | 'niche' | 'schemaVersion'>;
const designSystems: Record<string, PartialDS> = {
  kids: {
    tokens: [
      { name: 'color-brand', value: '#FF6B35', role: 'brand', contrastsWith: ['#FFFFFF'] },
      { name: 'color-bg', value: '#FFF7ED', role: 'surface', contrastsWith: [] },
      { name: 'color-fg', value: '#1A1A1A', role: 'on-surface', contrastsWith: ['#FFF7ED'] },
    ],
    palette: {
      primary: '#FF6B35',
      neutral: '#1A1A1A',
      accent: '#06AED5',
      semantic: { success: '#34D399', danger: '#F87171', warning: '#FBBF24' },
    },
    type: { stack: ['Fredoka', 'Nunito', 'system-ui'], scale: [12, 14, 16, 20, 28, 40], lineHeight: 1.5 },
    spacing: [4, 8, 12, 16, 24, 32, 48],
    radius: [4, 8, 16, 24],
    density: 'comfortable' as const,
    motion: {
      duration: { fast: 180, base: 280, slow: 420 },
      easing: { standard: 'cubic-bezier(.34,1.56,.64,1)', emphasized: 'cubic-bezier(.2,.8,.2,1)' },
    },
    iconography: { packId: 'lucide-rounded', weight: 2 },
    voice: {
      tone: ['friendly', 'encouraging', 'simple'],
      samples: { cta: 'Let’s go!', empty: 'Nothing here yet — try adding something fun.' },
    },
  },
  productivity: {
    tokens: [
      { name: 'color-brand', value: '#4F46E5', role: 'brand', contrastsWith: ['#FFFFFF'] },
      { name: 'color-bg', value: '#FFFFFF', role: 'surface', contrastsWith: [] },
      { name: 'color-fg', value: '#0F172A', role: 'on-surface', contrastsWith: ['#FFFFFF'] },
    ],
    palette: {
      primary: '#4F46E5',
      neutral: '#0F172A',
      accent: '#22D3EE',
      semantic: { success: '#10B981', danger: '#EF4444', warning: '#F59E0B' },
    },
    type: { stack: ['Inter', 'system-ui'], scale: [12, 14, 16, 18, 24, 32], lineHeight: 1.5 },
    spacing: [4, 8, 12, 16, 24, 32, 48],
    radius: [4, 6, 8, 12],
    density: 'compact' as const,
    motion: {
      duration: { fast: 120, base: 200, slow: 320 },
      easing: { standard: 'cubic-bezier(.4,0,.2,1)', emphasized: 'cubic-bezier(.2,.8,.2,1)' },
    },
    iconography: { packId: 'lucide', weight: 1.75 },
    voice: { tone: ['direct', 'professional'], samples: { cta: 'Get started', empty: 'No items yet.' } },
  },
  fintech: {
    tokens: [
      { name: 'color-brand', value: '#1D4ED8', role: 'brand', contrastsWith: ['#FFFFFF'] },
      { name: 'color-bg', value: '#FFFFFF', role: 'surface', contrastsWith: [] },
      { name: 'color-fg', value: '#0B1220', role: 'on-surface', contrastsWith: ['#FFFFFF'] },
    ],
    palette: {
      primary: '#1D4ED8',
      neutral: '#0B1220',
      semantic: { success: '#16A34A', danger: '#DC2626', warning: '#D97706' },
    },
    type: {
      stack: ['Inter', 'IBM Plex Sans', 'system-ui'],
      scale: [12, 13, 14, 16, 20, 28],
      lineHeight: 1.45,
    },
    spacing: [4, 8, 12, 16, 24, 32],
    radius: [2, 4, 6, 8],
    density: 'compact' as const,
    motion: {
      duration: { fast: 100, base: 180, slow: 280 },
      easing: { standard: 'cubic-bezier(.4,0,.2,1)', emphasized: 'cubic-bezier(.2,.8,.2,1)' },
    },
    iconography: { packId: 'lucide', weight: 1.5 },
    voice: { tone: ['precise', 'trustworthy'], samples: { cta: 'Continue', empty: 'No transactions yet.' } },
  },
  gov: {
    tokens: [
      { name: 'color-brand', value: '#1E3A8A', role: 'brand', contrastsWith: ['#FFFFFF'] },
      { name: 'color-bg', value: '#FFFFFF', role: 'surface', contrastsWith: [] },
      { name: 'color-fg', value: '#111827', role: 'on-surface', contrastsWith: ['#FFFFFF'] },
    ],
    palette: {
      primary: '#1E3A8A',
      neutral: '#111827',
      semantic: { success: '#15803D', danger: '#B91C1C', warning: '#A16207' },
    },
    type: {
      stack: ['Source Sans Pro', 'Public Sans', 'system-ui'],
      scale: [14, 16, 18, 22, 28, 36],
      lineHeight: 1.55,
    },
    spacing: [4, 8, 16, 24, 32, 48],
    radius: [0, 2, 4],
    density: 'comfortable' as const,
    motion: { duration: { fast: 0, base: 0, slow: 0 }, easing: { standard: 'linear', emphasized: 'linear' } },
    iconography: { packId: 'uswds', weight: 1.5 },
    voice: {
      tone: ['plain-language', 'official'],
      samples: { cta: 'Continue', empty: 'No records found.' },
    },
  },
  health: {
    tokens: [
      { name: 'color-brand', value: '#0D9488', role: 'brand', contrastsWith: ['#FFFFFF'] },
      { name: 'color-bg', value: '#F0FDFA', role: 'surface', contrastsWith: [] },
      { name: 'color-fg', value: '#0F172A', role: 'on-surface', contrastsWith: ['#FFFFFF'] },
    ],
    palette: {
      primary: '#0D9488',
      neutral: '#0F172A',
      semantic: { success: '#16A34A', danger: '#DC2626', warning: '#CA8A04' },
    },
    type: { stack: ['Inter', 'system-ui'], scale: [14, 16, 18, 22, 28], lineHeight: 1.55 },
    spacing: [4, 8, 12, 16, 24, 32],
    radius: [4, 8, 12],
    density: 'comfortable' as const,
    motion: {
      duration: { fast: 120, base: 200, slow: 320 },
      easing: { standard: 'cubic-bezier(.4,0,.2,1)', emphasized: 'cubic-bezier(.2,.8,.2,1)' },
    },
    iconography: { packId: 'lucide', weight: 1.75 },
    voice: { tone: ['calm', 'clear'], samples: { cta: 'Continue', empty: 'No appointments scheduled.' } },
  },
};
