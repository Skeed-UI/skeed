# Agent brief — `@skeed/llm-cache`

Provider-agnostic prompt cache (Tier-3 `~/.skeed/cache.db`).

## Scope

Single package. Do not edit elsewhere except this folder and (if your slice requires it) `packages/contracts/` for new shared types — but contracts changes need a separate PR first.

## What to build

Implement:

- src/store.ts — opens `~/.skeed/cache.db` (creates if missing), exposes get/set/stats. Schema in `packages/llm-cache/migrations/0001_init.sql`.
- src/key.ts — composes cache keys: `sha256(stageVersion + canonical(input) + modelId + promptVersion + catalogVersion + provider)`.

Used by pipeline orchestrator and llm-provider-* packages.

## Validation

```bash
pnpm --filter @skeed/llm-cache typecheck
pnpm --filter @skeed/llm-cache test
```
