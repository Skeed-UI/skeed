import { AssetsRouter } from '@skeed/assets-router';
import { FalAssetSource } from '@skeed/asset-source-fal';
import { GeminiImageAssetSource } from '@skeed/asset-source-gemini-image';
import { OpenDoodlesAssetSource } from '@skeed/asset-source-open-doodles';
import { OpenaiImageAssetSource } from '@skeed/asset-source-openai-image';
import { PexelsAssetSource } from '@skeed/asset-source-pexels';
import { ReplicateAssetSource } from '@skeed/asset-source-replicate';
import { UndrawAssetSource } from '@skeed/asset-source-undraw';
import { UnsplashAssetSource } from '@skeed/asset-source-unsplash';
import { AssetSlotType } from '@skeed/contracts';
import type { AssetSlotType as AssetSlotTypeValue } from '@skeed/contracts';
import type { Stage } from '@skeed/contracts';
import { PipelineState } from './state.js';

/**
 * Stage 16 — Asset population. Walks the chosen IA + landing slots, asks the
 * AssetsRouter for each non-logo asset (logo comes from Stage 10). Writes
 * resolved asset blobs to state for Stage 17 to emit to disk.
 */
export const stage_16_assets: Stage<PipelineState, PipelineState> = {
  name: '16-assets',
  version: '0.3.0',
  inputSchema: PipelineState,
  outputSchema: PipelineState,
  cacheable: false,
  async run(state) {
    const router = new AssetsRouter({
      sources: [
        new OpenaiImageAssetSource(),
        new GeminiImageAssetSource(),
        new FalAssetSource(),
        new ReplicateAssetSource(),
        new PexelsAssetSource(),
        new UnsplashAssetSource(),
        new OpenDoodlesAssetSource(),
        new UndrawAssetSource(),
      ],
    });
    const assets: NonNullable<PipelineState['resolvedAssets']> = [];

    if (state.logoChosen) {
      assets.push({
        slot: 'logo',
        kind: 'logo',
        sourceId: 'svg-composer',
        relativePath: 'public/logo.svg',
        contents: state.logoChosen.svg,
        encoding: 'utf8',
      });
    }

    const top = state.classification?.candidates[0];
    if (top) {
      const requests = assetRequestsFromState(state);
      for (const request of requests) {
        try {
          const routeRequest: Parameters<AssetsRouter['route']>[0] = {
            slotRole: request.slot,
            slotType: request.slotType,
            demographic: top.demographic,
            niche: top.niche,
            intent: request.intent,
            size: request.size,
            ...(state.designSystem?.palette.primary
              ? { brandColor: state.designSystem.palette.primary }
              : {}),
            ...(request.styleHint ? { styleHint: request.styleHint } : {}),
          };
          const routed = await router.route(routeRequest);
          const encoded = encodeAsset(routed.bytes, routed.mime);
          assets.push({
            slot: request.slot,
            kind: kindFor(request.slotType),
            sourceId: routed.sourceId,
            relativePath: `public/${request.fileBase}.${extensionFor(routed.mime)}`,
            contents: encoded.contents,
            encoding: encoded.encoding,
            altText: routed.altText,
          });
        } catch (err) {
          process.stderr.write(
            `[skeed] asset "${request.slot}" fetch failed: ${err instanceof Error ? err.message : String(err)}\n`,
          );
        }
      }
    }

    return { ...state, resolvedAssets: assets };
  },
};

interface AssetPlan {
  slot: string;
  slotType: AssetSlotTypeValue;
  intent: string;
  fileBase: string;
  styleHint?: string;
  size: { width: number; height: number };
}

