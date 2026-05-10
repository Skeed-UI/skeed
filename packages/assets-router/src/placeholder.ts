import type { AssetRequest, AssetResult, AssetSource } from '@skeed/contracts';

/**
 * Programmatic fallback source. It never fails and always sits last in the
 * fallback chain, but still emits meaningful artwork and alt text.
 */
export const programmaticPlaceholder: AssetSource = {
  id: 'programmatic-placeholder',
  match() {
    return { score: 0.05, reason: 'always-available programmatic fallback' };
  },
  async fetch(req: AssetRequest): Promise<AssetResult> {
    const w = req.size?.width ?? 1200;
    const h = req.size?.height ?? 600;
    const color = req.brandColor ?? '#4F46E5';
    const title = meaningfulTitle(req);
    const svg = renderIllustration({ width: w, height: h, color, title });
    const bytes = new TextEncoder().encode(svg);

    return {
      bytes,
      mime: 'image/svg+xml',
      width: w,
      height: h,
      altText: title,
      license: 'CC0',
      cacheKey: `programmatic:${req.slotType}:${req.intent}:${color}:${w}x${h}`,
    };
  },
};

function meaningfulTitle(req: AssetRequest): string {
  const intent = req.intent.trim().replace(/\s+/g, ' ');
  const niche = req.niche ? ` for ${req.niche.replace(/[-_]/g, ' ')}` : '';
  if (req.slotType === 'hero_illustration') return `Illustration of ${intent}${niche}`;
  if (req.slotType === 'background') return `Background artwork for ${intent}${niche}`;
  if (req.slotType === 'decorative') return `Decorative artwork for ${intent}${niche}`;
  return `Visual asset for ${intent}${niche}`;
}

function renderIllustration(input: {
  width: number;
  height: number;
  color: string;
  title: string;
}): string {
  const { width: w, height: h, color, title } = input;
  const cx = w / 2;
  const cy = h / 2;
  const unit = Math.min(w, h);
  const orb = Math.round(unit * 0.24);
  const small = Math.round(unit * 0.08);
  const fontSize = Math.max(16, Math.min(w, h) / 22);
  const radius = Math.max(16, unit / 18);
  const blur = Math.max(8, unit / 48);
  const stroke = Math.max(3, unit / 120);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${escape(title)}"><title>${escape(title)}</title><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity="0.16"/><stop offset="1" stop-color="${color}" stop-opacity="0.04"/></linearGradient><radialGradient id="r" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${color}" stop-opacity="0.72"/><stop offset="1" stop-color="${color}" stop-opacity="0.08"/></radialGradient><filter id="soft"><feGaussianBlur stdDeviation="${blur}"/></filter></defs><rect width="${w}" height="${h}" rx="${radius}" fill="url(#g)"/><circle cx="${cx}" cy="${cy}" r="${orb}" fill="url(#r)" filter="url(#soft)"/><circle cx="${cx - orb * 0.9}" cy="${cy + orb * 0.15}" r="${small}" fill="${color}" opacity="0.20"/><circle cx="${cx + orb * 0.95}" cy="${cy - orb * 0.2}" r="${small * 0.75}" fill="${color}" opacity="0.28"/><path d="M ${cx - orb * 0.5} ${cy + orb * 0.15} C ${cx - orb * 0.1} ${cy - orb * 0.55}, ${cx + orb * 0.5} ${cy - orb * 0.35}, ${cx + orb * 0.62} ${cy + orb * 0.18}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" opacity="0.55"/><rect x="${cx - orb * 0.42}" y="${cy - orb * 0.24}" width="${orb * 0.84}" height="${orb * 0.54}" rx="${Math.max(10, unit / 40)}" fill="white" opacity="0.82"/><text x="${cx}" y="${cy + orb * 0.72}" text-anchor="middle" fill="rgba(15,23,42,0.68)" font-family="ui-sans-serif,system-ui,sans-serif" font-size="${fontSize}" font-weight="650">${escape(title).slice(0, 72)}</text></svg>`;
}

function escape(s: string): string {
  return s.replace(/[<>&'"`]/g, (c) => `&#${c.charCodeAt(0)};`);
}
