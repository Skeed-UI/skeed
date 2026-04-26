# Agent brief — `@skeed/assets-router`

Slot → asset-source decision. Reads AssetSource plugins via DI.

## Scope

Single package. Do not edit elsewhere except this folder and (if your slice requires it) `packages/contracts/` for new shared types — but contracts changes need a separate PR first.

## What to build

Implement:

- src/router.ts — `route(slot, demographic, sources): AssetSource`. For each slot type (logo, hero_illustration, content_photo, decorative, icon, avatar), call `source.match(req)` on every registered source and pick the highest scorer. Tie-breakers documented.
- src/cache.ts — content-addressed cache at `~/.skeed/assets/<sha256>.<ext>`. Reads/writes asset_cache table in `~/.skeed/cache.db` (Tier-3).
- src/budget.ts — enforce per-run cost cap (default $1.00, configurable).

Do not import any AssetSource implementation directly — they're injected.

## Validation

```bash
pnpm --filter @skeed/assets-router typecheck
pnpm --filter @skeed/assets-router test
```
