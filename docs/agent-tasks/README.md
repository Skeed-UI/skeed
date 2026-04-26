# Agent task index

This folder lists discrete, parallelizable tasks suitable for dispatching to AI agents (or humans). Each task is **fully self-contained** — an agent reading only its task file + `@skeed/contracts` should be able to complete the work.

## How to dispatch

```
1. Pick a task that says `available`.
2. Open a worktree off main: `git worktree add ../skeed-<task-id> <branch-name>`.
3. Hand the agent the task file path + a one-line objective.
4. When PR is open, mark the task `in-flight: <PR>`.
5. On merge, mark `done`.
```

## Task surface (parallel-safe slices)

### Demographics (20 slots — one in, 19 open)

`available` — kids is the seed. The 19 others scaffolded under `data/demographics/<id>/` need their content filled in. **Each is independent.**

| Demographic | AAA-strict? | Brief |
|---|---|---|
| teens | no | [data/demographics/teens/AGENTS.md](../../data/demographics/teens/AGENTS.md) |
| working_class | no | [data/demographics/working_class/AGENTS.md](../../data/demographics/working_class/AGENTS.md) |
| education | **yes** | [data/demographics/education/AGENTS.md](../../data/demographics/education/AGENTS.md) |
| religious | no | [data/demographics/religious/AGENTS.md](../../data/demographics/religious/AGENTS.md) |
| mental_wellness | **yes** | [data/demographics/mental_wellness/AGENTS.md](../../data/demographics/mental_wellness/AGENTS.md) |
| health | **yes** | [data/demographics/health/AGENTS.md](../../data/demographics/health/AGENTS.md) |
| legal | no | [data/demographics/legal/AGENTS.md](../../data/demographics/legal/AGENTS.md) |
| erp | no | [data/demographics/erp/AGENTS.md](../../data/demographics/erp/AGENTS.md) |
| sales_crm | no | [data/demographics/sales_crm/AGENTS.md](../../data/demographics/sales_crm/AGENTS.md) |
| hightech | no | [data/demographics/hightech/AGENTS.md](../../data/demographics/hightech/AGENTS.md) |
| social | no | [data/demographics/social/AGENTS.md](../../data/demographics/social/AGENTS.md) |
| monitoring | no | [data/demographics/monitoring/AGENTS.md](../../data/demographics/monitoring/AGENTS.md) |
| classic | no | [data/demographics/classic/AGENTS.md](../../data/demographics/classic/AGENTS.md) |
| fintech | no | [data/demographics/fintech/AGENTS.md](../../data/demographics/fintech/AGENTS.md) |
| ai_apps | no | [data/demographics/ai_apps/AGENTS.md](../../data/demographics/ai_apps/AGENTS.md) |
| marketplace | no | [data/demographics/marketplace/AGENTS.md](../../data/demographics/marketplace/AGENTS.md) |
| listings | no | [data/demographics/listings/AGENTS.md](../../data/demographics/listings/AGENTS.md) |
| gov | **yes** | [data/demographics/gov/AGENTS.md](../../data/demographics/gov/AGENTS.md) |
| military | no | [data/demographics/military/AGENTS.md](../../data/demographics/military/AGENTS.md) |
| productivity | no | [data/demographics/productivity/AGENTS.md](../../data/demographics/productivity/AGENTS.md) |

### Archetypes (~60 slots)

Each `.archetype.tsx` under `data/archetypes/` is a TODO. Implement the TSX (token-only) + complete the manifest's `tokensUsed[]` and `assetSlots[]`. **Each is independent.**

### Asset source adapters (8 packages)

`packages/asset-source-{fal,replicate,openai-image,gemini-image,unsplash,pexels,open-doodles,undraw}`. Each implements `AssetSource` from `@skeed/contracts`. Read the package's `AGENTS.md`.

### LLM providers (4 packages)

`packages/llm-provider-{anthropic,openai,google,ollama}`. Each implements `LLMProvider`.

### Pipeline stages (17)

`packages/pipeline/src/stages/<NN>-<slug>.ts`. Read `packages/pipeline/src/stages/AGENTS.md`.

### Major subsystems (each one is a multi-file slice but stays in one package)

| Slice | Package | Brief |
|---|---|---|
| Guards | `packages/guards/` | [AGENTS.md](../../packages/guards/AGENTS.md) |
| Scoring | `packages/scoring/` | [AGENTS.md](../../packages/scoring/AGENTS.md) |
| Research bridge | `packages/research-bridge/` | [AGENTS.md](../../packages/research-bridge/AGENTS.md) |
| Landing options | `packages/landing-options/` | [AGENTS.md](../../packages/landing-options/AGENTS.md) |
| Asset router | `packages/assets-router/` | [AGENTS.md](../../packages/assets-router/AGENTS.md) |
| SVG logo composer | `packages/asset-logo-svg/` | [AGENTS.md](../../packages/asset-logo-svg/AGENTS.md) |
| LLM cache | `packages/llm-cache/` | [AGENTS.md](../../packages/llm-cache/AGENTS.md) |
| ESLint plugin | `packages/eslint-plugin-skeed/` | [AGENTS.md](../../packages/eslint-plugin-skeed/AGENTS.md) |

## Coordination rules for parallel work

1. **No cross-slice edits.** If your slice needs a change in another slice, open a separate small PR for that change first.
2. **Contracts are pinned.** Do not add fields to `@skeed/contracts` mid-task. If your slice needs a new contract field, open an RFC.
3. **Tests before merge.** Every slice ships with at least smoke tests against fixtures.
4. **PR template per change-type.** GitHub auto-applies based on path (see `.github/PULL_REQUEST_TEMPLATE/`).
5. **CI is the source of truth.** Local green is necessary but not sufficient. Wait for CI to pass.
