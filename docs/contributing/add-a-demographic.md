# Add a new demographic

> Note: the closed-enum list of demographic ids is fixed at v1 (20 ids). To add a new id, file an RFC issue. To add **content** for an existing id, follow this guide.

## TL;DR

```bash
pnpm new:demographic <id>
# fills in data/demographics/<id>/ with TODO stubs
```

Then read `data/demographics/<id>/AGENTS.md` for the per-folder brief.

## Required artifacts

| File | Purpose | Schema |
|---|---|---|
| `preset.json` | DemographicPreset | `packages/contracts/src/preset.ts` |
| `psychology/<niche>.json` | At least one `PsychologyProfile` | `packages/contracts/src/psychology.ts` |
| `pain-points/<niche>.json` | At least one pain-point set (parallel niche) | `packages/contracts/src/psychology.ts` |
| `illustration-style.json` | AI-gen prompt suffix | `packages/demographics-loader/src/index.ts` |
| `logo-primitives/shapes/*.svg` | ≥2 shape primitives | SVG, `viewBox="0 0 64 64"`, `currentColor` |
| `logo-primitives/marks/*.svg` | ≥1 mark primitive | same |
| `logo-primitives/wordmarks/*.json` | ≥1 wordmark spec | font + sizing JSON |
| `owners.md` | Maintainer list | freeform markdown |
| `README.md` | Description, sources, design rationale | freeform markdown |

## Design checklist

- [ ] Palette validated for WCAG AA (AAA for AAA-strict demographics: kids, education, health, gov, mental_wellness)
- [ ] Typography stack uses real fonts (Google Fonts allowed; record family + fallback exactly)
- [ ] At least one psychology niche covers the most representative use case
- [ ] `forbiddenPatterns[]` enumerated with sources cited (regulatory or research)
- [ ] Illustration style prompt is concrete (negative prompts matter)
- [ ] Logo primitives use `currentColor` so the composer can theme them
- [ ] `pnpm lint:data` is green

## AAA-strict demographics

If your demographic is AAA-strict (kids, education, health, gov, mental_wellness):

1. **Two reviewers** required including the demographic's domain lead and an a11y reviewer.
2. **AAA contrast** on every text/bg pair in the palette's `contrastPairs[]`.
3. **No dark patterns** in `forbiddenPatterns[]`. Include the COPPA / HIPAA / Section 508 / etc. items relevant to your demographic.
4. **Illustration style** must include negative prompts for adult themes, copyrighted characters, and (where relevant) specific imagery to avoid.
