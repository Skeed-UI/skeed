import type { AssetRequest, AssetResult, AssetSource } from '@skeed/contracts/asset-source';

export class GeminiImageAssetSource implements AssetSource {
  readonly id = 'gemini-image';
  private readonly apiKey = process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY;
  private readonly model = process.env.GEMINI_IMAGE_MODEL ?? 'gemini-2.0-flash-preview-image-generation';

  match(req: AssetRequest): { score: number; reason: string } {
    if (!this.apiKey) return { score: 0, reason: 'GOOGLE_API_KEY or GEMINI_API_KEY is not configured' };
    if (req.slotType === 'hero_illustration' || req.slotType === 'background') {
      return { score: 0.84, reason: 'Gemini image generation for hero/background assets' };
    }
    if (req.slotType === 'decorative' || req.slotType === 'content_photo') {
      return { score: 0.56, reason: 'Gemini generated visual asset' };
    }
    return { score: 0.16, reason: 'limited fit for this slot' };
  }

  async fetch(req: AssetRequest): Promise<AssetResult> {
    if (!this.apiKey) throw new Error('GOOGLE_API_KEY or GEMINI_API_KEY environment variable is required');
    const prompt = promptFor(req);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${encodeURIComponent(this.apiKey)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
      }),
    });
    if (!response.ok) throw new Error(`Gemini image API error: ${response.status} ${await response.text()}`);
    const data = (await response.json()) as GeminiResponse;
    const inline = findInlineImage(data);
    if (!inline) throw new Error('Gemini image API returned no inline image data');
    return {
      bytes: Uint8Array.from(Buffer.from(inline.data, 'base64')),
      mime: inline.mimeType,
      ...(req.size ? { width: req.size.width, height: req.size.height } : {}),
      altText: prompt.slice(0, 140),
      license: 'Gemini generated asset',
      costCents: this.estimateCost(req),
      cacheKey: `${this.id}:${this.model}:${hash(prompt)}`,
    };
  }

  estimateCost(_req: AssetRequest): number {
    return 4;
  }
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ inlineData?: { data: string; mimeType: string } }>;
    };
  }>;
}

function findInlineImage(data: GeminiResponse): { data: string; mimeType: string } | undefined {
  for (const candidate of data.candidates ?? []) {
    for (const part of candidate.content?.parts ?? []) {
      if (part.inlineData?.data) return part.inlineData;
    }
  }
  return undefined;
}

function promptFor(req: AssetRequest): string {
  const color = req.brandColor ? `Primary accent ${req.brandColor}.` : '';
  return `Generate a polished image for ${req.intent}. Audience ${req.demographic}, niche ${req.niche ?? 'general'}. ${color} No embedded words, no watermark.`;
}

function hash(value: string): number {
  let out = 5381;
  for (const ch of value) out = (Math.imul(out, 33) ^ ch.charCodeAt(0)) >>> 0;
  return out;
}
