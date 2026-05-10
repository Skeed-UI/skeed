# Generation Path Audit

Date: 2026-05-02 (revised after third sweep)

## Goal

Skeed's generation path should degrade intelligently:

1. provider LLM with structured schema validation
2. local LLM with constrained JSON generation
3. deterministic fallback with demographic-aware heuristics
4. guard validation before files are emitted

## Fixes Applied (cumulative)

- CLI API-key prompts now map keys into provider-specific env vars used by `@skeed/llm-router`.
- `--demographic` now seeds a pinned classification, and Stage 02 preserves it instead of overwriting it.
- `--no-api-key` no longer disables the local model (was a bug — the flag should only skip the API
  key prompt, not the entire local fallback chain).
- API LLM failure now falls through to local AI before deterministic fallback.
- Stage 06 research is now a first-class routed LLM stage.
- Stage 06 calls `WebResearchBridge` (DuckDuckGo Instant Answer) before LLM-lite.
- Stage 06 also supports `BrowserUseResearchBridge` deep tier when `BROWSER_USE_API_KEY` is set
  and `SKEED_DEEP_RESEARCH=1`. The bridge runs a structured browser-use cloud task, parses its
  JSON output, HEAD-validates each citation against the live web, drops unreachable URLs, and
  maps the rest into `ResearchFindings`.
- Orchestrator cache keys now use deep stable JSON, so nested state changes invalidate correctly.
- Asset fallback now emits meaningful SVG artwork and alt text instead of "placeholder" assets that fail guards.
- Stage 16 now tries Unsplash, Pexels, OpenAI Image, fal, Replicate, Gemini, Open Doodles, and
  unDraw assets via `assets-router`, then falls back to programmatic artwork.
- Unsplash matching now scores by `slotType`, not `slotRole`.
- CLI `confirmGate` halts on failed Gate 1 / Gate 2 score unless `--yes` was passed.
- CLI `doctor` now reports provider, asset, research, and local-model readiness plus the
  effective fallback mode.
- `LocalLLMProvider.chat()` now disposes its session and context on every call, fixing a memory
  leak that was crashing the pipeline with `bad allocation` after a few stages.
- `llmOrFallback.fallback` accepts `() => T | Promise<T>` so stages can await disk lookups
  inside their deterministic fallback.
- Stages 01, 02, 03, 11, 12, 14 now supply a `validate` callback to `llmOrFallback`. The helper
  retries the local LLM once with a corrective system message before giving up. Validators check
  for prompt-term retention, system-prompt echo, placeholder text, demographic-evidence
  contradiction, duplicate ids/routes, missing slots, etc.
- Stage 02 fallback heuristic regex `/ai/` was matching "daily" → fixed to `\bai\b`. Productivity
  signal (focus / standup / remote work) added so the fallback can correctly route productivity
  prompts.
- Stage 03 fallback now reads `data/demographics/<demo>/pain-points/<niche>.json` via
  `@skeed/demographics-loader` before resorting to the heuristic library, so productivity / kids
  / fintech / etc. fallbacks return real, citable pain points.
- Stage 15 now generates a shared `app/components/sections.tsx` library (`Hero`, `FeatureGrid`,
  `CTASection`, `ContentCard`) and emits pages that import these via the `@/app/components/...`
  path alias. Removes inline duplication and exposes a clean editing surface for users.
- Stage 15 `smartTruncate(80, word-boundary)` replaces the hard `slice(0, 60)` that used to crop
  the home `<h1>` mid-word for long jobToBeDone strings.

## Remaining Incomplete Features (current)

