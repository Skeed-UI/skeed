# Skeed — MCP-Native Demographic Design System Builder

## Context

**Why this exists.** Generic AI builders (v0, Bolt, Lovable) ship one neutral aesthetic dressed up with prompt-driven CSS tweaks. They have no real concept of *who* the app is for, never validate the idea, and ship empty-shell apps with placeholder text + lorem ipsum imagery. Skeed inverts that:

- **Validates the idea before building it** (two scoring gates, with optional deep research powered by AutoResearchClaw between them).
- **Curated catalog of UI components** carrying explicit AI-readable demographic + psychology metadata, served via MCP.
- **NL→design-system pipeline** that classifies a prompt's target audience, produces a coherent design system tuned to that demographic, and assembles a runnable scaffold.
- **Brand + asset generation** — SVG-native logos, AI-generated illustrations, stock imagery — all demographic-aware.
- **Lands on user-approved landing page** before main app emission.

### End-to-end user flow

```
1. Prompt: "Build an app that does x, y, z"
2. Clarify demographic + niche       (skip if confidence ≥ 0.75 + gap ≥ 0.2)
3. Clarify pain points + JTBD
4. Score Level 1 (rubric, fast)      ──┐
                                       │  Score low?
5. Feedback to user                  ◄─┤  → user decides pivot vs persist
                                       └─ persist?
6. Deep Research (AutoResearchClaw)     market+demo+regulatory+infra+tech
7. Synthesize research + Score Level 2
8. Gate: user approves direction (or pivots based on findings)
9. Brand & Logo synthesis (SVG-native, demographic-tuned, 3-4 candidates)
10. Design system synthesis           (palette/type/scale/motion/voice)
11. User stories generation           (per persona, prioritized)
12. 2-3 landing page candidates       full visual designs, user picks one
13. Information architecture          sitemap + nav pattern (rule-based)
14. Component selection + composition (MCP search + per-page picker)
15. Asset population                  illustrations (AI), imagery (stock/AI), avatars
16. Scaffold emission                 Next.js manifest written by host
```

### Locked product decisions (from clarification rounds)

