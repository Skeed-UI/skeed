import type { AssetRequest, AssetResult, AssetSource } from '@skeed/contracts/asset-source';

export class ReplicateAssetSource implements AssetSource {
  readonly id = 'replicate';
  private readonly apiKey = process.env.REPLICATE_API_TOKEN;
  private readonly version = process.env.REPLICATE_IMAGE_VERSION;

  match(req: AssetRequest): { score: number; reason: string } {
    if (!this.apiKey || !this.version) {
      return { score: 0, reason: 'REPLICATE_API_TOKEN and REPLICATE_IMAGE_VERSION are required' };
    }
    if (req.slotType === 'hero_illustration' || req.slotType === 'background') {
      return { score: 0.82, reason: 'Replicate configured image model' };
    }
    if (req.slotType === 'decorative' || req.slotType === 'content_photo') {
      return { score: 0.58, reason: 'Replicate generated visual asset' };
    }
    return { score: 0.15, reason: 'limited fit for this slot' };
  }

  async fetch(req: AssetRequest): Promise<AssetResult> {
    if (!this.apiKey) throw new Error('REPLICATE_API_TOKEN environment variable is required');
    if (!this.version) throw new Error('REPLICATE_IMAGE_VERSION environment variable is required');

    const prompt = promptFor(req);
    const create = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        Authorization: `Token ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: this.version,
        input: { prompt, width: req.size?.width ?? 1024, height: req.size?.height ?? 768 },
      }),
    });
    if (!create.ok) throw new Error(`Replicate API error: ${create.status} ${await create.text()}`);
    let prediction = (await create.json()) as Prediction;
    for (let i = 0; i < 24 && isPending(prediction.status); i += 1) {
      await delay(1500);
      const next = await fetch(prediction.urls.get, {
        headers: { Authorization: `Token ${this.apiKey}` },
      });
      if (!next.ok) throw new Error(`Replicate polling error: ${next.status}`);
      prediction = (await next.json()) as Prediction;
    }
    const url = outputUrl(prediction.output);
    if (!url) throw new Error(`Replicate prediction did not produce an image (${prediction.status})`);
    const bytes = await fetchBytes(url);
    return {
      bytes,
      mime: url.endsWith('.jpg') || url.endsWith('.jpeg') ? 'image/jpeg' : 'image/png',
      ...(req.size ? { width: req.size.width, height: req.size.height } : {}),
      altText: prompt.slice(0, 140),
      license: 'Replicate generated asset',
      costCents: this.estimateCost(req),
      cacheKey: `${this.id}:${this.version}:${hash(prompt)}`,
    };
  }

  estimateCost(_req: AssetRequest): number {
    return 4;
  }
}

interface Prediction {
  status: string;
  output?: unknown;
  urls: { get: string };
}

function isPending(status: string): boolean {
  return status === 'starting' || status === 'processing';
}

function outputUrl(output: unknown): string | undefined {
  if (typeof output === 'string') return output;
  if (Array.isArray(output)) return output.find((item): item is string => typeof item === 'string');
  if (output && typeof output === 'object' && 'url' in output) {
    const url = (output as { url?: unknown }).url;
    if (typeof url === 'string') return url;
  }
  return undefined;
}

function promptFor(req: AssetRequest): string {
  const color = req.brandColor ? `Use ${req.brandColor} as an accent.` : '';
  return `Production-ready visual for ${req.intent}, ${req.demographic}/${req.niche ?? 'general'}. ${color} No text or watermark.`;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchBytes(url: string): Promise<Uint8Array> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`failed to download Replicate image: ${response.status}`);
  return new Uint8Array(await response.arrayBuffer());
}

function hash(value: string): number {
  let out = 2166136261;
  for (const ch of value) {
    out ^= ch.charCodeAt(0);
    out = Math.imul(out, 16777619);
  }
  return out >>> 0;
}
