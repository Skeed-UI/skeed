# Skeed

> MCP-native demographic design system builder. A different kind of AI app builder — scaffolding expert with deep design-system + demographic-psychology expertise.

## What it does

Skeed takes a prompt like *"Build an app that manages my emails automatically and gives me feedback every morning"* and produces a complete, demographic-targeted scaffold:

1. **Validates the idea** — clarifies demographic + niche + pain points, scores it (twice, with optional deep research between).
2. **Generates a brand** — SVG-native logos tuned to the demographic.
3. **Synthesizes a design system** — palette, typography, motion, voice, all matched to demographic psychology.
4. **Selects the right components** — from a catalog of ~3,600 demographic-tagged components served via MCP.
5. **Composes pages + lands on a user-picked landing page** — 2-3 candidates, you pick.
6. **Emits a runnable Next.js scaffold** — with assets (AI-generated illustrations, stock imagery, demographic-fit avatars).

## Status

Pre-alpha. See [the architecture plan](https://github.com/) and [`CONTRIBUTING.md`](./CONTRIBUTING.md).

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
