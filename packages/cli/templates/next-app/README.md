# {{APP_TITLE}}

Generated with [Skeed](https://github.com/) - `npx skeed init`.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Skeed config

See `skeed.config.json` for the demographic, design system, and backend stack chosen for this project.

## UI system

This app is Tailwind 3-first and includes Skeed semantic hierarchy utilities:

- `skeed-type-page`
- `skeed-type-hero`
- `skeed-type-title`
- `skeed-type-body`
- `skeed-eyebrow`
- `skeed-cta-primary`
- `skeed-cta-secondary`

The generated `skeed.tailwind.ts` mirrors `@skeed/tailwind` so the scaffold keeps demographic typography, CTA hierarchy, reduced-motion behavior, and CSS-first micro-interactions even before package publishing catches up.

The demographic choice is not decorative. The CLI writes the active typeface stack, scale, CTA geometry, motion caps, and smart text/grid utilities into the scaffold so generated pages inherit the same UI judgment by default.
