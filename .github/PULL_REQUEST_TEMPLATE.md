## What

Briefly describe the change. Link the issue / RFC if applicable.

## Slice

Which single slice does this touch? (e.g. `data/demographics/fintech`, `packages/asset-source-fal`, `packages/pipeline/src/stages/06-research.ts`)

## Validation

- [ ] `pnpm lint:data` is green
- [ ] `pnpm typecheck` is green
- [ ] `pnpm test` is green
- [ ] If touching `data/components/` or `data/archetypes/`, visual-regression is green
- [ ] If touching AAA-strict content (kids/education/health/gov/mental_wellness), domain lead + a11y reviewer requested

## Breaking changes

If this changes any interface in `@skeed/contracts`, add a `BREAKING:` footer to the commit message and link the RFC.

## Notes for reviewer

(optional)
