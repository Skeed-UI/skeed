import type { AssetRequest, AssetResult, AssetSource } from '@skeed/contracts/asset-source';

interface UnsplashPhoto {
  id: string;
  urls: { regular: string; raw: string };
  width: number;
  height: number;
  description: string | null;
  alt_description: string | null;
  user: { name: string; links: { html: string } };
  links: { html: string };
}

export class UnsplashAssetSource implements AssetSource {
  readonly id = 'unsplash';
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.UNSPLASH_ACCESS_KEY;
  }

  match(req: AssetRequest): { score: number; reason: string } {
    // Unsplash works best for hero images, backgrounds, and general photography
    const imageSlots = ['hero_illustration', 'background', 'card_image', 'avatar'];
    const isImageSlot = imageSlots.includes(req.slotRole);

    // Prefer Unsplash for photography-style requests, not for icons/logos
    const isPhotoRequest = !req.styleHint?.includes('icon') &&
                           !req.styleHint?.includes('logo') &&
                           !req.styleHint?.includes('svg');

    if (!isImageSlot) {
      return { score: 0.1, reason: 'not an image slot' };
    }

    if (!isPhotoRequest) {
      return { score: 0.2, reason: 'style hint suggests non-photography asset' };
    }

    // High score for hero/background images with photographic style
    return { score: 0.85, reason: 'suitable for photographic content' };
  }

  async fetch(req: AssetRequest): Promise<AssetResult> {
    if (!this.apiKey) {
      throw new Error('UNSPLASH_ACCESS_KEY environment variable is required');
    }

    // Build search query from intent and niche
    const query = this.buildQuery(req);
    const width = req.size?.width ?? 1200;
    const height = req.size?.height ?? 800;

    // Search for photos
    const searchUrl = new URL('https://api.unsplash.com/search/photos');
    searchUrl.searchParams.set('query', query);
    searchUrl.searchParams.set('per_page', '1');
    searchUrl.searchParams.set('orientation', this.getOrientation(width, height));

    const response = await fetch(searchUrl.toString(), {
      headers: { Authorization: `Client-ID ${this.apiKey}` },
    });

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as { results: UnsplashPhoto[] };

    const photo = data.results[0];
    if (!photo) {
      throw new Error(`No Unsplash photos found for query: ${query}`);
    }

    // Fetch the actual image bytes
    const imageUrl = `${photo.urls.raw}&w=${width}&h=${height}&fit=crop`;
    const imageResponse = await fetch(imageUrl);

    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }

    const arrayBuffer = await imageResponse.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    return {
      bytes,
      mime: 'image/jpeg',
      width: photo.width,
      height: photo.height,
      altText: photo.description || photo.alt_description || `${req.intent} image`,
      license: 'Unsplash License (free with attribution)',
      attribution: {
        source: 'Unsplash',
        url: photo.links.html,
        author: photo.user.name,
      },
      costCents: 0,
      cacheKey: `unsplash:${photo.id}:${width}x${height}`,
    };
  }

  estimateCost(_req: AssetRequest): number {
    // Unsplash is free with attribution
    return 0;
  }

  private buildQuery(req: AssetRequest): string {
    const parts = [req.intent];
    if (req.niche) parts.push(req.niche);
    if (req.demographic) parts.push(req.demographic);
    return parts.join(' ');
  }

  private getOrientation(width: number, height: number): string {
    const ratio = width / height;
    if (ratio > 1.2) return 'landscape';
    if (ratio < 0.8) return 'portrait';
    return 'squarish';
  }
}