function assetRequestsFromState(state: PipelineState): AssetPlan[] {
  const plans = new Map<string, AssetPlan>();
  const idea = state.intent?.jobToBeDone?.slice(0, 100) ?? state.prompt.slice(0, 100);

  const heroStyleHint = state.designSystem?.tokens.find((token) =>
    /illustration|visual/i.test(token.role),
  )?.value;
  plans.set('hero', {
    slot: 'hero',
    slotType: 'hero_illustration',
    intent: idea,
    fileBase: 'hero',
    ...(heroStyleHint ? { styleHint: heroStyleHint } : {}),
    size: { width: 1200, height: 600 },
  });

  for (const page of state.siteMap?.pages ?? []) {
    for (const slot of page.slots) {
      const slotType = slotTypeFor(slot.role, slot.intent);
      if (!slotType || slotType === 'logo') continue;
      const key = `${page.id}-${slot.role}`.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
      if (plans.has(key)) continue;
      plans.set(key, {
        slot: `${page.id}:${slot.role}`,
        slotType,
        intent: slot.intent || idea,
        fileBase: `assets/${key}`,
        styleHint: slot.role,
        size:
          slotType === 'content_photo' ? { width: 900, height: 600 } : { width: 1200, height: 600 },
      });
    }
  }

  for (const component of state.selectedComponents ?? []) {
    for (const slot of component.manifest.assetSlots ?? []) {
      const slotType = AssetSlotType.safeParse(slot.type).success
        ? (slot.type as AssetSlotTypeValue)
        : undefined;
      if (!slotType || slotType === 'logo') continue;
      const key = `component-${component.id}-${slot.role}`
        .replace(/[^a-z0-9-]/gi, '-')
        .toLowerCase();
      if (plans.has(key)) continue;
      plans.set(key, {
        slot: `${component.id}:${slot.role}`,
        slotType,
        intent: `${idea} ${component.manifest.name ?? component.id} ${slot.role}`,
        fileBase: `assets/${key}`,
        styleHint: component.manifest.description ?? slot.role,
        size:
          slotType === 'content_photo' ? { width: 900, height: 600 } : { width: 1200, height: 600 },
      });
    }
    for (const slot of component.manifest.contentSlots ?? []) {
      const slotType = contentSlotAssetType(slot.type);
      if (!slotType) continue;
      const key = `content-${component.id}-${slot.name}`.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
      if (plans.has(key)) continue;
      plans.set(key, {
        slot: `${component.id}:${slot.name}`,
        slotType,
        intent: `${idea} ${component.manifest.name ?? component.id} ${slot.name}`,
        fileBase: `assets/${key}`,
        styleHint: component.manifest.description ?? slot.name,
        size:
          slotType === 'content_photo' ? { width: 900, height: 600 } : { width: 1200, height: 600 },
      });
    }
  }

  return Array.from(plans.values()).slice(0, 5);
}

function contentSlotAssetType(type: string): AssetSlotTypeValue | undefined {
  if (type === 'image') return 'content_photo';
  if (type === 'icon') return 'icon';
  return undefined;
}

function slotTypeFor(role: string, intent: string): AssetSlotTypeValue | undefined {
  const text = `${role} ${intent}`.toLowerCase();
  if (/hero|illustration|visual/.test(text)) return 'hero_illustration';
  if (/photo|image|gallery|portrait/.test(text)) return 'content_photo';
  if (/background|backdrop/.test(text)) return 'background';
  if (/icon/.test(text)) return 'icon';
  if (/avatar|profile/.test(text)) return 'avatar';
  if (/decor|divider|pattern/.test(text)) return 'decorative';
  return undefined;
}

function kindFor(
  slotType: AssetSlotTypeValue,
): NonNullable<PipelineState['resolvedAssets']>[number]['kind'] {
  if (slotType === 'content_photo') return 'content_photo';
  if (slotType === 'icon') return 'icon';
  if (slotType === 'avatar') return 'avatar';
  if (slotType === 'logo') return 'logo';
  if (slotType === 'hero_illustration') return 'hero_illustration';
  return 'decorative';
}

function encodeAsset(
  bytes: Uint8Array,
  mime: string,
): { contents: string; encoding: 'utf8' | 'base64' } {
  if (mime === 'image/svg+xml') {
    return { contents: new TextDecoder().decode(bytes), encoding: 'utf8' };
  }
  return { contents: Buffer.from(bytes).toString('base64'), encoding: 'base64' };
}

function extensionFor(mime: string): string {
  if (mime === 'image/svg+xml') return 'svg';
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/gif') return 'gif';
  return 'png';
}
