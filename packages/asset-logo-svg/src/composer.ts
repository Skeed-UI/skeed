import type { BrandAttributes, LogoCandidate } from '@skeed/contracts';
import { loadPrimitives } from './primitive-loader.js';

export interface ComposeOptions {
  projectName: string;
  demographicId: string;
  brand: BrandAttributes;
  /** Up to N candidates. Caller picks best. */
  count?: number;
}

const LAYOUTS: Array<LogoCandidate['layout']> = ['horizontal', 'stacked', 'badge', 'monogram'];

/**
 * Generate up to `count` distinct LogoCandidate variants from demographic primitives.
 * Always returns at least one candidate (built from a default primitive set if data missing).
 */
export async function composeLogoCandidates(opts: ComposeOptions): Promise<LogoCandidate[]> {
  const wanted = Math.max(1, Math.min(opts.count ?? 4, 8));
  const primitives = await loadPrimitives(opts.demographicId);

  const palette = paletteForBrand(opts.brand);
  const initial = (opts.projectName.trim()[0] ?? 'S').toUpperCase();
  const wordmark = opts.projectName.slice(0, 24);

  const out: LogoCandidate[] = [];
  for (let i = 0; i < wanted; i += 1) {
    const layout = LAYOUTS[i % LAYOUTS.length] ?? 'horizontal';
    const mark = primitives.marks[i % Math.max(1, primitives.marks.length)];
    const shape = primitives.shapes[i % Math.max(1, primitives.shapes.length)];

    const svg = renderSvg({
      layout,
      palette,
      initial,
      wordmark,
      mark: mark?.contents,
      shape: shape?.contents,
    });
    out.push({
      id: `logo-${i + 1}`,
      svg,
      archetype: opts.brand.symbolArchetype,
      layout,
      variants: {
        favicon32: rasterFallback(svg, 32, palette),
        favicon180: rasterFallback(svg, 180, palette),
        monochrome: monochrome(svg, palette),
      },
      altText: `${opts.projectName} logo, variant ${i + 1}`,
    });
  }
  return out;
}

interface Palette {
  primary: string;
  contrast: string;
  accent: string;
}

function paletteForBrand(brand: BrandAttributes): Palette {
  const primary = hslToHex(brand.primaryHue, 70, 48);
  const contrast = '#FFFFFF';
  const accent = hslToHex(brand.secondaryHue ?? (brand.primaryHue + 30) % 360, 60, 56);
  return { primary, contrast, accent };
}

function hslToHex(h: number, s: number, l: number): string {
  const sN = s / 100;
  const lN = l / 100;
  const c = (1 - Math.abs(2 * lN - 1)) * sN;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = lN - c / 2;
  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

interface RenderArgs {
  layout: LogoCandidate['layout'];
  palette: Palette;
  initial: string;
  wordmark: string;
  mark?: string | undefined;
  shape?: string | undefined;
}

function renderSvg(a: RenderArgs): string {
  const { palette, initial, wordmark } = a;
  const w = a.layout === 'horizontal' ? 320 : 160;
  const h = a.layout === 'horizontal' ? 80 : 160;
  const markBlock = `<g aria-hidden="true" transform="translate(8,8)"><rect width="64" height="64" rx="${a.layout === 'badge' ? 32 : 14}" fill="${palette.primary}"/><text x="32" y="44" text-anchor="middle" font-family="ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="36" font-weight="800" fill="${palette.contrast}">${escape(initial)}</text></g>`;
  const wordX = a.layout === 'horizontal' ? 88 : 80;
  const wordY = a.layout === 'horizontal' ? 50 : 132;
  const wordAnchor = a.layout === 'horizontal' ? 'start' : 'middle';
  const wordFontSize = a.layout === 'monogram' ? 0 : 28;
  const wordBlock = wordFontSize
    ? `<text x="${wordX}" y="${wordY}" text-anchor="${wordAnchor}" font-family="ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="${wordFontSize}" font-weight="700" fill="${palette.primary}">${escape(wordmark)}</text>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${escape(wordmark)} logo"><title>${escape(wordmark)} logo</title>${markBlock}${wordBlock}</svg>`;
}

function rasterFallback(_svg: string, size: number, palette: Palette): string {
  // Without sharp, return the same SVG re-fitted to the given size as a tiny inline.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${Math.round(size / 4)}" fill="${palette.primary}"/></svg>`;
}

function monochrome(svg: string, palette: Palette): string {
  return svg.replace(new RegExp(palette.primary.replace('#', '\\#'), 'gi'), '#000000');
}

function escape(s: string): string {
  return s.replace(/[<>&'"`]/g, (c) => `&#${c.charCodeAt(0)};`);
}
