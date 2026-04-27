import type { AssetRequest, AssetResult, AssetSource } from '@skeed/contracts';

/**
 * Programmatic placeholder source — never fails. Always last in the fallback chain.
 * Generates a brand-coloured SVG placeholder sized to the slot.
 */
export const programmaticPlaceholder: AssetSource = {
  id: 'programmatic-placeholder',
  match() {
    return { score: 0.05, reason: 'always-available fallback' };
  },
  async fetch(req: AssetRequest): Promise<AssetResult> {
    const w = req.size?.width ?? 1200;
    const h = req.size?.height ?? 600;
    const color = req.brandColor ?? '#4F46E5';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${escape(req.intent)} placeholder"><title>${escape(req.intent)}</title><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity="0.85"/><stop offset="1" stop-color="${color}" stop-opacity="0.4"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/><text x="${w / 2}" y="${h / 2}" text-anchor="middle" dominant-baseline="middle" fill="rgba(255,255,255,0.85)" font-family="ui-sans-serif,system-ui,sans-serif" font-size="${Math.max(16, Math.min(w, h) / 16)}" font-weight="700">${escape(req.intent)}</text></svg>`;
    const bytes = new TextEncoder().encode(svg);
    return {
      bytes,
      mime: 'image/svg+xml',
      width: w,
      height: h,
      altText: `Placeholder for ${req.intent}`,
      license: 'CC0',
      cacheKey: `placeholder:${req.slotType}:${req.intent}:${color}:${w}x${h}`,
    };
  },
};

function escape(s: string): string {
  return s.replace(/[<>&'"`]/g, (c) => `&#${c.charCodeAt(0)};`);
}
