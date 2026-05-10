import type { AssetRequest, AssetResult, AssetSource } from '@skeed/contracts/asset-source';

export class UndrawAssetSource implements AssetSource {
  readonly id = 'undraw';

  match(req: AssetRequest): { score: number; reason: string } {
    if (req.slotType === 'hero_illustration') {
      return { score: 0.7, reason: 'deterministic SaaS-style SVG illustration' };
    }
    if (req.slotType === 'content_photo') {
      return { score: 0.28, reason: 'illustration fallback when photography is unavailable' };
    }
    if (req.slotType === 'decorative' || req.slotType === 'background') {
      return { score: 0.48, reason: 'deterministic abstract SVG scene' };
    }
    return { score: 0.12, reason: 'limited fit for this slot' };
  }

  async fetch(req: AssetRequest): Promise<AssetResult> {
    const width = req.size?.width ?? 1200;
    const height = req.size?.height ?? 600;
    const color = req.brandColor ?? '#4F46E5';
    const title = titleFor(req);
    const svg = renderUndrawLike({
      width,
      height,
      color,
      title,
      seed: hash(`${req.demographic}:${req.niche}:${req.intent}`),
    });

    return {
      bytes: new TextEncoder().encode(svg),
      mime: 'image/svg+xml',
      width,
      height,
      altText: title,
      license: 'MIT-compatible deterministic artwork',
      attribution: { source: 'undraw', author: 'Skeed programmatic renderer' },
      costCents: 0,
      cacheKey: `${this.id}:${req.slotType}:${hash(JSON.stringify(req))}`,
    };
  }

  estimateCost(_req: AssetRequest): number {
    return 0;
  }
}

function renderUndrawLike(input: {
  width: number;
  height: number;
  color: string;
  title: string;
  seed: number;
}): string {
  const { width, height, color, title, seed } = input;
  const unit = Math.min(width, height);
  const groundY = height * 0.78;
  const panelW = unit * 0.52;
  const panelH = unit * 0.34;
  const panelX = width * 0.5 - panelW * 0.12;
  const panelY = height * 0.22;
  const accent = seed % 2 === 0 ? '#14B8A6' : '#F59E0B';
  const stroke = Math.max(3, unit / 150);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${escape(title)}"><title>${escape(title)}</title><rect width="${width}" height="${height}" rx="${unit / 24}" fill="#F8FAFC"/><ellipse cx="${width / 2}" cy="${groundY}" rx="${unit * 0.48}" ry="${unit * 0.055}" fill="#E2E8F0"/><rect x="${panelX}" y="${panelY}" width="${panelW}" height="${panelH}" rx="${unit * 0.025}" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="${stroke}"/><rect x="${panelX + panelW * 0.08}" y="${panelY + panelH * 0.16}" width="${panelW * 0.72}" height="${stroke * 2.2}" rx="${stroke}" fill="${color}"/><rect x="${panelX + panelW * 0.08}" y="${panelY + panelH * 0.32}" width="${panelW * 0.55}" height="${stroke * 2.2}" rx="${stroke}" fill="#CBD5E1"/><rect x="${panelX + panelW * 0.08}" y="${panelY + panelH * 0.48}" width="${panelW * 0.78}" height="${panelH * 0.28}" rx="${unit * 0.018}" fill="${tint(color, 0.12)}"/><circle cx="${panelX + panelW * 0.77}" cy="${panelY + panelH * 0.61}" r="${unit * 0.045}" fill="${accent}"/><circle cx="${width * 0.28}" cy="${height * 0.39}" r="${unit * 0.075}" fill="#FDBA74"/><path d="M ${width * 0.22} ${height * 0.39} Q ${width * 0.27} ${height * 0.25}, ${width * 0.35} ${height * 0.38}" fill="${color}"/><path d="M ${width * 0.2} ${groundY} L ${width * 0.27} ${height * 0.5} L ${width * 0.36} ${groundY}" fill="${color}"/><path d="M ${width * 0.24} ${groundY} L ${width * 0.18} ${groundY + unit * 0.02} M ${width * 0.35} ${groundY} L ${width * 0.41} ${groundY + unit * 0.02}" stroke="#111827" stroke-width="${stroke * 1.2}" stroke-linecap="round"/><path d="M ${width * 0.27} ${height * 0.52} L ${width * 0.44} ${height * 0.5}" stroke="#111827" stroke-width="${stroke * 1.2}" stroke-linecap="round"/><circle cx="${width * 0.59}" cy="${height * 0.2}" r="${unit * 0.025}" fill="${tint(color, 0.55)}"/><circle cx="${width * 0.77}" cy="${height * 0.72}" r="${unit * 0.035}" fill="${tint(accent, 0.45)}"/></svg>`;
}

function titleFor(req: AssetRequest): string {
  const topic = req.niche ? `${req.intent} for ${req.niche.replace(/[-_]/g, ' ')}` : req.intent;
  return `Illustration of ${topic.trim().replace(/\s+/g, ' ')}`;
}

function hash(value: string): number {
  let out = 0;
  for (const ch of value) out = (Math.imul(out, 31) + ch.charCodeAt(0)) | 0;
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
