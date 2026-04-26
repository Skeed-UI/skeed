# Agent brief — fill out a demographic

You own one demographic folder. Drop this brief into your context if you're an LLM agent assigned this slice.

## Scope

Single folder under `data/demographics/<id>/`. Do not edit anywhere else except your own folder.

## Required artifacts

| File | Purpose | Schema |
|---|---|---|
| `preset.json` | DemographicPreset (palette, typography, motion, etc.) | `packages/contracts/src/preset.ts` |
| `psychology/<niche>.json` | At least one PsychologyProfile | `packages/contracts/src/psychology.ts` (`PsychologyProfile`) |
| `pain-points/<niche>.json` | At least one pain-point set (parallel niche) | `packages/contracts/src/psychology.ts` (`PainPoint`) |
| `illustration-style.json` | AI-gen prompt suffix | `packages/demographics-loader/src/index.ts` (`IllustrationStyle`) |
| `logo-primitives/shapes/*.svg` | At least 2 shape primitives | SVG with `viewBox="0 0 64 64"` and `fill="currentColor"` |
| `logo-primitives/marks/*.svg` | At least 1 mark primitive | SVG with `viewBox="0 0 64 64"` |
| `logo-primitives/wordmarks/*.json` | At least 1 wordmark spec | font + sizing |
| `owners.md` | Maintainer list | freeform markdown |
| `README.md` | Description, sources, design rationale | freeform markdown |

## Reference example

Read [`data/demographics/kids/`](../kids/) end to end before starting. Mirror its structure.

## Worked steps

1. **Research first.** What does this demographic actually need? Look at: dominant industry style guides, regulatory load (COPPA / HIPAA / Section 508 / etc.), age band, cognitive load expectations.
2. **Write `preset.json`** — every field in `DemographicPreset` is required. Use real, contrast-validated colors. Use real font stacks (Google Fonts is fine; record names exactly).
3. **Write `psychology/<niche>.json`** for at least one niche. Pick the most representative niche first.
4. **Write `pain-points/<niche>.json`** matching the niche.
5. **Write `illustration-style.json`** — the prompt suffix that will be appended when AI-gen creates illustrations for this demographic. Negative prompts matter.
6. **Author `logo-primitives/`** — at minimum 2 shapes + 1 mark + 1 wordmark. SVGs use `currentColor` so the composer can theme them.
7. **Run `pnpm lint:data`** and fix anything red.
8. **AAA-strict demographics** (kids, education, health, gov, mental_wellness): require two-reviewer SLA. Tag your PR with `aaa-strict` and request review from the relevant domain leads in `owners.md`.

## What to NOT do

- Do not edit `packages/`. If you need a new field on the schema, open an issue first — schema changes are a breaking change.
- Do not import other demographics' assets — composition happens at runtime, not at content level.
- Do not hardcode colors that fail WCAG AA at minimum (AAA for AAA-strict).
- Do not introduce dark patterns. The guards module will reject them at scaffold time.

## Validation

```bash
pnpm lint:data    # must pass
```
