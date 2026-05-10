import type { AssetRequest, AssetResult, AssetSource } from '@skeed/contracts/asset-source';

export class FalAssetSource implements AssetSource {
  readonly id = 'fal';
  private readonly apiKey = process.env.FAL_KEY;
  private readonly endpoint = process.env.FAL_IMAGE_ENDPOINT ?? 'fal-ai/flux/schnell';

  match(req: AssetRequest): { score: number; reason: string } {
    if (!this.apiKey) return { score: 0, reason: 'FAL_KEY is not configured' };
    if (req.slotType === 'hero_illustration' || req.slotType === 'background') {
      return { score: 0.86, reason: 'fal image generation for hero/background assets' };
    }
    if (req.slotType === 'decorative' || req.slotType === 'content_photo') {
      return { score: 0.62, reason: 'fal generated visual asset' };
    }
    return { score: 0.18, reason: 'limited fit for this slot' };
  }

  async fetch(req: AssetRequest): Promise<AssetResult> {
    if (!this.apiKey) throw new Error('FAL_KEY environment variable is required');
    const prompt = promptFor(req);
    const response = await fetch(`https://fal.run/${this.endpoint}`, {
      method: 'POST',
      headers: {
        Authorization: `Key ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        image_size: imageSize(req.size?.width ?? 1024, req.size?.height ?? 768),
        num_images: 1,
      }),
    });
    if (!response.ok) throw new Error(`fal image API error: ${response.status} ${await response.text()}`);
    const data = (await response.json()) as { images?: Array<{ url?: string; content_type?: string }> };
    const image = data.images?.[0];
    if (!image?.url) throw new Error('fal image API returned no image URL');
    const bytes = await fetchBytes(image.url);
    return {
      bytes,
      mime: image.content_type ?? 'image/png',
      ...(req.size ? { width: req.size.width, height: req.size.height } : {}),
      altText: prompt.slice(0, 140),
      license: 'fal generated asset',
      costCents: this.estimateCost(req),
      cacheKey: `${this.id}:${this.endpoint}:${hash(prompt)}`,
    };
  }

  estimateCost(_req: AssetRequest): number {
    return 2;
  }
}

function promptFor(req: AssetRequest): string {
  const color = req.brandColor ? ` Accent color: ${req.brandColor}.` : '';
  return `Clean product visual for ${req.intent}. Audience ${req.demographic}, niche ${req.niche ?? 'general'}.${color} No text, no watermark.`;
}

function imageSize(width: number, height: number): string {
  const ratio = width / height;
  if (ratio > 1.2) return 'landscape_16_9';
  if (ratio < 0.8) return 'portrait_16_9';
  return 'square_hd';
}

async function fetchBytes(url: string): Promise<Uint8Array> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`failed to download fal image: ${response.status}`);
  return new Uint8Array(await response.arrayBuffer());
}

function hash(value: string): number {
  let out = 0;
  for (const ch of value) out = (Math.imul(out, 31) + ch.charCodeAt(0)) >>> 0;
  return out;
}
