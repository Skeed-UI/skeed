# Agent brief — `@skeed/landing-options`

2-3 landing page candidate generator.

## Scope

Single package. Do not edit elsewhere except this folder and (if your slice requires it) `packages/contracts/` for new shared types — but contracts changes need a separate PR first.

## What to build

Implement:

- src/archetypes.ts — declarative defs of 3 landing archetypes: hero-led, story-led, conversion-focused. Each is a Layout DSL tree with slot roles, not concrete component ids.
- src/render.ts — given (archetype, DesignSystem, LogoCandidate) → LandingCandidate (Layout DSL bound to chosen components + assets, plus a screenshot or HTML preview).

Pipeline stage 13 calls render() three times with different archetypes and presents the user 3 candidates.

## Validation

```bash
pnpm --filter @skeed/landing-options typecheck
pnpm --filter @skeed/landing-options test
```
