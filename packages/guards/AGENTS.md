# Agent brief — `@skeed/guards`

Deterministic, fail-closed guardrails (contrast, forbidden patterns, PII, ethics-lint, alt-text, no hallucinated component IDs).

## Scope

Single package. Do not edit elsewhere except this folder and (if your slice requires it) `packages/contracts/` for new shared types — but contracts changes need a separate PR first.

## What to build

Implement individual Guard objects in src/<guard-name>.ts. Contract: `Guard<TInput>` from @skeed/contracts/guard. Each guard returns a GuardResult with violations + autoFixed flag. Run order: hard guards first (fatal), soft guards second (warning).

Guards to implement (one file per guard):

- contrast.ts — WCAG contrast checker, auto-fix by darken/lighten
- forbidden-patterns.ts — per-demographic deny rules
- pii-scrub.ts — health/fintech/gov scanner
- ethics-lint.ts — kids/wellness/gov dark-pattern lint
- asset-checks.ts — alt-text + AI-text-rendering OCR check
- token-resolution.ts — every Tailwind class resolves to a defined token
- component-existence.ts — every component id exists in catalog

## Validation

```bash
pnpm --filter @skeed/guards typecheck
pnpm --filter @skeed/guards test
```
