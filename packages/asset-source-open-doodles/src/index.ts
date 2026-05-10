import type { AssetRequest, AssetResult, AssetSource } from '@skeed/contracts/asset-source';

export class OpenDoodlesAssetSource implements AssetSource {
  readonly id = 'open-doodles';

  match(req: AssetRequest): { score: number; reason: string } {
    if (req.slotType === 'logo' || req.slotType === 'wordmark' || req.slotType === 'avatar') {
      return { score: 0.05, reason: 'open doodles is not suited to logos or avatars' };
    }
    if (req.slotType === 'hero_illustration') {
      return { score: 0.74, reason: 'deterministic people-centric doodle illustration' };
    }
    if (req.slotType === 'decorative' || req.slotType === 'background') {
      return { score: 0.5, reason: 'deterministic doodle decoration' };
    }
    return { score: 0.18, reason: 'limited fit for this slot' };
  }

  async fetch(req: AssetRequest): Promise<AssetResult> {
    const width = req.size?.width ?? 1200;
    const height = req.size?.height ?? 600;
    const color = req.brandColor ?? '#4F46E5';
    const title = titleFor(req, 'Doodle illustration');
    const svg = renderDoodle({ width, height, color, title, seed: hash(req.intent + req.niche) });

    return {
      bytes: new TextEncoder().encode(svg),
      mime: 'image/svg+xml',
      width,
      height,
      altText: title,
      license: 'CC0-1.0 inspired deterministic artwork',
      attribution: { source: 'open-doodles', author: 'Skeed programmatic renderer' },
      costCents: 0,
      cacheKey: `${this.id}:${req.slotType}:${hash(JSON.stringify(req))}`,
    };
  }

  estimateCost(_req: AssetRequest): number {
    return 0;
  }
}

function renderDoodle(input: {
  width: number;
  height: number;
  color: string;
  title: string;
  seed: number;
}): string {
  const { width, height, color, title, seed } = input;
  const cx = width / 2;
  const cy = height / 2;
  const unit = Math.min(width, height);
  const wobble = (seed % 37) - 18;
  const skin = ['#FFD7BA', '#F1C27D', '#C68642', '#8D5524'][seed % 4] ?? '#F1C27D';
  const bg = tint(color, 0.12);
  const stroke = Math.max(4, unit / 100);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${escape(title)}"><title>${escape(title)}</title><rect width="${width}" height="${height}" rx="${unit / 20}" fill="${bg}"/><path d="M ${cx - unit * 0.42} ${cy + unit * 0.2} C ${cx - unit * 0.22} ${cy - unit * 0.34}, ${cx + unit * 0.28} ${cy - unit * 0.28}, ${cx + unit * 0.44} ${cy + unit * 0.18}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" opacity=".55"/><circle cx="${cx - unit * 0.12 + wobble}" cy="${cy - unit * 0.12}" r="${unit * 0.13}" fill="${skin}" stroke="#111827" stroke-width="${stroke * 0.7}"/><path d="M ${cx - unit * 0.24 + wobble} ${cy - unit * 0.17} Q ${cx - unit * 0.12 + wobble} ${cy - unit * 0.31}, ${cx + unit * 0.03 + wobble} ${cy - unit * 0.17}" fill="${color}" opacity=".82"/><path d="M ${cx - unit * 0.3} ${cy + unit * 0.28} Q ${cx - unit * 0.08} ${cy + unit * 0.02}, ${cx + unit * 0.18} ${cy + unit * 0.28}" fill="${color}" opacity=".88"/><path d="M ${cx - unit * 0.34} ${cy + unit * 0.05} L ${cx - unit * 0.52} ${cy - unit * 0.06} M ${cx + unit * 0.12} ${cy + unit * 0.08} L ${cx + unit * 0.36} ${cy - unit * 0.07}" stroke="#111827" stroke-width="${stroke}" stroke-linecap="round"/><rect x="${cx + unit * 0.18}" y="${cy - unit * 0.28}" width="${unit * 0.34}" height="${unit * 0.25}" rx="${unit * 0.035}" fill="#FFFFFF" stroke="#111827" stroke-width="${stroke * 0.7}"/><path d="M ${cx + unit * 0.23} ${cy - unit * 0.2} H ${cx + unit * 0.45} M ${cx + unit * 0.23} ${cy - unit * 0.12} H ${cx + unit * 0.38}" stroke="${color}" stroke-width="${stroke * 0.6}" stroke-linecap="round"/><circle cx="${cx - unit * 0.16 + wobble}" cy="${cy - unit * 0.12}" r="${stroke * 0.8}" fill="#111827"/><circle cx="${cx - unit * 0.07 + wobble}" cy="${cy - unit * 0.12}" r="${stroke * 0.8}" fill="#111827"/><path d="M ${cx - unit * 0.16 + wobble} ${cy - unit * 0.03} Q ${cx - unit * 0.1 + wobble} ${cy + unit * 0.01}, ${cx - unit * 0.04 + wobble} ${cy - unit * 0.03}" fill="none" stroke="#111827" stroke-width="${stroke * 0.55}" stroke-linecap="round"/></svg>`;
}

function titleFor(req: AssetRequest, prefix: string): string {
  const topic = req.niche ? `${req.intent} for ${req.niche.replace(/[-_]/g, ' ')}` : req.intent;
  return `${prefix}: ${topic.trim().replace(/\s+/g, ' ')}`;
}

function hash(value: string | undefined): number {
  let out = 2166136261;
  for (const ch of value ?? '') {
    out ^= ch.charCodeAt(0);
    out = Math.imul(out, 16777619);
  }
  return Math.abs(out);
}

function tint(hex: string, opacity: number): string {
  const safe = /^#[0-9a-f]{6}$/i.test(hex) ? hex : '#4F46E5';
  const r = Number.parseInt(safe.slice(1, 3), 16);
  const g = Number.parseInt(safe.slice(3, 5), 16);
  const b = Number.parseInt(safe.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function escape(s: string): string {
  return s.replace(/[<>&'"`]/g, (c) => `&#${c.charCodeAt(0)};`);
}
