# Agent brief — `@skeed/asset-source-fal`

Implement the `AssetSource` interface in `src/index.ts`. Contract lives at `packages/contracts/src/asset-source.ts`.

## Required

1. `match(req)` returns `{ score: 0..1, reason }` — what fraction of slots this source serves well.
2. `fetch(req)` performs the actual API call, returns `AssetResult` with bytes, mime, alt-text, license, attribution.
3. `estimateCost(req)` (optional but recommended) returns cents.
4. Tests: at minimum mock the underlying API and verify request shape, response normalization, error handling.
5. Auth: read API keys from `process.env.SKEED_FAL_API_KEY`. Document required env vars in your README.

## What slots is this source for?

Decide upfront — image AI, stock photo, decorative SVG, programmatic logo, etc. The `match()` score reflects this:

- Hero illustration → AI gen sources (fal/replicate/openai-image/gemini-image) score ~0.9
- Avatar → stock photo sources (unsplash/pexels) score ~0.9
- Decorative → CC0 SVG sources (open-doodles/undraw) score ~0.9
- Logo → SVG composer scores 1.0

## Do not

- Do not edit `packages/contracts` or `packages/assets-router`. The router consumes any `AssetSource` impl through DI — add yours and the router picks it up.
- Do not commit API keys.
