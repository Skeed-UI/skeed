import type { AssetRequest, AssetResult, AssetSource } from '@skeed/contracts/asset-source';

interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  alt: string;
  url: string;
  photographer: string;
  photographer_url: string;
  src: {
    original: string;
    large2x?: string;
    large?: string;
    landscape?: string;
    portrait?: string;
  };
}

export class PexelsAssetSource implements AssetSource {
  readonly id = 'pexels';
  private readonly apiKey = process.env.PEXELS_API_KEY;

  match(req: AssetRequest): { score: number; reason: string } {
    if (!this.apiKey) return { score: 0, reason: 'PEXELS_API_KEY is not configured' };
    if (req.slotType === 'content_photo') return { score: 0.88, reason: 'Pexels photo content' };
    if (req.slotType === 'hero_illustration' || req.slotType === 'background') {
      return { score: 0.78, reason: 'Pexels photographic hero/background' };
    }
    if (req.slotType === 'avatar') return { score: 0.5, reason: 'Pexels portrait search' };
    return { score: 0.05, reason: 'not a photography slot' };
  }

  async fetch(req: AssetRequest): Promise<AssetResult> {
    if (!this.apiKey) throw new Error('PEXELS_API_KEY environment variable is required');

    const width = req.size?.width ?? 1200;
    const height = req.size?.height ?? 800;
    const searchUrl = new URL('https://api.pexels.com/v1/search');
    searchUrl.searchParams.set('query', buildQuery(req));
    searchUrl.searchParams.set('per_page', '1');
    searchUrl.searchParams.set('orientation', orientation(width, height));

    const response = await fetch(searchUrl, { headers: { Authorization: this.apiKey } });
    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as { photos: PexelsPhoto[] };
    const photo = data.photos[0];
    if (!photo) throw new Error(`No Pexels photos found for ${buildQuery(req)}`);

    const sourceUrl = chooseSource(photo, width, height);
    const imageResponse = await fetch(sourceUrl);
    if (!imageResponse.ok) throw new Error(`Failed to fetch Pexels image: ${imageResponse.status}`);

    return {
      bytes: new Uint8Array(await imageResponse.arrayBuffer()),
      mime: 'image/jpeg',
      width: photo.width,
      height: photo.height,
      altText: photo.alt || `${req.intent} photo`,
      license: 'Pexels License',
      attribution: {
        source: 'Pexels',
        url: photo.url,
        author: photo.photographer,
      },
      costCents: 0,
      cacheKey: `${this.id}:${photo.id}:${width}x${height}`,
    };
  }

  estimateCost(_req: AssetRequest): number {
    return 0;
  }
}

function buildQuery(req: AssetRequest): string {
  return [req.intent, req.niche, req.demographic]
    .filter((part): part is string => Boolean(part))
    .join(' ')
    .replace(/[_-]/g, ' ')
    .slice(0, 120);
}

function chooseSource(photo: PexelsPhoto, width: number, height: number): string {
  if (width > height) return photo.src.landscape ?? photo.src.large2x ?? photo.src.large ?? photo.src.original;
  if (height > width) return photo.src.portrait ?? photo.src.large2x ?? photo.src.large ?? photo.src.original;
  return photo.src.large2x ?? photo.src.large ?? photo.src.original;
}

function orientation(width: number, height: number): string {
  const ratio = width / height;
  if (ratio > 1.2) return 'landscape';
  if (ratio < 0.8) return 'portrait';
  return 'square';
}
