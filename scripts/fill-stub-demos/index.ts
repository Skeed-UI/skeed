#!/usr/bin/env tsx
/**
 * One-shot helper to fill the 13 remaining stub demographics with valid
 * psychology + logo-primitive content. Idempotent — skips files that exist.
 *
 * Usage: pnpm exec tsx scripts/fill-stub-demos/index.ts
 */
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');
const dataRoot = resolve(repoRoot, 'data', 'demographics');

interface DemoFill {
  id: string;
  niche: string;
  cognitiveLoadTarget: 'minimal' | 'low' | 'medium' | 'high' | 'dense';
  motivationPattern: 'intrinsic' | 'extrinsic' | 'social' | 'fear' | 'mastery';
  formality: number;
  noveltyTolerance: number;
  accessibilityFloor: 'AA' | 'AAA' | 'AAA-motor';
  trustCues: string[];
  forbiddenPatterns: string[];
  notes: string;
  pains: Array<{ id: string; description: string; severity: number; frequency: number }>;
  /** Each entry = [filename, svg-body content (no <svg> wrapper)] */
  shapes: Array<[string, string]>;
  marks: Array<[string, string]>;
}

const SVG_OPEN = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">';
const SVG_CLOSE = '</svg>\n';
const wrap = (body: string) => `${SVG_OPEN}${body}${SVG_CLOSE}`;

