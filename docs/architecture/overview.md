# Architecture overview

> Source-of-truth plan: [`~/.claude/plans/i-want-to-design-piped-goblet.md`](../../../../Users/Son/.claude/plans/i-want-to-design-piped-goblet.md). This doc summarizes for contributors.

## Two core subsystems

1. **UI Component System** — Catalog of demographic-tagged components served via MCP. Token-only archetypes × demographic presets × densities, generated.
2. **NL → Design System Pipeline** — 17-stage DAG from prompt to scaffold, with two scoring gates and AutoResearchClaw between them.

## Data tiers

- **Tier 1 — Source of truth.** Filesystem under `data/`. Plain JSON / TSX / SVG. Reviewable in PRs.
- **Tier 2 — Built index.** SQLite (`packages/indexer/dist/registry.db`) regenerated from Tier 1 on every build. Read-only. Ships in `@skeed/mcp-server`.
- **Tier 3 — Runtime state.** SQLite at `~/.skeed/cache.db` and `<project>/.skeed/run.db`. Per-machine, per-project. Throwaway.

## Plugin contracts

Every extension point is an interface in `@skeed/contracts`:

- `AssetSource` — image generators, stock libraries, programmatic SVG composers
- `LLMProvider` — Anthropic, OpenAI, Gemini, Ollama, …
- `ResearchEngine` — AutoResearchClaw or lite fallback
- `Stage<I,O>` — pipeline stages (17 today)
- `Guard<T>` — deterministic guardrails
- `ScoreRubric` — versioned JSON

Implementations live in their own packages (`packages/asset-source-*`, `packages/llm-provider-*`, etc.) and are registered via DI at boot — no global registries.

## Build flow

```
data/  ──(loaders)──▶  packages/indexer  ──▶  dist/registry.db  ──▶  @skeed/mcp-server
                                                                 ▼
                                                         External hosts:
                                                         Claude Code / Cursor / Tauri app
```

The pipeline (`@skeed/pipeline`) consumes the MCP server as a client, plus injected `LLMProvider`, `AssetSource[]`, `ResearchEngine`, and `Guard[]` instances.

## End-to-end pipeline (17 stages)

```
1  intent           extract Intent (LLM)
2  classify         demo+niche + clarification (LLM)
3  pain-points      probe pain points (LLM)
4  score-l1         5-axis L1 score (LLM judge)
5  gate-1           user pivot/persist (UI)
6  research         AutoResearchClaw or lite (external)
7  score-l2         9-axis L2 with findings (LLM judge)
8  gate-2           user final approval (UI)
9  psychology       deterministic preset lookup
10 brand-logo       BrandAttrs (LLM) + SVG candidates (deterministic)
11 design-system    preset resolve + overrides + naming (hybrid)
12 user-stories     prioritized backlog (LLM)
13 landing-options  2-3 candidates (hybrid)
14 ia               sitemap + rule-based nav (LLM)
15 compose          MCP search + Layout DSL → TSX (hybrid)
16 assets           router fills slots (mixed)
17 emit             Next.js manifest (deterministic)
```
