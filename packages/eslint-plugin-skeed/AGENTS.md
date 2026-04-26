# Agent brief — `@skeed/eslint-plugin-skeed`

ESLint rules: bans literal hex/px/rem in archetype source, enforces ethics rules per demographic.

## Scope

Single package. Do not edit elsewhere except this folder and (if your slice requires it) `packages/contracts/` for new shared types — but contracts changes need a separate PR first.

## What to build

Implement custom ESLint rules:

- src/rules/no-literal-tokens.ts — forbid hex/px/rem in TSX under data/archetypes/. Suggest token-namespaced alternatives.
- src/rules/no-dark-patterns.ts — flag forbidden patterns per the loaded demographic preset.

Standard ESLint plugin shape: `{ rules: { ... } }`. Tested via @typescript-eslint/rule-tester.

## Validation

```bash
pnpm --filter @skeed/eslint-plugin-skeed typecheck
pnpm --filter @skeed/eslint-plugin-skeed test
```
