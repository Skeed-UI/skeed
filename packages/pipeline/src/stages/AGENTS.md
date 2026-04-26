# Agent brief — implement a pipeline stage

You own ONE stage file. Files in this folder are numbered `01-` through `17-`. Pick yours.

## Contract

Every stage exports a `Stage<I, O>` instance:

```ts
import type { Stage, StageContext } from '@skeed/contracts';

export const stage: Stage<InputType, OutputType> = {
  name: 'XX-stage-name',
  version: '0.1.0',
  inputSchema: InputZodSchema,
  outputSchema: OutputZodSchema,
  cacheable: true,
  async run(input, ctx) {
    // your logic
    return output;
  },
};
```

`Stage` lives in `packages/contracts/src/stage.ts`. Input/output Zod schemas live in `packages/contracts/src/pipeline-types.ts` (extend if your stage produces a new shape).

## Stage map

| # | File | Owner | Type |
|---|---|---|---|
| 01 | `01-intent.ts` | LLM | Extract structured Intent from raw prompt |
| 02 | `02-classify.ts` | LLM | Demographic + niche classifier; emits clarification questions |
| 03 | `03-pain-points.ts` | LLM | Probe pain points; emits clarification questions |
| 04 | `04-score-l1.ts` | LLM | 5-axis Level-1 idea score |
| 05 | `05-gate-1.ts` | UI | User pivot/persist decision (no-op stage that gates the run) |
| 06 | `06-research.ts` | external | Calls AutoResearchClaw via @skeed/research-bridge |
| 07 | `07-score-l2.ts` | LLM | 9-axis Level-2 score with research findings |
| 08 | `08-gate-2.ts` | UI | User final approval |
| 09 | `09-psychology.ts` | deterministic | Lookup psychology preset by (demographic, niche) |
| 10 | `10-brand-logo.ts` | hybrid | LLM picks brand attrs; SVG composer emits 3-4 logo candidates |
| 11 | `11-design-system.ts` | hybrid | Resolve preset, apply overrides, name palette/voice |
| 12 | `12-user-stories.ts` | LLM | Per-persona prioritized backlog |
| 13 | `13-landing-options.ts` | hybrid | 2-3 landing page candidates for user pick |
| 14 | `14-ia.ts` | LLM | SiteMap; nav pattern is rule-based |
| 15 | `15-compose.ts` | LLM | MCP search + per-page picker + Layout DSL |
| 16 | `16-assets.ts` | mixed | Asset router fills slots (logo + illustration + stock) |
| 17 | `17-emit.ts` | deterministic | Templated Next.js scaffold manifest |

## Required for every stage

1. **Input/output schemas validated.** Never accept or emit unvalidated data.
2. **Pure function.** Do not write to filesystem, do not mutate inputs. All I/O goes through `ctx.cache`, `ctx.emit`, or DI'd clients.
3. **Cancellation.** Honor `ctx.signal`.
4. **Observability.** Use `ctx.emit({ stage, type: 'token', data })` for streaming progress.
5. **Determinism.** If `cacheable: true`, identical input must yield identical output across runs.
6. **Tests.** A stage without a test in `src/stages/<n>.test.ts` will not merge.

## What NOT to do

- Do not import from another stage. Stages are siblings, never nested.
- Do not call vendor SDKs directly. Inject an `LLMProvider` from `@skeed/contracts`.
- Do not edit other stages or the orchestrator.

## Validation

```bash
pnpm --filter @skeed/pipeline typecheck
pnpm --filter @skeed/pipeline test
```
