import type { Stage } from '@skeed/contracts';
import { PipelineState } from './state.js';

/**
 * Stage 15 — Compose. M2 minimal: takes the landing TSX from Stage 13 + design
 * tokens from Stage 11 and emits app/page.tsx, app/layout.tsx, app/globals.css.
 * Future M3: walks LayoutDSL → MCP search_components → JSX.
 */
export const stage_15_compose: Stage<PipelineState, PipelineState> = {
  name: '15-compose',
  version: '0.2.0',
  inputSchema: PipelineState,
  outputSchema: PipelineState,
  cacheable: true,
  async run(state) {
    const ds = state.designSystem;
    const projectName = state.intent?.jobToBeDone?.replace(/^Build:\s*/, '').slice(0, 60) ?? 'Skeed App';
    const tagline = state.userStories?.[0]?.iWantTo ?? 'Get started in seconds';
    const palette = ds?.palette;

    const landingTsx =
      (state as { landingTsx?: string }).landingTsx ?? defaultPage(projectName, tagline, ds?.voice.samples.cta ?? 'Get started');

    const layoutTsx = `import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '${escape(projectName)}',
  description: '${escape(tagline)}',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`;

    const globals = renderGlobals(ds);

    return {
      ...state,
      composedPages: [
        { pageId: 'home', route: '/', tsx: landingTsx },
        { pageId: '_layout', route: '__layout', tsx: layoutTsx },
        { pageId: '_globals', route: '__globals.css', tsx: globals },
      ],
    };

    function renderGlobals(designSystem: PipelineState['designSystem']): string {
      const brand = palette?.primary ?? '#4F46E5';
      const fg = palette?.neutral ?? '#0F172A';
      const accent = palette?.accent ?? brand;
      const fontStack = (designSystem?.type.stack ?? ['Inter', 'system-ui']).map((f) => (/[\s'"]/.test(f) ? `'${f}'` : f)).join(', ');
      const radius = designSystem?.radius?.[1] ?? 8;
      return `:root {
  --skeed-brand: ${brand};
  --skeed-accent: ${accent};
  --skeed-bg: #FFFFFF;
  --skeed-fg: ${fg};
  --skeed-radius: ${radius}px;
}
* { box-sizing: border-box; }
html, body { padding: 0; margin: 0; font-family: ${fontStack}, ui-sans-serif, system-ui, sans-serif; color: var(--skeed-fg); background: var(--skeed-bg); }
.container { width: 100%; max-width: 1100px; }
.mx-auto { margin-left: auto; margin-right: auto; }
.min-h-screen { min-height: 100vh; }
.flex { display: flex; }
.grid { display: grid; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.text-center { text-align: center; }
.text-2xl { font-size: 1.5rem; line-height: 1.2; }
.text-3xl { font-size: 1.875rem; line-height: 1.2; }
.text-4xl { font-size: 2.25rem; line-height: 1.1; }
.text-5xl { font-size: 3rem; line-height: 1.1; }
.text-lg { font-size: 1.125rem; }
.text-sm { font-size: .875rem; }
.font-bold { font-weight: 700; }
.font-semibold { font-weight: 600; }
.italic { font-style: italic; }
.tracking-tight { letter-spacing: -.025em; }
.opacity-80 { opacity: .8; } .opacity-70 { opacity: .7; } .opacity-60 { opacity: .6; }
.gap-2 { gap: .5rem; } .gap-6 { gap: 1.5rem; } .gap-10 { gap: 2.5rem; }
.px-4 { padding: 0 1rem; } .px-6 { padding-left: 1.5rem; padding-right: 1.5rem; } .px-8 { padding: 0 2rem; } .px-10 { padding: 0 2.5rem; }
.py-3 { padding-top: .75rem; padding-bottom: .75rem; } .py-4 { padding-top: 1rem; padding-bottom: 1rem; } .py-5 { padding-top: 1.25rem; padding-bottom: 1.25rem; }
.py-10 { padding-top: 2.5rem; padding-bottom: 2.5rem; } .py-16 { padding-top: 4rem; padding-bottom: 4rem; } .py-24 { padding-top: 6rem; padding-bottom: 6rem; }
.p-6 { padding: 1.5rem; } .p-8 { padding: 2rem; }
.mt-2 { margin-top: .5rem; } .mt-3 { margin-top: .75rem; } .mt-4 { margin-top: 1rem; } .mt-6 { margin-top: 1.5rem; } .mt-8 { margin-top: 2rem; } .mt-10 { margin-top: 2.5rem; }
.max-w-md { max-width: 28rem; } .max-w-xl { max-width: 36rem; } .max-w-2xl { max-width: 42rem; }
.w-full { width: 100%; }
.flex-1 { flex: 1; }
.rounded-full { border-radius: 9999px; }
.rounded-2xl { border-radius: 1rem; }
.aspect-video { aspect-ratio: 16/9; }
.bg-white\\/60 { background: rgba(255,255,255,.6); }
.bg-white { background: #fff; }
.bg-\\[var\\(--skeed-brand\\)\\] { background: var(--skeed-brand); }
.bg-\\[var\\(--skeed-brand\\)\\]\\/10 { background: color-mix(in srgb, var(--skeed-brand) 10%, transparent); }
.bg-\\[var\\(--skeed-bg\\)\\] { background: var(--skeed-bg); }
.text-\\[var\\(--skeed-fg\\)\\] { color: var(--skeed-fg); }
.border { border-width: 1px; border-style: solid; }
.border-black\\/5 { border-color: rgba(0,0,0,.05); }
.border-black\\/10 { border-color: rgba(0,0,0,.1); }
.shadow-sm { box-shadow: 0 1px 2px rgba(0,0,0,.05); }
.text-white { color: #fff; }
.inline-block { display: inline-block; }
.space-y-6 > * + * { margin-top: 1.5rem; }
header a, header a:visited { color: inherit; }
a.hover\\:underline:hover { text-decoration: underline; }
a.underline { text-decoration: underline; }
@media (min-width: 768px) {
  .md\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .md\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
`;
    }
  },
};

function defaultPage(projectName: string, tagline: string, cta: string): string {
  return `export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--skeed-bg)] text-[var(--skeed-fg)]">
      <section className="container mx-auto px-6 py-24 text-center">
        <h1 className="text-5xl font-bold tracking-tight">${escape(projectName)}</h1>
        <p className="mx-auto mt-6 max-w-xl text-lg opacity-80">${escape(tagline)}</p>
        <a href="#" className="mt-10 inline-block rounded-full bg-[var(--skeed-brand)] px-8 py-3 font-semibold text-white">${escape(cta)}</a>
      </section>
    </main>
  );
}
`;
}

function escape(s: string): string {
  return s.replace(/[<>&'"`]/g, (c) => `&#${c.charCodeAt(0)};`);
}