const DEMOS: DemoFill[] = [
  {
    id: 'classic',
    niche: 'general',
    cognitiveLoadTarget: 'medium',
    motivationPattern: 'extrinsic',
    formality: 3,
    noveltyTolerance: 2,
    accessibilityFloor: 'AA',
    trustCues: ['testimonial', 'verified_check'],
    forbiddenPatterns: [],
    notes: 'Default fallback aesthetic. Conventional patterns; familiar metaphors.',
    pains: [
      {
        id: 'cl1',
        description: 'Generic SaaS landing pages all look the same.',
        severity: 4,
        frequency: 5,
      },
      {
        id: 'cl2',
        description: 'Hard to differentiate without going off-brand.',
        severity: 3,
        frequency: 4,
      },
    ],
    shapes: [
      [
        'rounded-square.svg',
        '<rect x="6" y="6" width="52" height="52" rx="8" fill="currentColor"/>',
      ],
      ['circle.svg', '<circle cx="32" cy="32" r="28" fill="currentColor"/>'],
    ],
    marks: [
      [
        'monogram-block.svg',
        '<rect x="6" y="6" width="52" height="52" rx="6" fill="currentColor"/><text x="32" y="44" text-anchor="middle" font-family="Inter,sans-serif" font-size="32" font-weight="800" fill="white">A</text>',
      ],
      [
        'arrow.svg',
        '<path d="M14 32 L46 32 M34 20 L46 32 L34 44" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
      ],
    ],
  },
  {
    id: 'erp',
    niche: 'inventory',
    cognitiveLoadTarget: 'high',
    motivationPattern: 'extrinsic',
    formality: 4,
    noveltyTolerance: 1,
    accessibilityFloor: 'AA',
    trustCues: ['audit_trail', 'monospaced_numerics', 'verified_check'],
    forbiddenPatterns: [],
    notes: 'Power users; data density preferred over aesthetics. Avoid playful motion.',
    pains: [
      {
        id: 'er1',
        description: 'Legacy ERP UIs require 6+ clicks for a single transaction.',
        severity: 5,
        frequency: 5,
      },
      {
        id: 'er2',
        description: 'No keyboard shortcuts in modern web ERP tools.',
        severity: 4,
        frequency: 5,
      },
    ],
    shapes: [
      [
        'grid.svg',
        '<rect x="6" y="6" width="22" height="22" fill="currentColor"/><rect x="36" y="6" width="22" height="22" fill="currentColor"/><rect x="6" y="36" width="22" height="22" fill="currentColor"/><rect x="36" y="36" width="22" height="22" fill="currentColor"/>',
      ],
      [
        'stack.svg',
        '<rect x="6" y="14" width="52" height="10" fill="currentColor"/><rect x="6" y="28" width="52" height="10" fill="currentColor"/><rect x="6" y="42" width="52" height="10" fill="currentColor"/>',
      ],
    ],
    marks: [
      [
        'cube.svg',
        '<path d="M32 6 L56 18 L56 46 L32 58 L8 46 L8 18 Z M32 6 V58 M8 18 L32 30 L56 18" fill="none" stroke="currentColor" stroke-width="3"/>',
      ],
      [
        'ledger.svg',
        '<rect x="10" y="8" width="44" height="48" rx="2" fill="none" stroke="currentColor" stroke-width="3"/><line x1="14" y1="20" x2="50" y2="20" stroke="currentColor" stroke-width="2"/><line x1="14" y1="32" x2="50" y2="32" stroke="currentColor" stroke-width="2"/><line x1="14" y1="44" x2="50" y2="44" stroke="currentColor" stroke-width="2"/>',
      ],
    ],
  },
  {
    id: 'hightech',
    niche: 'developer-tools',
    cognitiveLoadTarget: 'high',
    motivationPattern: 'mastery',
    formality: 2,
    noveltyTolerance: 4,
    accessibilityFloor: 'AA',
    trustCues: ['expert_byline', 'monospaced_numerics', 'audit_trail'],
    forbiddenPatterns: [],
    notes: 'Devs / power users. Prefer monospace, terse copy, dense docs.',
    pains: [
      {
        id: 'ht1',
        description: 'Onboarding screens condescend to technical users.',
        severity: 4,
        frequency: 5,
      },
      {
        id: 'ht2',
        description: 'Marketing pages hide the actual product behind videos.',
        severity: 4,
        frequency: 5,
      },
    ],
    shapes: [
      ['terminal.svg', '<rect x="6" y="10" width="52" height="44" rx="4" fill="currentColor"/>'],
      [
        'bracket.svg',
        '<path d="M22 12 H10 V52 H22 M42 12 H54 V52 H42" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>',
      ],
    ],
    marks: [
      [
        'caret.svg',
        '<path d="M16 24 L28 36 L16 48" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><line x1="32" y1="48" x2="48" y2="48" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>',
      ],
      [
        'slash.svg',
        '<path d="M14 50 L50 14" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>',
      ],
    ],
  },
  {
    id: 'legal',
    niche: 'general',
    cognitiveLoadTarget: 'medium',
    motivationPattern: 'fear',
    formality: 5,
    noveltyTolerance: 1,
    accessibilityFloor: 'AAA',
    trustCues: [
      'institutional_seal',
      'expert_byline',
      'compliance_badge',
      'professional_credentials',
    ],
    forbiddenPatterns: ['urgency_timer', 'dark_pattern'],
    notes: 'Legal users want gravity + transparency. Plain language. Cite sources.',
    pains: [
      {
        id: 'lg1',
        description: 'Legal-tech UIs feel either too corporate-cold or too consumer-cute.',
        severity: 4,
        frequency: 5,
      },
      {
        id: 'lg2',
        description: 'Hard to communicate billing transparently.',
        severity: 4,
        frequency: 5,
      },
    ],
    shapes: [
      [
        'shield.svg',
        '<path d="M32 4 L56 14 V32 C56 46 44 56 32 60 C20 56 8 46 8 32 V14 Z" fill="currentColor"/>',
      ],
      [
        'column.svg',
        '<rect x="14" y="10" width="36" height="6" fill="currentColor"/><rect x="18" y="20" width="6" height="32" fill="currentColor"/><rect x="40" y="20" width="6" height="32" fill="currentColor"/><rect x="10" y="54" width="44" height="6" fill="currentColor"/>',
      ],
    ],
    marks: [
      [
        'scales.svg',
        '<line x1="32" y1="10" x2="32" y2="54" stroke="currentColor" stroke-width="4"/><line x1="14" y1="20" x2="50" y2="20" stroke="currentColor" stroke-width="4"/><circle cx="14" cy="34" r="8" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="50" cy="34" r="8" fill="none" stroke="currentColor" stroke-width="3"/>',
      ],
      [
        'gavel.svg',
        '<rect x="10" y="20" width="32" height="10" rx="2" transform="rotate(-30 26 25)" fill="currentColor"/><rect x="42" y="38" width="14" height="14" rx="2" fill="currentColor"/>',
      ],
    ],
  },
  {
    id: 'listings',
    niche: 'real-estate',
    cognitiveLoadTarget: 'medium',
    motivationPattern: 'extrinsic',
    formality: 3,
    noveltyTolerance: 3,
    accessibilityFloor: 'AA',
    trustCues: ['testimonial', 'verified_check'],
    forbiddenPatterns: ['urgency_timer'],
    notes: 'Browsing-first interfaces — high-quality imagery dominates UI weight.',
    pains: [
      {
        id: 'ls1',
        description: 'Listing sites feel cluttered and noisy.',
        severity: 4,
        frequency: 5,
      },
      { id: 'ls2', description: 'Filters reset on back-navigation.', severity: 4, frequency: 5 },
    ],
    shapes: [
      [
        'frame.svg',
        '<rect x="8" y="8" width="48" height="48" fill="none" stroke="currentColor" stroke-width="6"/>',
      ],
      ['tag.svg', '<path d="M6 6 L36 6 L58 28 L36 50 L6 50 Z" fill="currentColor"/>'],
    ],
    marks: [
      [
        'pin.svg',
        '<path d="M32 6 C20 6 12 14 12 26 C12 36 32 58 32 58 C32 58 52 36 52 26 C52 14 44 6 32 6 Z" fill="currentColor"/><circle cx="32" cy="24" r="6" fill="white"/>',
      ],
      [
        'key.svg',
        '<circle cx="20" cy="32" r="10" fill="none" stroke="currentColor" stroke-width="4"/><line x1="30" y1="32" x2="56" y2="32" stroke="currentColor" stroke-width="4"/><line x1="46" y1="32" x2="46" y2="42" stroke="currentColor" stroke-width="4"/><line x1="52" y1="32" x2="52" y2="40" stroke="currentColor" stroke-width="4"/>',
      ],
    ],
  },
  {
    id: 'marketplace',
    niche: 'general',
    cognitiveLoadTarget: 'medium',
    motivationPattern: 'extrinsic',
    formality: 2,
    noveltyTolerance: 3,
    accessibilityFloor: 'AA',
    trustCues: ['testimonial', 'verified_check'],
    forbiddenPatterns: ['urgency_timer'],
    notes: 'Two-sided market UX — buyer trust + seller-tooling discoverability matter equally.',
    pains: [
      {
        id: 'mp1',
        description: 'Marketplace UIs prioritize buyers; sellers feel like second-class users.',
        severity: 4,
        frequency: 4,
      },
      {
        id: 'mp2',
        description: 'Reviews + ratings systems are gamed easily.',
        severity: 4,
        frequency: 4,
      },
    ],
    shapes: [
      [
        'cart.svg',
        '<path d="M8 12 L14 12 L20 44 L52 44" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><circle cx="24" cy="54" r="4" fill="currentColor"/><circle cx="48" cy="54" r="4" fill="currentColor"/>',
      ],
      [
        'handshake.svg',
        '<path d="M8 28 L20 16 L32 22 L44 16 L56 28 L44 44 L32 38 L20 44 Z" fill="currentColor"/>',
      ],
    ],
    marks: [
      [
        'stalls.svg',
        '<rect x="6" y="20" width="16" height="36" fill="currentColor"/><rect x="24" y="14" width="16" height="42" fill="currentColor"/><rect x="42" y="20" width="16" height="36" fill="currentColor"/>',
      ],
      [
        'checkmark-circle.svg',
        '<circle cx="32" cy="32" r="26" fill="currentColor"/><path d="M20 34 L28 42 L46 24" stroke="white" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
      ],
    ],
  },
  {
    id: 'military',
    niche: 'tactical',
    cognitiveLoadTarget: 'high',
    motivationPattern: 'mastery',
    formality: 5,
    noveltyTolerance: 1,
    accessibilityFloor: 'AAA',
    trustCues: ['institutional_seal', 'flat_borders', 'audit_trail'],
    forbiddenPatterns: ['dark_pattern'],
    notes: 'High-stakes operational UIs. Reduce cognitive overhead via standard mil-spec layouts.',
    pains: [
      {
        id: 'mi1',
        description: 'Operational tools mix mil-spec vocabulary with consumer chrome.',
        severity: 5,
        frequency: 5,
      },
      {
        id: 'mi2',
        description: 'Color cues conflict with night-vision compatibility.',
        severity: 4,
        frequency: 4,
      },
    ],
    shapes: [
      ['hexagon.svg', '<path d="M32 4 L58 18 L58 46 L32 60 L6 46 L6 18 Z" fill="currentColor"/>'],
      [
        'chevron.svg',
        '<path d="M14 14 L32 32 L50 14 L50 26 L32 44 L14 26 Z" fill="currentColor"/>',
      ],
    ],
    marks: [
      [
        'compass.svg',
        '<circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" stroke-width="4"/><path d="M32 8 L36 32 L32 56 L28 32 Z" fill="currentColor"/>',
      ],
      [
        'target.svg',
        '<circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="32" cy="32" r="16" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="32" cy="32" r="6" fill="currentColor"/>',
      ],
    ],
  },
  {
    id: 'monitoring',
    niche: 'observability',
    cognitiveLoadTarget: 'high',
    motivationPattern: 'fear',
    formality: 3,
    noveltyTolerance: 2,
    accessibilityFloor: 'AA',
    trustCues: ['monospaced_numerics', 'audit_trail', 'verified_check'],
    forbiddenPatterns: [],
    notes: 'On-call users skim dashboards under stress. Color semantics must be unmistakable.',
    pains: [
      {
        id: 'mo1',
        description: 'Alert fatigue from excessive notifications.',
        severity: 5,
        frequency: 5,
      },
      {
        id: 'mo2',
        description: 'Dashboards tell you what is broken, not why.',
        severity: 5,
        frequency: 5,
      },
    ],
    shapes: [
      [
        'chart.svg',
        '<rect x="6" y="40" width="10" height="18" fill="currentColor"/><rect x="20" y="28" width="10" height="30" fill="currentColor"/><rect x="34" y="14" width="10" height="44" fill="currentColor"/><rect x="48" y="34" width="10" height="24" fill="currentColor"/>',
      ],
      [
        'waveform.svg',
        '<path d="M4 32 L14 32 L18 14 L26 50 L32 32 L40 32 L44 14 L52 50 L60 32" fill="none" stroke="currentColor" stroke-width="4"/>',
      ],
    ],
    marks: [
      [
        'heartbeat.svg',
        '<path d="M4 32 L18 32 L22 22 L28 44 L34 14 L40 50 L46 32 L60 32" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>',
      ],
      [
        'gauge.svg',
        '<path d="M8 40 A24 24 0 0 1 56 40" fill="none" stroke="currentColor" stroke-width="6"/><line x1="32" y1="40" x2="46" y2="22" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><circle cx="32" cy="40" r="4" fill="currentColor"/>',
      ],
    ],
  },
  {
    id: 'religious',
    niche: 'congregation',
    cognitiveLoadTarget: 'low',
    motivationPattern: 'social',
    formality: 4,
    noveltyTolerance: 2,
    accessibilityFloor: 'AAA',
    trustCues: ['institutional_seal', 'soft_rounding', 'testimonial'],
    forbiddenPatterns: ['dark_pattern', 'urgency_timer'],
    notes: 'Reverent tone. Multi-generational audience. Avoid trend-chasing.',
    pains: [
      {
        id: 're1',
        description: 'Church websites look stuck in 2008 templates.',
        severity: 4,
        frequency: 5,
      },
      {
        id: 're2',
        description: 'No central hub for events + sermons + giving.',
        severity: 4,
        frequency: 4,
      },
    ],
    shapes: [
      ['arch.svg', '<path d="M12 60 V32 a20 20 0 0 1 40 0 V60 Z" fill="currentColor"/>'],
      [
        'stained-glass.svg',
        '<rect x="10" y="10" width="20" height="20" fill="currentColor" opacity="0.6"/><rect x="34" y="10" width="20" height="20" fill="currentColor"/><rect x="10" y="34" width="20" height="20" fill="currentColor"/><rect x="34" y="34" width="20" height="20" fill="currentColor" opacity="0.6"/>',
      ],
    ],
    marks: [
      [
        'dove.svg',
        '<path d="M12 36 C18 26 30 20 42 24 C50 20 56 22 56 30 C56 36 48 38 42 36 C42 42 36 50 26 50 C18 50 12 44 12 36 Z" fill="currentColor"/>',
      ],
      [
        'flame.svg',
        '<path d="M32 8 C24 20 18 28 18 38 C18 50 24 56 32 56 C40 56 46 50 46 38 C46 28 40 20 32 8 Z" fill="currentColor"/>',
      ],
    ],
  },
  {
    id: 'sales_crm',
    niche: 'general',
    cognitiveLoadTarget: 'medium',
    motivationPattern: 'extrinsic',
    formality: 3,
    noveltyTolerance: 2,
    accessibilityFloor: 'AA',
    trustCues: ['testimonial', 'monospaced_numerics', 'verified_check'],
    forbiddenPatterns: [],
    notes: 'Power users live here all day. Reduce friction; surface activity feed.',
    pains: [
      {
        id: 'sc1',
        description: 'CRM data entry takes more time than actual selling.',
        severity: 5,
        frequency: 5,
      },
      {
        id: 'sc2',
        description: 'Pipeline visibility is buried under reports.',
        severity: 4,
        frequency: 5,
      },
    ],
    shapes: [
      [
        'pipeline.svg',
        '<path d="M6 24 L20 24 L20 16 L36 32 L20 48 L20 40 L6 40 Z" fill="currentColor"/><rect x="44" y="16" width="14" height="32" rx="2" fill="currentColor"/>',
      ],
      ['funnel.svg', '<path d="M6 10 L58 10 L40 32 L40 54 L24 54 L24 32 Z" fill="currentColor"/>'],
    ],
    marks: [
      [
        'handshake.svg',
        '<path d="M8 28 L20 16 L32 22 L44 16 L56 28 L44 44 L32 38 L20 44 Z" fill="currentColor"/>',
      ],
      [
        'target.svg',
        '<circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="32" cy="32" r="14" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="32" cy="32" r="4" fill="currentColor"/>',
      ],
    ],
  },
  {
    id: 'social',
    niche: 'community',
    cognitiveLoadTarget: 'low',
    motivationPattern: 'social',
    formality: 1,
    noveltyTolerance: 5,
    accessibilityFloor: 'AA',
    trustCues: ['soft_rounding', 'testimonial'],
    forbiddenPatterns: ['urgency_timer'],
    notes: 'Engagement-first; default to fluid layouts that feel native on mobile.',
    pains: [
      {
        id: 'so1',
        description: 'Existing social platforms dictate the algorithm; no escape hatch.',
        severity: 4,
        frequency: 5,
      },
      {
        id: 'so2',
        description: 'Hard to reach a small private circle without bleed.',
        severity: 4,
        frequency: 5,
      },
    ],
    shapes: [
      [
        'blob.svg',
        '<path d="M48 16 C58 24 60 40 50 50 C42 58 24 60 14 50 C4 40 6 22 16 14 C26 6 40 8 48 16 Z" fill="currentColor"/>',
      ],
      ['bubble.svg', '<path d="M8 12 H56 V44 H30 L18 56 V44 H8 Z" fill="currentColor"/>'],
    ],
    marks: [
      [
        'heart.svg',
        '<path d="M32 56 L10 32 C2 22 12 8 22 14 L32 22 L42 14 C52 8 62 22 54 32 Z" fill="currentColor"/>',
      ],
      [
        'people.svg',
        '<circle cx="22" cy="22" r="8" fill="currentColor"/><circle cx="42" cy="22" r="8" fill="currentColor"/><path d="M10 56 C10 44 22 38 32 38 C42 38 54 44 54 56 Z" fill="currentColor"/>',
      ],
    ],
  },
  {
    id: 'teens',
    niche: 'social',
    cognitiveLoadTarget: 'low',
    motivationPattern: 'social',
    formality: 1,
    noveltyTolerance: 5,
    accessibilityFloor: 'AA',
    trustCues: ['soft_rounding', 'parental_controls'],
    forbiddenPatterns: ['dark_pattern', 'urgency_timer', 'autoplay_av'],
    notes: 'Bold motion + maximalism. Avoid corporate chrome at all costs.',
    pains: [
      {
        id: 'te1',
        description: "Apps either talk down to teens or pretend they're adults.",
        severity: 4,
        frequency: 5,
      },
      {
        id: 'te2',
        description: 'Tools forget that screen time matters.',
        severity: 4,
        frequency: 5,
      },
    ],
    shapes: [
      [
        'blob-organic.svg',
        '<path d="M52 18 C60 28 58 44 48 52 C36 60 18 58 12 46 C6 34 12 18 24 12 C36 6 46 10 52 18 Z" fill="currentColor"/>',
      ],
      [
        'squircle.svg',
        '<path d="M32 4 C50 4 60 14 60 32 C60 50 50 60 32 60 C14 60 4 50 4 32 C4 14 14 4 32 4 Z" fill="currentColor"/>',
      ],
    ],
    marks: [
      [
        'lightning.svg',
        '<path d="M28 6 L12 36 L26 36 L20 58 L46 28 L32 28 L40 6 Z" fill="currentColor"/>',
      ],
      [
        'emoji-smile.svg',
        '<circle cx="32" cy="32" r="26" fill="currentColor"/><circle cx="22" cy="26" r="3" fill="white"/><circle cx="42" cy="26" r="3" fill="white"/><path d="M20 38 C24 46 40 46 44 38" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"/>',
      ],
    ],
  },
  {
    id: 'working_class',
    niche: 'general',
    cognitiveLoadTarget: 'low',
    motivationPattern: 'extrinsic',
    formality: 2,
    noveltyTolerance: 2,
    accessibilityFloor: 'AA',
    trustCues: ['testimonial', 'soft_rounding'],
    forbiddenPatterns: ['dark_pattern'],
    notes: 'Direct copy. Mobile-first. Avoid jargon. Big tap targets.',
    pains: [
      {
        id: 'wc1',
        description: 'Most apps assume desktop or fast data.',
        severity: 4,
        frequency: 5,
      },
      { id: 'wc2', description: 'Hidden fees feel disrespectful.', severity: 5, frequency: 5 },
    ],
    shapes: [
      [
        'rounded-rect.svg',
        '<rect x="6" y="6" width="52" height="52" rx="12" fill="currentColor"/>',
      ],
      ['hammer-bg.svg', '<rect x="6" y="6" width="52" height="52" rx="6" fill="currentColor"/>'],
    ],
    marks: [
      [
        'toolbox.svg',
        '<rect x="8" y="22" width="48" height="32" rx="4" fill="currentColor"/><path d="M22 22 V14 H42 V22" fill="none" stroke="currentColor" stroke-width="4"/>',
      ],
      [
        'handshake.svg',
        '<path d="M8 28 L20 16 L32 22 L44 16 L56 28 L44 44 L32 38 L20 44 Z" fill="currentColor"/>',
      ],
    ],
  },
];

