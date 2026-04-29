# Skeed

> MCP-native demographic design system builder. A different kind of AI app builder — scaffolding expert with deep design-system + demographic-psychology expertise.

[![NPM Version](https://img.shields.io/npm/v/@skeed/cli.svg?style=flat-square)](https://www.npmjs.com/package/@skeed/cli)
[![NPM Downloads](https://img.shields.io/npm/dm/@skeed/cli.svg?style=flat-square)](https://npmjs.com/package/@skeed/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg?style=flat-square)](https://www.typescriptlang.org)
[![Node](https://img.shields.io/badge/Node-%3E%3D22.0.0-green.svg?style=flat-square)](https://nodejs.org)

**Production-ready scaffolding for demographic-targeted applications.**

Skeed transforms a raw idea into a complete, runnable Next.js application — with brand identity, design system, and component selection tuned to your target audience.

## Quick Install

```bash
# Install the CLI globally
npm install -g @skeed/cli

# Or use npx (no install required)
npx @skeed/cli init "Build an app that manages my emails automatically"
```

## What it does

Skeed takes a prompt like *"Build an app that manages my emails automatically and gives me feedback every morning"* and produces a complete, demographic-targeted scaffold:

1. **Validates the idea** — clarifies demographic + niche + pain points, scores it (twice, with optional deep research between).
2. **Generates a brand** — SVG-native logos tuned to the demographic.
3. **Synthesizes a design system** — palette, typography, motion, voice, all matched to demographic psychology.
4. **Selects the right components** — from a catalog of ~3,600 demographic-tagged components served via MCP.
5. **Composes pages + lands on a user-picked landing page** — 2-3 candidates, you pick.
6. **Emits a runnable Next.js scaffold** — with assets (AI-generated illustrations, stock imagery, demographic-fit avatars).

## Features

- **Demographic Intelligence** — 19+ researched personas with psychology-mapped design patterns
- **3,600+ Components** — Curated, accessibility-tested, demographic-tagged component catalog
- **17-Stage Pipeline** — From idea validation to deployed scaffold in one command
- **Design Token System** — Deterministic preset→CSS transformation, zero magic values
- **MCP-Native** — Component registry exposed via Model Context Protocol for AI-assisted workflows
- **Guardrails Built-In** — Contrast validation, ethics checks, accessibility assertions

## Why Skeed

Most scaffolding tools generate generic code. Skeed generates *targeted* code.

| Generic Scaffolder | Skeed |
|-------------------|-------|
| One-size-fits-all components | Demographic-tuned variants (density, motion, voice) |
| Arbitrary color palettes | Psychology-mapped color systems |
| Boilerplate landing pages | Persona-optimized conversion flows |
| Manual component selection | AI-assisted, constraint-aware composition |

Built for teams who ship to real users — not demos.

## Packages

| Package | Description | Install |
|---------|-------------|---------|
| `@skeed/cli` | Main CLI for scaffolding apps | `npm i -g @skeed/cli` |
| `@skeed/core` | Design tokens & CSS transformer | `npm i @skeed/core` |
| `@skeed/contracts` | Shared types & Zod schemas | `npm i @skeed/contracts` |
| `@skeed/motion` | Physics-based micro-interactions | `npm i @skeed/motion` |
| `@skeed/pipeline` | 17-stage NL→design-system pipeline | `npm i @skeed/pipeline` |
| `@skeed/mcp-server` | MCP server for component registry | `npm i -g @skeed/mcp-server` |
| `@skeed/indexer` | SQLite registry builder | `npm i @skeed/indexer` |
| `@skeed/guards` | Deterministic guardrails | `npm i @skeed/guards` |
| `@skeed/codegen` | Component generation engine | `npm i @skeed/codegen` |

## Quick Start

### Using the CLI (End-to-End Scaffolding)

The Skeed CLI transforms a freeform idea into a complete, demographic-targeted Next.js application:

```bash
# Install globally
npm install -g @skeed/cli

# Or use npx (no install)
npx @skeed/cli init "Build an app that manages my emails automatically"
```

### Basic Usage

```bash
# Scaffold from an idea
skeed init "Build a meditation app for busy professionals"

# With options
skeed init "A fitness tracker for seniors" \
  --name "silver-fit" \
  --demographic "health-conscious-seniors" \
  --out ./projects \
  --preview
```

### CLI Options

| Option | Description |
|--------|-------------|
| `prompt` | Your app idea (required) |
| `-n, --name <name>` | Override inferred project name |
| `-d, --demographic <id>` | Pin specific demographic (skip auto-classification) |
| `-o, --out <dir>` | Output directory (default: cwd) |
| `-y, --yes` | Skip all approval gates (CI mode) |
| `--preview` | Open browser to pick logo/landing page candidates |

### What Happens When You Run `skeed init`

The CLI runs a 17-stage pipeline to scaffold your app:

| Phase | Stage | What It Does |
|-------|-------|--------------|
| **Validate** | 1. Intent | Parses your idea into structured requirements |
| | 2. Classify | Matches idea to best-fit demographic(s) |
| | 3. Pain Points | Extracts user pain points for targeting |
| | 4-5. Score L1 + Gate | Validates idea viability |
| **Research** | 6. Research | Deep research on niche + competitors |
| | 7-8. Score L2 + Gate | Re-scores with research insights |
| **Design** | 9. Psychology | Maps demographic psychology to design patterns |
| | 10. Brand Logo | Generates 2-3 SVG logo candidates |
| | 11. Design System | Creates palette, typography, motion tokens |
| | 12. User Stories | Generates user stories + acceptance criteria |
| | 13. Landing Options | Creates 2-3 landing page candidates |
| **Build** | 14. IA | Plans information architecture |
| | 14.5. Backend | Selects backend strategy |
| | 15. Compose | Assembles components into pages |
| | 16. Assets | Fetches/generates images + illustrations |
| | 17. Emit | Writes runnable Next.js scaffold |

### Prerequisites

The CLI requires LLM provider configuration. Set one of these:

```bash
# OpenAI
export OPENAI_API_KEY="sk-..."

# Anthropic
export ANTHROPIC_API_KEY="sk-ant-..."

# Google
export GOOGLE_API_KEY="..."

# Or Ollama for local
export OLLAMA_HOST="http://localhost:11434"
```

### Example Workflows

**Interactive mode** (with browser preview):
```bash
skeed init "A budgeting app for college students" --preview
# Opens browser to pick from 2-3 logo and landing page candidates
```

**CI/Automation mode** (no prompts):
```bash
skeed init "Invoice generator for freelancers" \
  --name "quick-invoice" \
  --demographic "freelancers" \
  --yes
```

**Specific demographic targeting**:
```bash
skeed init "Mental health check-in app" \
  --demographic "gen-z-workers" \
  --out ./mental-health-apps
```

## Using Packages Programmatically

Import individual packages into your own projects:

### Design Tokens & CSS
```typescript
import { transformPresetToCSS } from '@skeed/core/transformer';
import { resolveTokens } from '@skeed/core/token-resolver';

// Generate CSS from a demographic preset
const css = transformPresetToCSS({
  demographicId: 'health-conscious-seniors',
  density: 'comfortable'
});
```

### Motion & Animation
```tsx
import { MotionButton } from '@skeed/motion/react';
import { useSpringAnimation } from '@skeed/motion';

// Physics-based button with demographic-tuned easing
<MotionButton 
  demographics="gen-z-workers"
  gesture="tap"
>
  Get Started
</MotionButton>
```

### Component Generation
```typescript
import { generateComponent } from '@skeed/codegen';

// Generate a demographic-tuned component
const component = await generateComponent({
  archetypeId: 'button',
  demographicId: 'busy-professionals',
  preset: ' productivity'
});
```

### MCP Server (IDE Integration)
```bash
# Add to your MCP settings (Claude/Cursor)
{
  "mcpServers": {
    "skeed": {
      "command": "npx",
      "args": ["@skeed/mcp-server"]
    }
  }
}
```

### Development Setup

To contribute or run from source:

```bash
pnpm install
pnpm lint:data       # validate everything in data/
pnpm typecheck
pnpm build
pnpm --filter @skeed/cli init "your idea here"
```

## Repo layout

- `packages/` — TypeScript source. One package = one purpose.
- `data/` — All project data (demographics, archetypes, components, prompts, rubrics). JSON, TSX, SVG. Contributor-friendly.
- `apps/desktop/` — Tauri desktop app.
- `scripts/` — Repo-level tooling.
- `docs/` — Contributor + architecture docs.

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md). Key idea: most contributions are single-folder additions under `data/` — no TypeScript required.

## License

MIT for code. Per-component upstream licenses preserved in component manifests.
