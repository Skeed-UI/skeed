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

## Quick start (developer)

```bash
pnpm install
pnpm lint:data       # validate everything in data/
pnpm typecheck
pnpm build
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
