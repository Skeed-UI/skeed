import type { AssetRequest, AssetResult, AssetSource } from '@skeed/contracts/asset-source';

export class OpenaiImageAssetSource implements AssetSource {
  readonly id = 'openai-image';
  private readonly apiKey = process.env.OPENAI_API_KEY;
  private readonly model = process.env.OPENAI_IMAGE_MODEL ?? 'gpt-image-1';

  match(req: AssetRequest): { score: number; reason: string } {
    if (!this.apiKey) return { score: 0, reason: 'OPENAI_API_KEY is not configured' };
    if (req.slotType === 'logo' || req.slotType === 'wordmark' || req.slotType === 'icon') {
      return { score: 0.35, reason: 'image generation can support branded graphics' };
    }
    if (req.slotType === 'hero_illustration' || req.slotType === 'background') {
      return { score: 0.92, reason: 'high quality generated hero artwork' };
    }
    return { score: 0.58, reason: 'generated image fallback' };
  }

  async fetch(req: AssetRequest): Promise<AssetResult> {
    if (!this.apiKey) throw new Error('OPENAI_API_KEY environment variable is required');
    const prompt = imagePrompt(req);
    const size = closestSize(req.size?.width ?? 1024, req.size?.height ?? 1024);
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: this.model, prompt, size, n: 1 }),
    });
    if (!response.ok) {
      throw new Error(`OpenAI image API error: ${response.status} ${await response.text()}`);
    }
    const data = (await response.json()) as { data?: Array<{ b64_json?: string; url?: string }> };
    const first = data.data?.[0];
    if (!first) throw new Error('OpenAI image API returned no image');
    const bytes = first.b64_json
      ? base64ToBytes(first.b64_json)
      : await fetchBytes(first.url ?? '');
    return {
      bytes,
      mime: 'image/png',
      width: Number(size.split('x')[0]),
      height: Number(size.split('x')[1]),
      altText: prompt.slice(0, 140),
      license: 'OpenAI generated asset',
      costCents: this.estimateCost(req),
      cacheKey: `${this.id}:${this.model}:${hash(prompt)}:${size}`,
    };
  }

  estimateCost(_req: AssetRequest): number {
    return 5;
  }
}

function imagePrompt(req: AssetRequest): string {
  const style = req.styleHint ?? 'polished product illustration';
  const color = req.brandColor ? ` Use ${req.brandColor} as the primary accent.` : '';
  return `${style} for ${req.intent}. Audience: ${req.demographic}. Niche: ${req.niche ?? 'general'}.${color} No text, no logos, no watermarks.`;
}

function closestSize(width: number, height: number): '1024x1024' | '1536x1024' | '1024x1536' {
  const ratio = width / height;
  if (ratio > 1.2) return '1536x1024';
  if (ratio < 0.8) return '1024x1536';
  return '1024x1024';
}

async function fetchBytes(url: string): Promise<Uint8Array> {
  if (!url) throw new Error('image URL missing');
  const response = await fetch(url);
  if (!response.ok) throw new Error(`failed to download generated image: ${response.status}`);
  return new Uint8Array(await response.arrayBuffer());
}

function base64ToBytes(value: string): Uint8Array {
  return Uint8Array.from(Buffer.from(value, 'base64'));
}

function hash(value: string): number {
  let out = 5381;
  for (const ch of value) out = (Math.imul(out, 33) ^ ch.charCodeAt(0)) >>> 0;
  return out;
}
