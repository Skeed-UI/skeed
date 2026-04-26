import type { AssetRequest, AssetResult, AssetSource } from '@skeed/contracts/asset-source';

export class OpenDoodlesAssetSource implements AssetSource {
  readonly id = 'open-doodles';

  match(_req: AssetRequest): { score: number; reason: string } {
    // TODO: return a 0..1 score for whether this source can satisfy the slot.
    return { score: 0, reason: 'not implemented' };
  }

  async fetch(_req: AssetRequest): Promise<AssetResult> {
    // TODO: call the underlying API, return bytes + metadata.
    throw new Error('not implemented');
  }

  estimateCost(_req: AssetRequest): number {
    return 0;
  }
}
