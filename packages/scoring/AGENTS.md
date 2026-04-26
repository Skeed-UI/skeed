# Agent brief — `@skeed/scoring`

L1 + L2 idea scoring rubrics + LLM judge.

## Scope

Single package. Do not edit elsewhere except this folder and (if your slice requires it) `packages/contracts/` for new shared types — but contracts changes need a separate PR first.

## What to build

Implement:

- src/rubrics/l1.ts — load `data/rubrics/score-l1/<version>.json`, validate against ScoreRubric
- src/rubrics/l2.ts — load `data/rubrics/score-l2/<version>.json`
- src/judge.ts — given (rubric, input, llmProvider) → IdeaScore via structured output
- src/feedback.ts — given IdeaScore → recommendations[]

Rubric files live at `data/rubrics/score-l1/v1.json` etc. Author them as part of this slice.

## Validation

```bash
pnpm --filter @skeed/scoring typecheck
pnpm --filter @skeed/scoring test
```