| Area | Current State | Risk | Next Step |
| --- | --- | --- | --- |
| Asset variety | All 8 sources are implemented; behavior depends on which env keys are set | thin output when no keys configured | document the Unsplash/Pexels free tier as the recommended baseline; consider adding a HuggingFace Spaces-backed local image generator as a free option |
| Composition catalog reach | Stage 15 can now query the registry catalog and emit selected component source, while Stage 17 writes a local `skeed.tailwind.ts` preset with demographic typography, CTA hierarchy, and motion utilities | registry-backed generation is materially better, but quality still depends on the selected flagship coverage for each archetype | continue expanding flagship components and add screenshots for each demographic preset, especially kids, classic, gov, clinical, fintech, and marketplace |
| Fallback content | Pain points read from disk; user stories / IA / psychology still generic where no LLM is available | scaffolds without an LLM can feel safe but less specific | seed `data/demographics/<id>/{user-stories,site-map}.json` and prefer them inside the corresponding stage fallbacks |
| Local LLM grounding | Stages 01/02/03/11/12/14 carry semantic validators with retry+escalate; stages 04/07/10/13 still rely solely on schema validation | small models can produce schema-valid but shallow output for the un-validated stages | add `validate` callbacks for the score / brand / landing stages covering: composite math sanity, color contrast, archetype-fit |
| Deep research depth | `BrowserUseResearchBridge` is wired, citations are HEAD-validated | trust still hinges on the agent producing real URLs to begin with | add an offline citation-cross-check pass against a known regulator / vendor index, or a second LLM judge that scores citation relevance |
| nameless_vector fit | nameless_vector (`axiom-ai`) is a Rust + Candle semantic frame validator; not a generator. Borrowing the validation pattern is high-leverage; embedding the Rust crate inside Skeed is not | shipping the Rust crate would double the build pipeline and add 22 MB of embeddings + 20 k verb frames to the install | keep the local AI adapter on `node-llama-cpp`. Continue porting the validation patterns (state algebra, contradiction detection) into TS validators inside `llmOrFallback` |

## Nameless / Axiom Fit (revised)

`C:\dev\nameless_vector` (`axiom-ai 0.1.0`) is a research-grade Rust crate that wraps Candle ML
to provide:

- query routing (Local handle / Small model / Large model / Reject)
- semantic frame retrieval using MiniLM embeddings + 20 k verb frames
- state-algebra checks for action preconditions
- cross-domain validation adapters (code, database, medical, legal)

Practical fit for Skeed:

- it is **not a summarizer** — it validates and routes, but generates nothing. If we needed
  extractive summarization we would still have to bolt on an embed → cluster → top-k pipeline
  on top of it.
- moving the Skeed local AI adapter from `node-llama-cpp` to `axiom-ai` would mean an FFI / HTTP
  bridge between the TS pipeline and a Rust binary, plus shipping the embeddings + verb frames
  with every install. Build complexity roughly doubles; install size grows by ~30 MB.
- the high-leverage piece — "reject contradictions before returning" — is already realised in
  Skeed via the `validate` callback inside `llmOrFallback`. Stages 01/02/03/11/12/14 each carry
  a small TS validator that does the same job for the schemas Skeed actually emits.

**Verdict**: keep the local AI adapter on `node-llama-cpp`. Borrow patterns from
nameless_vector, not bytes.

## How to enable each tier

| Tier | Env / flag | Effect |
| --- | --- | --- |
| Provider LLM | `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `GOOGLE_API_KEY` / `DEEPSEEK_API_KEY` / `GROQ_API_KEY` / `MOONSHOT_API_KEY` / `DASHSCOPE_API_KEY` / `OPENROUTER_API_KEY` | Routed through `@skeed/llm-router` per stage |
| Local LLM | `~/.skeed/models/qwen2.5-0.5b-instruct-q4_k_m.gguf` (downloaded by CLI) | Constrained JSON via `node-llama-cpp` |
| Deterministic | nothing set | Demographic-aware heuristics inside each stage |
| Web research | always on | DuckDuckGo Instant Answer (free) |
| Deep research | `BROWSER_USE_API_KEY` + `SKEED_DEEP_RESEARCH=1` | browser-use cloud agent task with HEAD-validated citations |
| Approval gates | drop `--yes` flag in CLI | Halts on Gate 1 / Gate 2 failures |

## Verified end-to-end (2026-05-02)

Prompt: `A focus timer for remote workers with daily standup notes`

| Path | Result |
| --- | --- |
| Qwen 2.5 0.5B local + deterministic fallbacks | 19 files. Validators caught Qwen drift on 01/02/07/11/14, fell to deterministic. Demographic = `productivity/general`. `next build` 0E 0W. |
| DeepSeek API end-to-end | 22 files. Demographic = `productivity/remote_work_focus_tracker`, IA = Home/Focus/Standup/History/Settings, backend = nextauth+supabase+anthropic-ai-sdk. `app/components/sections.tsx` shared library imported by every page. `next build` 0E 0W. |