- **Framework**: React + Next.js only. Schema reserves `frameworks[]` for v2.
- **Delivery surfaces**: MCP server, `skeed` CLI, Tauri desktop app. (No Web Studio / IDE extensions at v1.)
- **Catalog scope**: full 20 demographics × 60 archetypes × 3 densities ≈ 3,600. Achieved by codegen.
- **LLM**: provider-agnostic via Vercel AI SDK (Anthropic + OpenAI + Gemini) with portable prompt-cache layer.
- **Distribution to user apps**: scoped npm packages (`@skeed/kids`, `@skeed/fintech`, …). Apps `import`, not vendor-copy.
- **Clarification UX**: ambiguity-only (skip when classifier confidence ≥ 0.75, gap ≥ 0.2).
- **AAA-strict ethics gates**: kids/education, health/hospital, government/civic, mental wellness.
- **AutoResearchClaw**: external MCP/API call, black-box service. Repo: [aiming-lab/AutoResearchClaw](https://github.com/aiming-lab/AutoResearchClaw).
- **Logos**: SVG-native programmatic (composed from primitives + typography per demographic style).
- **Imagery**: hybrid — AI generation (Flux/SDXL/Imagen via fal.ai or replicate) for hero/marketing, stock (Unsplash/Pexels/Open Doodles/unDraw) for avatars/content.
- **Deep research scope**: market & competitor, demographic deep-dive, regulatory & compliance, infrastructure readiness, technical feasibility.

---

## High-level architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  Tauri Desktop App  /  CLI  /  External MCP Hosts (Claude Code)     │
└────────────────┬───────────────────────────┬────────────────────────┘
                 │                           │
   ┌─────────────▼─────────────┐    ┌────────▼─────────────┐
   │  Pipeline Engine          │    │   MCP Server         │
   │  17-stage DAG             │◄───┤   search/get/list    │
   └──┬─────────┬───────────┬──┘    └────────┬─────────────┘
      │         │           │                │
      │  ┌──────▼──────┐    │       ┌────────▼────────────┐
      │  │ Idea Scorer │    │       │  Catalog Index      │
      │  │ L1 + L2     │    │       │  sqlite + vss + FTS │
      │  └─────────────┘    │       └────────┬────────────┘
      │                     │                │
      │  ┌──────────────────▼────────┐  ┌────▼─────────────┐
      │  │ AutoResearchClaw Bridge   │  │ Component Repo   │
      │  │ (external MCP client)     │  │ archetypes ×     │
      │  └───────────────────────────┘  │ presets (codegen)│
      │                                 └──────────────────┘
      │  ┌──────────────────────────┐
      │  │ Asset Layer              │     ┌──────────────────┐
      │  │ ┌──────┐ ┌────┐ ┌──────┐ │     │  Guardrail       │
      │  │ │ SVG  │ │ AI │ │Stock │ │     │  Module          │
      │  │ │Logo  │ │Gen │ │ API  │ │     │  WCAG/PII/ethics │
      │  │ └──────┘ └────┘ └──────┘ │     └──────────────────┘
      │  └──────────────────────────┘
      ▼
   Landing Options Generator (2-3 candidates per run)
```

---

## Pipeline — 17-stage DAG (revised)

| # | Stage | Type | LLM | Notes |
|---|---|---|---|---|
| 1 | Intent Extraction | LLM | yes | Tool-use, low temp 0.2 |
| 2 | Demographic & Niche Classification | LLM | yes | Top-3, clarify if confidence < 0.75 or gap < 0.2 |
| 3 | Pain-Point Probing | LLM | yes | Extracts/clarifies the user's pain points + JTBD |
| 4 | Idea Score Level 1 | hybrid | yes | Fast rubric (5 axes, see §Scoring) |
| 5 | Score Gate 1 | UI | — | If score < threshold, surface feedback; user picks pivot vs persist |
| 6 | Deep Research (AutoResearchClaw) | external | — | MCP/HTTP call, ~5-min runtime, returns structured findings |
| 7 | Research Synthesis + Idea Score Level 2 | LLM | yes | Adjusts score with research findings |
| 8 | Score Gate 2 | UI | — | User approves final direction |
| 9 | Persona & Psychology Derivation | deterministic | no | Lookup `presets/psychology/<demo>/<niche>.json` |
| 10 | Brand & Logo Synthesis | hybrid | yes | LLM picks brand attributes; SVG composer emits 3-4 logo candidates |
| 11 | Design System Synthesis | hybrid | partial | Preset resolve + brand color override + naming sub-call. Contrast auto-fix deterministic. |
| 12 | User Stories Generation | LLM | yes | Per persona, prioritized backlog |
| 13 | Landing Page Candidates | hybrid | yes | 2-3 distinct compositions; user picks one |
| 14 | Information Architecture | LLM | yes | Sitemap; nav pattern rule-based |
| 15 | Component Selection + Composition | LLM | yes | MCP search per page, layout DSL → TSX |
| 16 | Asset Population | mixed | partial | Logo already done; illustrations (AI) + imagery (stock/AI) + avatars sourced now |
| 17 | Scaffold Emission | deterministic | no | Templated Next.js manifest |

### Stage details

**Stage 3 — Pain-Point Probing.** LLM call extracts implicit pain points from the prompt and from Stage 2 outputs (demographic + niche signals → known pain-point library lookup). When fewer than 2 pain points surface, asks ≤2 multiple-choice clarifications from `PainPointTemplate` library (e.g. "What's the biggest frustration today?" with demographic-conditioned options). Output: `PainPoint[]` with severity 1–5 and frequency 1–5.

**Stages 4 & 7 — Idea Scoring (see §Idea Scoring System below).**

**Stage 6 — Deep Research via AutoResearchClaw.** Skeed's `research-bridge` package wraps AutoResearchClaw as an MCP client (or HTTP if its API is more convenient). Skeed sends a `ResearchBrief` `{idea, demographic, niche, painPoints, scope: ["market", "demographic", "regulatory", "infra", "tech"]}` and awaits structured `ResearchFindings`. Long-running (~3–10 min); pipeline streams stage progress to UI. Findings cached by content hash so re-runs of identical briefs are free.

**Stage 10 — Brand & Logo Synthesis.** Two sub-stages:
- **10a (LLM)** picks `BrandAttributes` from psychology profile + research findings: `{primary_hue, secondary_hue, mood_keywords[], visual_metaphors[], wordmark_style, symbol_archetype}`. Schema-bounded.
- **10b (deterministic)** SVG composer assembles 3-4 candidate logos from a primitive library (`shapes/`, `marks/`, `wordmarks/`, `containers/`) using attributes as inputs. Each candidate is a different `(symbol_archetype × layout)` combination. SVG output is editable, accessible, scales clean.

**Stage 13 — Landing Page Candidates.** Picks 2–3 distinct landing-page archetypes from catalog (e.g. hero-led, story-led, conversion-focused), each rendered with the locked design system, generated logo, and a sample of generated illustrations. User picks one in the Tauri UI; pick is fed to Stage 14 to anchor IA.

**Stage 16 — Asset Population.** Per page in the chosen IA, the asset router (`packages/assets/router.ts`) walks slot requirements:
- **Logo slot** → already-chosen Stage 10b output
- **Hero illustration / marketing imagery** → AI generation via fal.ai/replicate (Flux/SDXL), prompted with demographic style suffix
- **Avatars / placeholder photography** → stock (Unsplash/Pexels API) tagged by demographic
- **Decorative illustrations** → Open Doodles / unDraw (CC-licensed, demographic-fit)

All assets cached in `.skeed/assets/<run_id>/`, written into the scaffold's `public/` at Stage 17.

---

## Idea Scoring System

`packages/scoring/` — small dedicated package.

### Level 1 rubric (fast, pre-research)

5 axes, each scored 0–10 by LLM judge against a calibrated rubric:

| Axis | What's measured |
|---|---|
| **Clarity** | Is the idea sharply defined? JTBD, primary user, success signal all present? |
| **Demographic fit** | Does the proposed demographic align with the JTBD's natural audience? |
| **Differentiation** | Is there a non-obvious angle vs incumbents the LLM knows about? |
| **Feasibility (surface)** | Buildable as an app at all? Or is it a service/hardware/regulated activity? |
| **Pain-point severity** | Is the pain real and frequent enough to warrant a product? |

Composite = weighted average. Default threshold to pass: **6.5/10**. Below threshold → feedback (per-axis improvements suggested). User can pivot, accept feedback, or persist into deep research.

### Level 2 rubric (post-research)

Same 5 axes, plus 4 research-informed axes:

| Axis | What's measured |
|---|---|
| **Market opportunity** | TAM/SAM signals from research; saturation; growth trajectory |
| **Regulatory load** | COPPA/GDPR/HIPAA/PCI/Section 508 burden; jurisdictional friction |
| **Infrastructure readiness** | Do the APIs/models/services to power it exist today? |
| **Build complexity** | Solo-builder feasibility based on tech-feasibility findings |

9-axis composite. Threshold to pass: **7/10**. Below → user pivots.

### Output

`IdeaScore` with per-axis scores, reasoning per axis, and aggregated `recommendations[]` (concrete prompt edits the user could make to lift the weak axes).

---

## Asset Layer

`packages/assets/` — unified asset router + three source adapters.

### Sources

**`assets/logo/svg-composer.ts`** — programmatic SVG logo generator.
- Primitive libraries: `shapes/` (geometric), `marks/` (mascots, monograms, symbols), `wordmarks/` (typographic styles per demographic), `containers/` (badge, lockup, stacked, horizontal).
- Composer takes `BrandAttributes + DemographicPreset` and emits 3-4 SVG candidates.
- Per-demographic style guides constrain primitive choice (e.g. kids → only rounded marks + chunky sans wordmarks; gov → only flat marks + serif wordmarks).
- Output: `LogoCandidate[]` with SVG source + accessibility metadata + favicon variants pre-rendered.

**`assets/imagery/ai/`** — AI image generation client.
- Adapter pattern: `fal.ts` (fal.ai), `replicate.ts` (Replicate), `openai.ts` (DALL-E 3 / gpt-image), `gemini.ts` (Imagen).
- User configures provider + API key in `skeed.config.json`. Default provider: fal.ai with Flux Schnell (cheap, fast).
- Each demographic preset includes `illustration_style_prompt` suffix (e.g. kids: "rounded chunky cartoon, soft pastel palette, friendly mascot, plain background"; gov: "minimal flat illustration, neutral palette, no faces, professional").
- Cost-bounded: hard cap 8 generations per scaffold run by default, configurable.
- Output: `GeneratedAsset[]` with PNG/WebP files + alt text (LLM-generated) + license note.

**`assets/imagery/stock/`** — stock/CC-licensed library client.
- Adapters: `unsplash.ts`, `pexels.ts`, `open-doodles.ts` (local), `undraw.ts` (local catalog).
- Demographic-tagged search queries (kids → "diverse children playing", fintech → "modern banking interface").
- Open Doodles + unDraw bundled locally (~5 MB each), no API call.

### Router

**`assets/router.ts`** — single decision function `route(slot, demographic) → AssetRequest`:
- Logo slots → SVG composer (no choice; always generate)
- Hero / marketing imagery → AI gen (high-impact, differentiated)
- Decorative illustrations → Open Doodles or unDraw (cheap, on-brand)
- Avatars / generic content photography → Unsplash/Pexels (real photography)
- Icons → preset iconography pack (no separate fetch — already bundled in `@skeed/<demo>`)

Router is configurable per project — power users can bias toward AI for everything or stock for everything.

---

## AutoResearchClaw Integration

`packages/research-bridge/` — black-box client.

**Approach.** AutoResearchClaw is academic-research-focused (paper generation), but its 23-stage pipeline + multi-agent debate + arXiv/Semantic Scholar retrieval is reusable for product research with a different prompt template. Skeed wraps it via:

- **MCP transport** preferred — spawn AutoResearchClaw's MCP server, send structured brief over stdio. (If AutoResearchClaw lacks MCP, fall back to its CLI: `researchclaw run --topic ...`, parse output files.)
- **Brief template** (`packages/research-bridge/src/briefs/product-research.md`) — coerces AutoResearchClaw's academic output into product-research findings: market scan, competitor table, regulatory checklist, infra availability, technical feasibility report. Structure derived empirically by running the academic pipeline and templating the prompt to bias toward product framing.
- **Findings normalizer** (`packages/research-bridge/src/normalize.ts`) — parses AutoResearchClaw output (likely markdown + JSON) into Skeed's `ResearchFindings` schema.
- **Caching** by content-hash of the brief — re-runs are free.
- **Cost guard** — hard timeout (15 min default) and budget guard (token usage threshold). Failures degrade gracefully: pipeline proceeds with Stage 7 using only Stage 4 findings; user sees a warning that research was skipped.

**Fallback**: if the user lacks AutoResearchClaw or it errors, `research-bridge` has a built-in "lite mode" that runs a smaller research loop using web search + LLM synthesis (similar to dzhng/deep-research pattern) — degraded but functional.

---

## Subsystem 1 — UI Component System

### Adapt vs build (locked)

| Layer | Decision | Rationale |
|---|---|---|
| Registry schema | **Fork shadcn** + extend with `meta.demographics`, `meta.psychology_signals`, `meta.accessibility` | Preserve CLI compatibility, semantic metadata in `meta` extension point |
| MCP server | **Build** on `@modelcontextprotocol/sdk-typescript` | Need demographic-aware retrieval + psychology reranker |
| Token engine | **Adapt** Style Dictionary + DTCG JSON. Optional Material 3 Monet for brand→palette | Mature codegen, multi-target output |
| Code scaffolding | **Adapt** shadcn CLI surface, internally drive Plop templates | Familiar UX, programmatic flexibility |
| Research engine | **External** AutoResearchClaw via MCP/CLI bridge | Don't duplicate a 23-stage pipeline |

### Metadata schema (canonical)

`packages/registry-schema/src/component.ts` — Zod schema for `ComponentManifest`. Required fields:

- `id` (e.g. `kids/onboarding-hero/balloon`), `name`, `version` (semver per component)
- `category`: `atom | molecule | organism | template | block | page`
- `demographics: {id, weight}[]` — closed enum of 20 + open `tags[]` for long-tail
- `keywords[]`, `ai_intent_phrases[]`, `example_intents[]`, `anti_patterns[]`
- `psychology_signals`: `{color_temp, density, formality(0-4), motion_intensity, contrast, playfulness(0-4), trust_cues[]}`
- `accessibility`: `{wcag_level, age_appropriate{min,max}, cognitive_load, reduced_motion_safe, screen_reader_tested}`
- `variants[]`, `dependencies[]`, `registryDependencies[]`, `frameworks[]`
- `tokens_used[]` (semantic refs only)
- `asset_slots[]`: declares which assets this component needs and their type (`logo | hero_illustration | content_photo | decorative | icon | avatar`) — drives Stage 16 routing
- `conversion_psychology[]`, `license`, `attribution{source,url}`, `source[]`, `preview{thumb,storybook_url}`

### Catalog production strategy

**Math.** 60 archetypes × 20 demographics × 3 densities = 3,600 generated entries + ~200 hand-crafted demographic-only specials.

**Three-tier production**:
1. **Bootstrap (manual, ~300 sources)** — import shadcn + 21st.dev + magicui + aceternity into archetype form, rewriting through token API. License/attribution preserved.
2. **Generative (codegen, ~3,400)** — `archetypes × presets × densities` cross product. Authoring stays linear.
3. **Hand-crafted specials (~200)** — true demographic originals (Kids mascot card, Gov FOIA form, Military HUD overlay).

**Anti-bloat enforcement**: `eslint-plugin-skeed/no-literal-tokens` bans hex/px/rem in archetype source.

### Quality gates (CI per PR)

- Manifest JSON Schema validation
- Playwright visual regression vs golden thumbnails
- `axe-core` a11y at stated `wcag_level`
- Bundle-size budget per category
- Dead-token scan
- Curator approval label `curator/approved`
- AAA-strict demographics get **two-curator SLA** + `@skeed/ethics-lint`

### Storage & retrieval

- **Source-of-truth**: `*.skeed.tsx` + sibling `*.skeed.json` manifest
- **Index**: SQLite + `sqlite-vss` (vector) + FTS5 (lexical), built from repo on every CI, shipped as artifact alongside MCP server
- **Local embedding model bundled** (`bge-small-en` ~100 MB) — eliminates OpenAI key requirement. Catalog embedded at build time.
- **Hybrid retrieval**: hard filters first → vector rank → psychology-signal reranker.

### MCP tool surface

```
search_components({ intent, demographic?, category?, density?, framework?, limit=10 })
get_component(id, { framework? })
resolve_dependencies(id)
list_demographics()  list_archetypes()  get_preset(demographic)
classify_prompt_intent(prompt)            // for external hosts
score_idea_l1(idea, demographic, niche)   // exposed for external hosts (e.g. Claude Code)
get_research_findings(brief)              // proxies to research-bridge
generate_logo_candidates(brand_attrs, demographic)
```

`search_components` returns 200-token summaries only; full TSX fetched lazily via `get_component`.

### Demographic preset & token system

`packages/demographics/src/<id>.ts` — 20 `DemographicPreset` definitions: palette (with WCAG-validated `contrastPairs[]`), typography (display/body/mono/numeric stacks + scale), spacing/radius, density, motion (profile/durations/easings), iconography (style + pack), borders, elevation, **+ `illustration_style_prompt` suffix and `logo_primitive_constraints` for asset layer**.

**Component composition**: archetype TSX writes against semantic tokens (`bg-surface text-on-surface rounded-radius-md p-density-y-md`). Tailwind plugin + CSS-vars layer maps `(archetypeTSX, preset)` → final CSS.

### npm distribution

- `@skeed/kids`, `@skeed/fintech`, `@skeed/gov`, … (one per demographic)
- Plus shared `@skeed/core` (tokens, transformer, primitives)
- Pre-built CSS bundles per density
- Treeshaking via per-component subpath exports (`@skeed/kids/button`)
- Generated user apps `import` rather than vendor-copy

---

## LLM Guardrail / Compliance Module

`packages/guards/` — deterministic, fail-closed. Runs after Stage 15 (composition), before Stage 17 (emission).

**Hard guards (always)**:
- Every component ID must exist in catalog
- Every Tailwind class must reference a defined token
- Contrast ratio ≥ floor (AA = 4.5, AAA = 7); auto-darken/lighten until pass; refuse to ship if unfixable
- `prefers-reduced-motion` honored; `AAA-motor` floor caps duration ≤ 200 ms, no parallax
- Generated logos and assets must pass alt-text + a11y metadata checks
- AI-generated images checked for embedded text rendering errors (heuristic OCR vs prompt)

**Per-demographic forbidden patterns (AAA-strict)**:
- **Kids/education**: no autoplay AV, no infinite scroll, no urgency timers, no targeted-ad patterns, no dark patterns. COPPA / UK Age-Appropriate Design Code aligned.
- **Health/hospital**: no PII in URLs, localStorage, or analytics events. HIPAA-adjacent.
- **Gov/civic**: plain-language voice tokens enforced, WCAG 2.1 AA mandatory. Section 508 / EU EN 301 549.
- **Mental wellness**: no notification spam, no fake-scarcity, no streak-shame. Reduced motion default.

**Self-critique pass**: 7-criterion judge rubric. Hard cap: 1 critique-regen cycle per stage to bound cost.

---

## Existing OSS Comparator

`scripts/comparator/` — automated benchmark per release.

For each prompt in `test/fixtures/prompts.json`:
1. Run Skeed full pipeline → capture scaffold + assets + landing page
2. Run v0/Bolt/Lovable (where API; else manual) → capture
3. Score both on 7-criterion rubric + demographic-fit + asset-quality scores
4. Emit comparison report (markdown + screenshots side-by-side)

---

## Repo / monorepo structure (OSS-grade)

### Design principles

This is a project that needs heavy OSS contribution from people who only care about a slice (one demographic, one asset adapter, one stage). The structure must:

1. **Single-file-add wins.** Adding a new demographic, archetype, asset adapter, or LLM provider is a single PR touching exactly one folder. No "register here, then there, then there".
2. **Dataless code, codeless data.** All TS code lives in `packages/`; all data (presets, components, primitives) lives in `data/` directories with **no executable code**, only JSON / TSX-as-data with strict schemas. Contributors who only write JSON never need to read TS.
3. **Stable extension contracts.** Every plugin point (demographic, asset source, LLM provider, score rubric) is a plain interface in `@skeed/contracts`. Internal core changes never break community plugins.
4. **One package = one purpose.** No "utils" or "common" packages. Every package has a one-sentence reason to exist; if not, fold it.
5. **Convention over registration.** The build walks well-known directories (`data/components/<demo>/<archetype>/<density>/`) and auto-registers contents. Contributors don't edit indices.
6. **Test fixtures live with the code they test.** Each package has `test/`, no central test silo.

### Top-level layout

```
skeed/
├── packages/                  # All TypeScript source. One package = one purpose.
│   ├── contracts/             # @skeed/contracts: every interface, type, Zod schema. No logic.
│   ├── core/                  # @skeed/core: tokens API, transformer, cn(), pure functions.
│   ├── demographics-loader/   # Walks data/demographics/, validates, exposes lookup
│   ├── archetypes-loader/     # Walks data/archetypes/, validates, exposes lookup
│   ├── components-loader/     # Walks data/components/, validates, exposes search
│   ├── indexer/               # Builds sqlite + vss + fts from loaders. Pure builder.
│   ├── mcp-server/            # @skeed/mcp-server: protocol impl, tool registration
│   ├── pipeline/              # @skeed/pipeline: 17-stage DAG, contracts, prompts
│   ├── scoring/               # L1/L2 rubrics + LLM judge
│   ├── research-bridge/       # AutoResearchClaw client + lite fallback
│   ├── assets-router/         # Slot → source decision (no adapters; just routing)
│   ├── asset-logo-svg/        # SVG-native logo composer
│   ├── asset-source-fal/      # AI gen via fal.ai          (one adapter = one package)
│   ├── asset-source-replicate/
│   ├── asset-source-openai-image/
│   ├── asset-source-gemini-image/
│   ├── asset-source-unsplash/
│   ├── asset-source-pexels/
│   ├── asset-source-open-doodles/   # Bundles CC0 SVGs as data
│   ├── asset-source-undraw/         # Bundles undraw SVGs as data
│   ├── llm-provider-anthropic/      # Vercel AI SDK adapter — Anthropic
│   ├── llm-provider-openai/
│   ├── llm-provider-google/
│   ├── llm-provider-ollama/         # Local fallback
│   ├── llm-cache/             # Provider-agnostic prompt-cache layer
│   ├── landing-options/       # 2-3 landing page candidate generator
│   ├── guards/                # Deterministic guardrails + ethics-lint
│   ├── eslint-plugin-skeed/   # Bans literal tokens, enforces ethics in archetypes
│   ├── cli/                   # @skeed/cli: skeed binary (init/add/update/serve)
│   └── npm-skeed-<demo>/      # Per-demographic generated publishable packages (×20)
│
├── data/                      # All project data. JSON, TSX, SVG. Contributor sweet spot.
│   ├── demographics/          # ONE FILE/FOLDER PER DEMOGRAPHIC
│   │   └── <demo>/            # e.g. kids/, fintech/, gov/
│   │       ├── preset.json    # DemographicPreset (palette, typography, motion, ...)
│   │       ├── psychology/    # <niche>.json files (one per niche)
│   │       ├── pain-points/   # <niche>.json files
│   │       ├── illustration-style.json    # AI-gen prompt suffix
│   │       ├── logo-primitives/           # SVG library for SVG composer
│   │       │   ├── shapes/
│   │       │   ├── marks/
│   │       │   ├── wordmarks/
│   │       │   └── containers/
│   │       ├── owners.md      # Maintainer list for this demographic
│   │       └── README.md      # Reference, sources, design rationale
│   │
│   ├── archetypes/            # ONE FILE PER ARCHETYPE
│   │   └── <archetype>.archetype.tsx  # token-only TSX + sibling .json with metadata
│   │
│   ├── components/            # GENERATED + curated. Auto-walked.
│   │   └── <demo>/<archetype>/<density>/<variant>/
│   │       ├── component.skeed.tsx
│   │       └── manifest.skeed.json
│   │
│   ├── icons/                 # Iconography packs
│   │   └── <pack-id>/
│   │
│   ├── prompts/               # Versioned LLM prompt templates (per stage)
│   │   └── stages/<stage>/<version>.md
│   │
│   ├── rubrics/               # Scoring rubrics (versioned)
│   │   ├── score-l1/<version>.json
│   │   └── score-l2/<version>.json
│   │
│   ├── ambiguity-templates/   # Clarification question library
│   ├── pain-point-templates/
│   └── registry-versions/<semver>.json    # Frozen registry snapshots
│
├── apps/
│   └── desktop/               # Tauri app (full pipeline UI, curator review, scaffold writer)
│
├── scripts/                   # Repo-level tooling. No runtime imports allowed from packages.
│   ├── codegen/               # generate-variants, thumbnailer, package-publisher
│   ├── visual-regression/     # Playwright + Loki harness
│   ├── a11y-audit/            # axe-core runner
│   ├── comparator/            # OSS benchmark vs v0/Bolt/Lovable
│   ├── new-demographic/       # Bootstrap a new data/demographics/<demo>/ skeleton
│   ├── new-asset-source/      # Bootstrap a new packages/asset-source-<name>/ skeleton
│   └── lint-data/             # Runs all data/ validators in CI
│
├── test/
│   └── fixtures/
│       ├── prompts.json       # Golden inputs incl. email automation example
│       └── research/          # Cached AutoResearchClaw outputs for offline E2E
│
├── docs/                      # OSS-facing docs site (Astro Starlight or similar)
│   ├── contributing/
│   │   ├── add-a-demographic.md
│   │   ├── add-an-archetype.md
│   │   ├── add-an-asset-source.md
│   │   ├── add-an-llm-provider.md
│   │   └── data-validation-rules.md
│   ├── architecture/
│   ├── plugin-api/            # Auto-generated from @skeed/contracts
│   └── decision-records/      # ADRs
│
├── .github/
│   ├── CODEOWNERS             # Per-demographic owners + per-package owners
│   ├── ISSUE_TEMPLATE/        # Bug, demographic-request, archetype-request, plugin-proposal
│   ├── PULL_REQUEST_TEMPLATE/ # Per-change-type templates
│   └── workflows/             # CI: validate-data, build, test, visual-regression, a11y, publish
│
├── CONTRIBUTING.md
├── GOVERNANCE.md              # Decision-making, RFC process, maintainer roles
├── LICENSE                    # MIT for code; per-component licenses preserved in data/
├── README.md
├── pnpm-workspace.yaml
├── turbo.json
├── biome.json
└── package.json
```

### What "single-file-add" means in practice

| To add a... | Touch only |
|---|---|
| **New demographic** | `data/demographics/<demo>/` folder (preset + at least one psychology niche + at least one logo-primitive set) |
| **New niche under existing demographic** | `data/demographics/<demo>/psychology/<niche>.json` + `data/demographics/<demo>/pain-points/<niche>.json` |
| **New archetype** | `data/archetypes/<archetype>.archetype.tsx` + sibling `.json` |
| **New component (curated, hand-crafted)** | `data/components/<demo>/<archetype>/<density>/<variant>/` folder |
| **New AI image source** | New `packages/asset-source-<name>/` package implementing `AssetSource` from `@skeed/contracts` |
| **New LLM provider** | New `packages/llm-provider-<name>/` package implementing `LLMProvider` interface |
| **New scoring rubric version** | `data/rubrics/score-l1/<version>.json` (rubrics are versioned, never edited in place) |
| **New prompt for an existing stage** | `data/prompts/stages/<stage>/<version>.md` |
| **New ambiguity-template** | `data/ambiguity-templates/<key>.json` |

No code changes outside the listed paths. Loaders walk the data tree; everything else flows.

---

## Database architecture

### Storage tiers

Skeed uses three distinct storage tiers, each with a clear owner and lifecycle.

```
TIER 1 — SOURCE OF TRUTH
  Filesystem under data/  (committed to git)
  Owners: contributors. Format: JSON, TSX, SVG, MD.
  No DB. Plain text reviewable in PRs.

TIER 2 — BUILT INDEX (read-only, regenerated)
  SQLite file: dist/registry-<semver>.db   (built by CI from Tier 1)
  Distributed inside @skeed/mcp-server npm package.
  Owners: build pipeline. Never edited by hand. Reproducible from Tier 1.

TIER 3 — RUNTIME STATE (per-machine, per-project)
  SQLite files in user's machine: ~/.skeed/cache.db
                                  <user-project>/.skeed/run.db
  Owners: pipeline runtime. Ephemeral, throwaway, regeneratable.
```

### Tier 1 — `data/` source of truth

- Plain files in git. Each file is a self-describing artifact validated by a Zod schema in `@skeed/contracts`.
- A single CI job `scripts/lint-data/` walks `data/` and validates every file against its schema. Fails the build on any violation.
- File naming is the registry — you don't register an item, you put the file in the right path. The loader reconstructs the catalog from disk on every build.
- License + attribution on every file via frontmatter (TSX/MD) or top-level field (JSON).

### Tier 2 — Built index (SQLite + sqlite-vss + FTS5)

`packages/indexer` produces `dist/registry-<semver>.db` from Tier 1. The DB ships inside `@skeed/mcp-server`. Read-only at runtime.

**Schema**:

```sql
-- Catalog of demographics, archetypes, components, assets
CREATE TABLE demographics (
  id TEXT PRIMARY KEY,                -- "kids", "fintech", "gov", ...
  preset_json TEXT NOT NULL,          -- DemographicPreset serialized
  source_path TEXT NOT NULL,          -- data/demographics/<id>/preset.json
  content_hash TEXT NOT NULL          -- sha256 of preset_json for cache keying
);

CREATE TABLE psychology_profiles (
  demographic_id TEXT NOT NULL,
  niche TEXT NOT NULL,
  profile_json TEXT NOT NULL,
  PRIMARY KEY (demographic_id, niche),
  FOREIGN KEY (demographic_id) REFERENCES demographics(id)
);

CREATE TABLE pain_points (
  demographic_id TEXT NOT NULL,
  niche TEXT NOT NULL,
  point_id TEXT NOT NULL,
  point_json TEXT NOT NULL,
  PRIMARY KEY (demographic_id, niche, point_id)
);

CREATE TABLE archetypes (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,             -- atom|molecule|organism|...
  manifest_json TEXT NOT NULL,
  source_path TEXT NOT NULL
);

CREATE TABLE components (
  id TEXT PRIMARY KEY,                -- "kids/onboarding-hero/balloon"
  archetype_id TEXT NOT NULL,
  demographic_id TEXT NOT NULL,
  density TEXT NOT NULL,
  manifest_json TEXT NOT NULL,
  source_tsx_path TEXT NOT NULL,
  thumb_path TEXT,
  category TEXT NOT NULL,
  wcag_level TEXT NOT NULL,
  age_min INTEGER, age_max INTEGER,
  cognitive_load TEXT NOT NULL,
  reduced_motion_safe INTEGER NOT NULL,
  framework TEXT NOT NULL,
  license TEXT NOT NULL,
  attribution_source TEXT,
  attribution_url TEXT,
  content_hash TEXT NOT NULL,
  registry_version TEXT NOT NULL,
  FOREIGN KEY (archetype_id) REFERENCES archetypes(id),
  FOREIGN KEY (demographic_id) REFERENCES demographics(id)
);
CREATE INDEX idx_components_demo ON components(demographic_id);
CREATE INDEX idx_components_arch ON components(archetype_id);
CREATE INDEX idx_components_cat ON components(category);
CREATE INDEX idx_components_density ON components(density);
CREATE INDEX idx_components_wcag ON components(wcag_level);

-- Junction table for many-to-many demographic weights
CREATE TABLE component_demographics (
  component_id TEXT NOT NULL,
  demographic_id TEXT NOT NULL,
  weight REAL NOT NULL,
  PRIMARY KEY (component_id, demographic_id)
);

-- Tags (psychology signals, conversion psychology, trust cues, anti-patterns)
-- One table per category to keep filtering fast
CREATE TABLE component_psychology_signals (
  component_id TEXT NOT NULL, key TEXT NOT NULL, value TEXT NOT NULL,
  PRIMARY KEY (component_id, key)
);
CREATE TABLE component_trust_cues (
  component_id TEXT NOT NULL, cue TEXT NOT NULL,
  PRIMARY KEY (component_id, cue)
);
CREATE TABLE component_anti_patterns (
  component_id TEXT NOT NULL, demographic_id TEXT NOT NULL,
  PRIMARY KEY (component_id, demographic_id)
);
CREATE TABLE component_asset_slots (
  component_id TEXT NOT NULL, slot_role TEXT NOT NULL, slot_type TEXT NOT NULL,
  PRIMARY KEY (component_id, slot_role)
);

-- Vector index (sqlite-vss) over name + keywords + ai_intent_phrases + example_intents
CREATE VIRTUAL TABLE component_vss USING vss0(
  embedding(384)                    -- bge-small-en dimension
);
CREATE TABLE component_vss_map (
  rowid INTEGER PRIMARY KEY,
  component_id TEXT UNIQUE NOT NULL,
  embedding_model TEXT NOT NULL     -- pinned model id, e.g. "bge-small-en-v1.5"
);

-- FTS5 lexical index for keyword search
CREATE VIRTUAL TABLE component_fts USING fts5(
  component_id UNINDEXED,
  name, keywords, ai_intent_phrases, example_intents,
  tokenize='porter'
);

-- Logo primitives index (for SVG composer)
CREATE TABLE logo_primitives (
  id TEXT PRIMARY KEY,
  demographic_id TEXT NOT NULL,
  kind TEXT NOT NULL,               -- shape|mark|wordmark|container
  svg_path TEXT NOT NULL,
  attrs_json TEXT NOT NULL          -- compatibility constraints
);

-- Iconography packs
CREATE TABLE icon_packs (
  id TEXT PRIMARY KEY, style TEXT NOT NULL, count INTEGER NOT NULL, base_path TEXT NOT NULL
);

-- Build provenance
CREATE TABLE build_meta (
  registry_version TEXT PRIMARY KEY,
  built_at TEXT NOT NULL,
  built_from_commit TEXT NOT NULL,
  embedding_model TEXT NOT NULL,
  schema_version INTEGER NOT NULL
);
```

**Schema migrations**: `packages/indexer/migrations/<NNNN>_<name>.sql`. Versioned. CI applies them in order on a fresh build. The shipped DB always represents the head of migrations for that registry version.

### Tier 3 — Runtime state

Two SQLite files at runtime:

**`~/.skeed/cache.db`** — global, shared across projects on the same machine:

```sql
CREATE TABLE llm_cache (
  cache_key TEXT PRIMARY KEY,        -- sha256(stageVersion + canonical(input) + modelId + promptVersion + catalogVersion + provider)
  stage TEXT NOT NULL,
  provider TEXT NOT NULL,
  response_json TEXT NOT NULL,
  token_in INTEGER, token_out INTEGER,
  created_at TEXT NOT NULL,
  hit_count INTEGER NOT NULL DEFAULT 0,
  last_hit_at TEXT
);
CREATE INDEX idx_llm_cache_stage ON llm_cache(stage);
CREATE INDEX idx_llm_cache_created ON llm_cache(created_at);

CREATE TABLE research_cache (
  brief_hash TEXT PRIMARY KEY,
  brief_json TEXT NOT NULL,
  findings_json TEXT NOT NULL,
  source TEXT NOT NULL,              -- "autoresearchclaw" | "lite"
  duration_ms INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE asset_cache (
  asset_key TEXT PRIMARY KEY,        -- sha256(prompt + provider + model + style)
  source TEXT NOT NULL,              -- fal|replicate|openai|gemini|unsplash|pexels|open-doodles|undraw|svg-composer
  local_path TEXT NOT NULL,          -- ~/.skeed/assets/<sha256>.<ext>
  mime TEXT NOT NULL,
  width INTEGER, height INTEGER,
  alt_text TEXT,
  license TEXT NOT NULL,
  attribution TEXT,
  cost_cents INTEGER,
  created_at TEXT NOT NULL
);

CREATE TABLE config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL                -- API keys (encrypted via OS keychain on Tauri), preferences
);

CREATE TABLE telemetry_local (        -- opt-in, never leaves machine without consent
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event TEXT NOT NULL,
  payload_json TEXT,
  created_at TEXT NOT NULL
);
```

**`<user-project>/.skeed/run.db`** — per-project, per-run state:

```sql
CREATE TABLE runs (
  id TEXT PRIMARY KEY,                -- uuid
  prompt TEXT NOT NULL,
  registry_version TEXT NOT NULL,
  schema_version INTEGER NOT NULL,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  status TEXT NOT NULL                -- running|paused|complete|failed|abandoned
);

CREATE TABLE run_stages (
  run_id TEXT NOT NULL,
  stage TEXT NOT NULL,
  cache_key TEXT NOT NULL,
  input_json TEXT NOT NULL,
  output_json TEXT,
  status TEXT NOT NULL,               -- pending|running|done|failed|cached
  duration_ms INTEGER,
  warnings_json TEXT,
  PRIMARY KEY (run_id, stage)
);

CREATE TABLE run_user_choices (        -- score-gate decisions, logo picks, landing picks
  run_id TEXT NOT NULL,
  decision_point TEXT NOT NULL,       -- "score_gate_1"|"score_gate_2"|"logo_pick"|"landing_pick"
  choice_json TEXT NOT NULL,
  decided_at TEXT NOT NULL,
  PRIMARY KEY (run_id, decision_point)
);

CREATE TABLE run_assets (
  run_id TEXT NOT NULL,
  asset_id TEXT NOT NULL,
  slot_role TEXT NOT NULL,
  page_id TEXT,
  asset_key TEXT NOT NULL,            -- FK to ~/.skeed/cache.db asset_cache
  PRIMARY KEY (run_id, asset_id)
);
```

### Why three tiers, why SQLite

- **No Postgres dependency.** A contributor cloning the repo runs `pnpm install && pnpm build`. No services. Test in CI on hosted runners with no DB.
- **Reproducibility.** Tier 2 is regeneratable from Tier 1 + migrations. Anyone can rebuild bit-for-bit (mod embedding non-determinism, which is bounded by pinning the model).
- **Hostable later.** If a hosted variant ships, Tier 2 becomes Postgres + pgvector + Meilisearch behind a feature flag in `@skeed/mcp-server` — interface stays the same. Multi-tenant support adds a `tenant_id` column to runtime tables only.
- **Privacy.** All runtime state stays on the user's machine. Telemetry is opt-in. API keys go through OS keychain (Tauri's `keyring`).

---

## Plugin / extension points

Every extension point is a TypeScript interface in `@skeed/contracts`. Implementations live in their own packages and are registered via dependency injection at `@skeed/cli` boot — no global registries, no monkey-patching.

| Extension point | Contract | Bundled implementations |
|---|---|---|
| `AssetSource` | `match(slot, demo) → score; fetch(req) → AssetResult` | fal, replicate, openai-image, gemini-image, unsplash, pexels, open-doodles, undraw, svg-composer |
| `LLMProvider` | `chat(messages, schema) → result; embed(text) → vec; supportsCache: bool` | anthropic, openai, google, ollama |
| `ResearchEngine` | `run(brief) → findings` | autoresearchclaw-bridge, lite-research |
| `ScoreRubric` | versioned JSON; `judge(input, rubric) → IdeaScore` | l1@1, l2@1 |
| `Demographic` | data only; folder under `data/demographics/<id>/` | 20 bundled |
| `Archetype` | data only; file under `data/archetypes/<id>.archetype.tsx` | 60 bundled |
| `Stage` | `run(input, ctx) → output` | 17 bundled |
| `Guard` | `check(scaffold) → GuardResult` | 8 bundled |

Plugins distribute as npm packages. `@skeed/cli` reads `skeed.config.json` `plugins[]` field and dynamically `import()`s them at boot.

```json
{
  "registry": "1.0.0",
  "plugins": [
    "@third-party/skeed-asset-source-leonardo",
    "@third-party/skeed-llm-provider-mistral",
    "./local/my-custom-stage"
  ]
}
```

---

## Contribution workflow

### CODEOWNERS layout

```
data/demographics/kids/         @skeed/maintainers @kids-domain-leads
data/demographics/health/       @skeed/maintainers @health-domain-leads @clinical-reviewers
data/demographics/gov/          @skeed/maintainers @gov-domain-leads @a11y-reviewers
packages/contracts/             @skeed/core
packages/pipeline/              @skeed/core
packages/asset-source-*/        @skeed/asset-maintainers
.github/workflows/              @skeed/infra
```

### CI validation matrix

Every PR triggers (in order, fail-fast):
1. **`lint-data`** — Zod-validate every JSON/TSX in `data/`
2. **`typecheck`** — `tsc --noEmit` across all packages
3. **`unit`** — Vitest per package
4. **`build-index`** — produces a fresh Tier-2 SQLite, smoke-tests retrieval
5. **`visual-regression`** — only for PRs that touch `data/components/` or `data/archetypes/` or `packages/core/`
6. **`a11y`** — axe over changed components
7. **`schema-compat`** — runs `@skeed/contracts` against last-published version, blocks breaking changes without a `BREAKING:` commit footer
8. **`license-check`** — refuses to merge a component whose upstream license is incompatible with the registry's declared license

### Bootstrap scripts for contributors

- `pnpm new:demographic <id>` — creates `data/demographics/<id>/` skeleton with TODO stubs for every required field
- `pnpm new:archetype <id>` — creates `data/archetypes/<id>.archetype.tsx` skeleton + manifest
- `pnpm new:asset-source <id>` — creates `packages/asset-source-<id>/` skeleton with `AssetSource` impl scaffold + tests
- `pnpm new:llm-provider <id>` — same for `packages/llm-provider-<id>/`

### Governance

`GOVERNANCE.md` defines:
- Maintainer tiers: `core`, `domain-leads` (per demographic), `subsystem-maintainers` (per package), `triagers`
- RFC process for: new demographics (closed enum changes), schema breaks, plugin-API breaks
- AAA-strict demographics (kids, health, gov, wellness) require **two reviewers** including at least one domain-lead

---

---

## Critical files to create

### Pipeline & orchestration
- `packages/pipeline/src/orchestrator.ts` — DAG runner, cache, event bus
- `packages/contracts/src/pipeline-types.ts` — Zod schemas (Intent, PainPoint, IdeaScore, ResearchBrief, ResearchFindings, BrandAttributes, LogoCandidate, GeneratedAsset, LandingCandidate, DesignSystem, SiteMap, PageSpec, LayoutNode, Scaffold)
- `packages/contracts/src/layout-dsl.ts` — DSL node types + validator
- `packages/pipeline/src/stages/01-intent.ts`
- `packages/pipeline/src/stages/02-classify.ts`
- `packages/pipeline/src/stages/03-pain-points.ts`
- `packages/pipeline/src/stages/04-score-l1.ts`
- `packages/pipeline/src/stages/05-gate-1.ts`              UI hand-off
- `packages/pipeline/src/stages/06-research.ts`
- `packages/pipeline/src/stages/07-score-l2.ts`
- `packages/pipeline/src/stages/08-gate-2.ts`              UI hand-off
- `packages/pipeline/src/stages/09-psychology.ts`
- `packages/pipeline/src/stages/10-brand-logo.ts`
- `packages/pipeline/src/stages/11-design-system.ts`
- `packages/pipeline/src/stages/12-user-stories.ts`
- `packages/pipeline/src/stages/13-landing-options.ts`
- `packages/pipeline/src/stages/14-ia.ts`
- `packages/pipeline/src/stages/15-compose.ts`
- `packages/pipeline/src/stages/16-assets.ts`
- `packages/pipeline/src/stages/17-emit.ts`
- `packages/pipeline/src/llm/dispatcher.ts` — picks LLMProvider per stage, retries, schema validation
- `packages/pipeline/src/clarify/template-loader.ts` — loads `data/ambiguity-templates/` + `data/pain-point-templates/`
- `packages/pipeline/src/cache/store.ts` — wraps `~/.skeed/cache.db` for stage-level cache

### Scoring
- `packages/scoring/src/rubrics/l1.ts` — 5-axis Level-1 rubric
- `packages/scoring/src/rubrics/l2.ts` — 9-axis Level-2 rubric
- `packages/scoring/src/judge.ts` — LLM judge with structured output
- `packages/scoring/src/feedback.ts` — generates per-axis recommendations

### Research bridge
- `packages/research-bridge/src/client.ts` — MCP/CLI client for AutoResearchClaw
- `packages/research-bridge/src/briefs/product-research.md` — prompt template
- `packages/research-bridge/src/normalize.ts` — output → ResearchFindings
- `packages/research-bridge/src/lite.ts` — built-in fallback research loop

### Assets (router + adapters as separate packages)
- `packages/assets-router/src/router.ts` — slot → source decision (no adapter imports; reads `AssetSource` plugins via DI)
- `packages/asset-logo-svg/src/composer.ts` — programmatic logo generator
- `packages/asset-logo-svg/src/primitive-loader.ts` — walks `data/demographics/<demo>/logo-primitives/`
- `packages/asset-source-fal/src/index.ts` — `AssetSource` impl
- `packages/asset-source-replicate/src/index.ts`
- `packages/asset-source-openai-image/src/index.ts`
- `packages/asset-source-gemini-image/src/index.ts`
- `packages/asset-source-unsplash/src/index.ts`
- `packages/asset-source-pexels/src/index.ts`
- `packages/asset-source-open-doodles/src/index.ts`
- `packages/asset-source-undraw/src/index.ts`

### LLM providers
- `packages/llm-cache/src/store.ts` — provider-agnostic cache (Tier 3 `~/.skeed/cache.db`)
- `packages/llm-provider-anthropic/src/index.ts`
- `packages/llm-provider-openai/src/index.ts`
- `packages/llm-provider-google/src/index.ts`
- `packages/llm-provider-ollama/src/index.ts`

### Landing options
- `packages/landing-options/src/archetypes.ts` — hero-led / story-led / conversion archetypes
- `packages/landing-options/src/render.ts` — composes each candidate with locked DS + assets

### Component system + data loaders
- `packages/contracts/src/index.ts` — barrel: re-exports all interfaces
- `packages/contracts/src/component.ts` — `ComponentManifest` Zod schema
- `packages/contracts/src/preset.ts` — `DemographicPreset` schema
- `packages/contracts/src/asset-source.ts` — `AssetSource` interface
- `packages/contracts/src/llm-provider.ts` — `LLMProvider` interface
- `packages/contracts/src/research-engine.ts` — `ResearchEngine` interface
- `packages/contracts/src/score-rubric.ts`
- `packages/contracts/src/stage.ts` — `Stage<I,O>` interface
- `packages/contracts/src/guard.ts`
- `packages/core/src/tokens.ts`
- `packages/core/src/transformer.ts`
- `packages/core/src/cn.ts`
- `packages/demographics-loader/src/load.ts` — walks `data/demographics/`, validates, exposes lookup
- `packages/archetypes-loader/src/load.ts`
- `packages/components-loader/src/load.ts`
- `packages/indexer/src/build-index.ts` — builds Tier-2 SQLite from loaders
- `packages/indexer/migrations/0001_init.sql`
- `packages/indexer/migrations/0002_asset_slots.sql` — example future migration
- `packages/mcp-server/src/server.ts`
- `packages/mcp-server/src/tools/search-components.ts`
- `packages/mcp-server/src/tools/get-component.ts`
- `packages/mcp-server/src/tools/score-idea-l1.ts`
- `packages/mcp-server/src/tools/generate-logo-candidates.ts`
- `packages/mcp-server/src/rerank.ts`
- `packages/eslint-plugin-skeed/src/no-literal-tokens.ts`
- `packages/eslint-plugin-skeed/src/no-dark-patterns.ts`

### Data (sample seeds — full set generated/curated in Phases 1+4)
- `data/demographics/kids/preset.json`
- `data/demographics/kids/psychology/learning.json`
- `data/demographics/kids/psychology/play.json`
- `data/demographics/kids/pain-points/learning.json`
- `data/demographics/kids/illustration-style.json`
- `data/demographics/kids/logo-primitives/shapes/`...`/marks/`...`/wordmarks/`...`/containers/`
- `data/demographics/kids/owners.md`
- `data/demographics/kids/README.md`
- `data/demographics/gov/preset.json` (parallel structure)
- `data/demographics/fintech/preset.json`
- `data/demographics/health/preset.json`
- `data/demographics/productivity/preset.json`
- `data/archetypes/button.archetype.tsx` + `button.archetype.json`
- `data/archetypes/hero.archetype.tsx` + `hero.archetype.json`
- `data/archetypes/transaction-row.archetype.tsx` + `transaction-row.archetype.json`
- `data/prompts/stages/01-intent/v1.md` … through stage 17
- `data/rubrics/score-l1/v1.json`
- `data/rubrics/score-l2/v1.json`
- `data/ambiguity-templates/time-of-day-intent.json`
- `data/ambiguity-templates/motivation-pattern.json`
- `data/pain-point-templates/productivity.json`
- `data/registry-versions/0.1.0.json`

### Repo-level scripts
- `scripts/codegen/generate-variants.ts` — archetype × demo × density emitter
- `scripts/codegen/thumbnailer.ts`
- `scripts/codegen/embed-catalog.ts`
- `scripts/codegen/publish-packages.ts`
- `scripts/lint-data/index.ts` — Zod-validates everything in `data/`
- `scripts/new-demographic/index.ts` — bootstraps `data/demographics/<id>/`
- `scripts/new-archetype/index.ts`
- `scripts/new-asset-source/index.ts`
- `scripts/new-llm-provider/index.ts`
- `scripts/visual-regression/run.ts`
- `scripts/a11y-audit/run.ts`
- `scripts/comparator/run.ts`

### Guardrails
- `packages/guards/src/contrast.ts`
- `packages/guards/src/forbidden-patterns.ts`
- `packages/guards/src/pii-scrub.ts`
- `packages/guards/src/ethics-lint.ts`
- `packages/guards/src/asset-checks.ts` — alt-text, AI-text-rendering OCR check
- `packages/guards/src/rubric.ts`
- `packages/guards/src/self-critique.ts`

### Tauri desktop
- `apps/desktop/src/main.tsx`
- `apps/desktop/src/PipelineRunner.tsx`
- `apps/desktop/src/ScoreGate.tsx` — L1/L2 score view + pivot/persist UI
- `apps/desktop/src/ResearchProgress.tsx` — streams AutoResearchClaw progress
- `apps/desktop/src/LogoPicker.tsx` — pick from 3-4 logo candidates
- `apps/desktop/src/LandingPicker.tsx` — pick from 2-3 landing candidates
- `apps/desktop/src/CuratorReview.tsx`
- `apps/desktop/src-tauri/src/main.rs` — Tauri backend (FS write, MCP child spawn)

### CLI & catalog scaffolding
- `packages/cli/src/index.ts`
- `presets/psychology/kids/learning.json`
- `presets/design-system/fintech/banking.json`
- `presets/pain-points/productivity/email-overload.json`
- `presets/logo-primitives/kids/`
- `presets/illustration-styles/kids.json`
- `registry/versions/0.1.0.json`
- `test/fixtures/prompts.json`
- `test/fixtures/research/email-automation.json` — cached AutoResearchClaw output

---

## Implementation phasing

**Phase 0 — Foundation (weeks 1–2)**
- Monorepo + tooling (pnpm workspaces, Turborepo, Biome, Vitest)
- `registry-schema` + `component-core` + 1 demographic preset (kids) + 1 archetype (Button)

**Phase 1 — Catalog MVP (weeks 3–8)**
- 5 demographics fully realized: kids, fintech, gov, productivity, health
- 30 archetypes
- Codegen pipeline; 5 × 30 × 3 = 450 generated entries
- `eslint-plugin-skeed`, visual regression, axe in CI
- `indexer` + bundled embedding model
- `mcp-server` validated against Claude Code

**Phase 2 — Pipeline core (weeks 6–14, overlaps Phase 1)**
- Orchestrator + Stages 1–4, 9, 11, 14, 15, 17 (the original pipeline)
- Provider-agnostic LLM client + portable cache
- AmbiguityTemplate library + clarify UX in Tauri app
- Guardrail module
- Self-critique loop

**Phase 3 — Funnel + research + assets (weeks 12–20, overlaps Phase 2 tail)**
- `scoring` package (L1 + L2)
- Score gates UI in Tauri
- `research-bridge` integration with AutoResearchClaw + lite-mode fallback
- `assets/logo` SVG composer + primitive libraries
- `assets/imagery` AI-gen and stock adapters
- `landing-options` generator
- Stages 3, 5–8, 10, 12, 13, 16 wired in

**Phase 4 — Catalog full launch (weeks 14–24, parallel)**
- Remaining 15 demographics (each ~1 week + 2-curator review for AAA-strict)
- Full 60 archetypes
- Generate full 3,600 catalog
- Publish 20 `@skeed/<demo>` npm packages
- Per-demographic logo primitive libraries + illustration-style suffixes

**Phase 5 — Tauri desktop polish (weeks 18–24)**
- Score gate UI, research progress, logo picker, landing picker
- Curator review queue
- Demographic A/B comparator

**Phase 6 — Ship (weeks 24–28)**
- Comparator harness vs v0/Bolt/Lovable
- Documentation site
- Public registry hosting + npm publish automation

---

## Verification plan

1. **Schema** — Vitest unit tests on `registry-schema` validators with fixtures.
2. **Transformer** — golden-file tests: archetype + preset → CSS, snapshotted.
3. **Codegen** — Phase 1 catalog locally + Playwright + Loki visual regression.
4. **Indexer** — fixture catalog → sqlite, assert vector-search rank.
5. **MCP server** — stdio integration tests; manual smoke against Claude Code.
6. **Scoring** — L1/L2 rubrics tested against a calibration set of 30 hand-scored ideas; assert Skeed score within ±1.5 of human.
7. **Research bridge** — mock AutoResearchClaw with `test/fixtures/research/` outputs; assert normalizer correctness. Live integration test gated on `SKEED_LIVE_RESEARCH=1`.
8. **Logo composer** — fuzz `BrandAttributes` × demographic; assert all SVG outputs validate against SVG schema, contain `<title>` for a11y, render under both dark/light bgs.
9. **Asset router** — given each catalog component's `asset_slots[]`, assert router resolves every slot to a valid source.
10. **Landing options** — pipeline → 3 candidates per fixture prompt, assert all compile, all reference only valid component IDs, all pass guardrails.
11. **Pipeline E2E** — `test/fixtures/prompts.json` (10–20 golden prompts incl. email-automation) end-to-end with mocked research; assert scaffold compiles (`tsc --noEmit`), passes axe, contrast guards, all referenced components exist, all assets cached.
12. **Self-critique** — fixture pipeline runs with injected bad output, assert critique catches and re-runs.
13. **Tauri** — Playwright UI test through prompt → clarify → score gate (low-score pivot path) → score gate (high-score path) → research → logo pick → landing pick → preview → write-to-folder.
14. **Comparator** — same prompts vs v0 (where API), human review side-by-side against rubric.
15. **End-to-end demo**: ship the email-automation prompt example as a recorded run that produces a working Next.js app for `(general-professional, mental-wellness/morning-routine)`, deploys to Vercel, passes all guards.

---

## Open follow-ups

1. **Embedding model upgrade path** — `bge-small-en` for v1; pin version in registry version.
2. **Demographic taxonomy revision cadence** — closed enum + quarterly RFC. Owner TBD.
3. **`@skeed/<demo>` size budgets** — 80 KB gzip per demographic target; needs measurement once Phase 4 starts.
4. **AutoResearchClaw output stability** — if its prompt structure changes between releases, normalizer breaks; pin version + add contract tests.
5. **AI-gen cost control** — per-project AI image budget knob; default 8 gens. Surface cost in Tauri before committing.
6. **Logo IP risk** — AI-generated logos can resemble existing trademarks. SVG-native programmatic avoids this; document the tradeoff (SVG = lower trademark risk, lower variety; AI = higher variety, higher risk).
7. **Comparator legality** — running v0/Bolt outputs through Skeed's judge may run afoul of those products' ToS. Audit before publishing.
8. **AAA-strict two-curator SLA** — operational; needs curator scheduling plan once Phase 4 starts.