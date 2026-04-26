# Contributing to Skeed

Skeed is built so that **most contributions are single-folder additions**. You should never need to touch more than one slice at a time.

## How the repo is organized

- `packages/` — TypeScript code. One package = one purpose. Stable contracts in `@skeed/contracts`.
- `data/` — Project data (demographics, archetypes, components, prompts, rubrics). Plain JSON / TSX / SVG. **No executable code.**
- `apps/desktop/` — Tauri app.
- `scripts/` — Bootstrap + codegen + lint helpers.
- `docs/` — Contributor guides + architecture decisions.

## Pick your slice

| You want to add… | Go to |
|---|---|
| A demographic (new vertical) | `pnpm new:demographic <id>` → fill `data/demographics/<id>/` |
| An archetype (new component template) | `pnpm new:archetype <id>` → fill `data/archetypes/<id>.archetype.{tsx,json}` |
| An AI image / stock asset adapter | `pnpm new:asset-source <id>` → fill `packages/asset-source-<id>/` |
| An LLM provider (Anthropic, OpenAI, Gemini, Ollama, …) | `pnpm new:llm-provider <id>` → fill `packages/llm-provider-<id>/` |
| A pipeline stage | `packages/pipeline/src/stages/<NN>-<slug>.ts` (read `AGENTS.md` in that folder) |
| A guardrail | `packages/guards/src/<rule>.ts` |
| A scoring rubric | `data/rubrics/score-l1/v<N>.json` (rubrics are versioned, never edited in place) |
| A clarification template | `data/ambiguity-templates/<key>.json` |

Every slice has an `AGENTS.md` brief with the exact contract. Read it before starting.

## Multi-agent / parallel contribution

This repo is structured to let humans **and** AI agents work in parallel without stepping on each other:

1. **One slice = one agent.** A slice is a single folder you can fully own. Agents working on different slices never edit overlapping files.
2. **Stable contracts.** `@skeed/contracts` is the only place cross-package types live. Changes there are a separate PR with a `BREAKING:` footer if backward-incompatible.
3. **Generated code is regeneratable.** `data/components/` and SQLite indices are produced by deterministic scripts; never hand-edit.
4. **Conventions over registration.** Loaders walk the data tree; you don't register your new file anywhere. Drop the file in the right path and the build picks it up.
5. **Per-slice AGENTS.md.** Every package and every contributor-facing data folder carries a self-contained brief. An agent that reads only its `AGENTS.md` + `@skeed/contracts` should be able to complete the slice.

See [`docs/agent-tasks/`](./docs/agent-tasks/) for ready-to-dispatch task briefs.

## Workflow

1. Fork + branch.
2. Run the appropriate `pnpm new:*` bootstrap script.
3. Implement against the slice's `AGENTS.md`.
4. **Validate locally:**
   ```bash
   pnpm lint:data       # all data/ files validate against contracts
   pnpm typecheck       # all packages typecheck
   pnpm test            # all unit tests pass
   ```
5. Open a PR. CI runs the full validation matrix; CODEOWNERS auto-routes review.

## License

MIT. By contributing you agree your work is MIT-licensed unless your slice declares otherwise (some upstream-derived components carry their own license — preserve it).