async function exists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function writeIfMissing(filePath: string, contents: string): Promise<boolean> {
  if (await exists(filePath)) return false;
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, contents, 'utf8');
  return true;
}

async function main(): Promise<void> {
  let created = 0;
  let skipped = 0;
  for (const d of DEMOS) {
    const root = resolve(dataRoot, d.id);
    // Psychology
    const psy = {
      demographic: d.id,
      niche: d.niche,
      schemaVersion: 1,
      cognitiveLoadTarget: d.cognitiveLoadTarget,
      trustCuesNeeded: d.trustCues,
      motivationPattern: d.motivationPattern,
      formality: d.formality,
      noveltyTolerance: d.noveltyTolerance,
      accessibilityFloor: d.accessibilityFloor,
      forbiddenPatterns: d.forbiddenPatterns,
      research: { sources: [], notes: d.notes },
    };
    if (
      await writeIfMissing(
        resolve(root, 'psychology', `${d.niche}.json`),
        `${JSON.stringify(psy, null, 2)}\n`,
      )
    )
      created += 1;
    else skipped += 1;

    // Pain points
    const pain = {
      demographic: d.id,
      niche: d.niche,
      schemaVersion: 1,
      points: d.pains.map((p) => ({ ...p, evidence: [] })),
    };
    if (
      await writeIfMissing(
        resolve(root, 'pain-points', `${d.niche}.json`),
        `${JSON.stringify(pain, null, 2)}\n`,
      )
    )
      created += 1;
    else skipped += 1;

    // Shapes
    for (const [name, body] of d.shapes) {
      if (await writeIfMissing(resolve(root, 'logo-primitives', 'shapes', name), wrap(body)))
        created += 1;
      else skipped += 1;
    }
    // Marks
    for (const [name, body] of d.marks) {
      if (await writeIfMissing(resolve(root, 'logo-primitives', 'marks', name), wrap(body)))
        created += 1;
      else skipped += 1;
    }
    // Wordmarks (one each)
    const wordmark = `${JSON.stringify(
      {
        id: 'modern-sans',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontWeight: 700,
        letterSpacing: '-0.01em',
        case: 'title',
        baseline: 'alphabetic',
      },
      null,
      2,
    )}\n`;
    if (
      await writeIfMissing(
        resolve(root, 'logo-primitives', 'wordmarks', 'modern-sans.json'),
        wordmark,
      )
    )
      created += 1;
    else skipped += 1;
  }
  process.stdout.write(`fill-stub-demos: created=${created} skipped=${skipped}\n`);
}

main().catch((err: unknown) => {
  process.stderr.write(
    `fill-stub-demos failed: ${err instanceof Error ? (err.stack ?? err.message) : String(err)}\n`,
  );
  process.exit(2);
});
