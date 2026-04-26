# Agent brief — `@skeed/asset-logo-svg`

Programmatic SVG logo composer using primitives from data/demographics/<id>/logo-primitives/.

## Scope

Single package. Do not edit elsewhere except this folder and (if your slice requires it) `packages/contracts/` for new shared types — but contracts changes need a separate PR first.

## What to build

Implement:

- src/composer.ts — given (BrandAttributes, DemographicPreset, LogoPrimitiveIndex) → 3-4 LogoCandidates with SVG source + favicon variants + alt text.
- src/primitive-loader.ts — walks data/demographics/<id>/logo-primitives/ via @skeed/demographics-loader.
- src/layouts.ts — implements layout strategies: stacked, horizontal, badge, monogram, mark-only, wordmark-only.
- src/favicon.ts — renders SVG → PNG at 32 + 180px (use sharp or similar).

Implement the `AssetSource` interface from @skeed/contracts. `match()` scores 1.0 for slot type "logo", 0 otherwise.

## Validation

```bash
pnpm --filter @skeed/asset-logo-svg typecheck
pnpm --filter @skeed/asset-logo-svg test
```
