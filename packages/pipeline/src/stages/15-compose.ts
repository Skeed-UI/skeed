import type { Stage } from '@skeed/contracts';
import { PipelineState } from './state.js';

/** Stage 15 — Compose page TSX. M1: emits a minimal `app/page.tsx` keyed on demographic tokens. */
export const stage_15_compose: Stage<PipelineState, PipelineState> = {
  name: '15-compose',
  version: '0.1.0',
  inputSchema: PipelineState,
  outputSchema: PipelineState,
  cacheable: true,
  async run(state) {
    const ds = state.designSystem;
    const projectName = state.intent?.jobToBeDone?.replace(/^Build:\s*/, '').slice(0, 60) ?? 'Skeed App';
    const tagline = state.userStories?.[0]?.iWantTo ?? 'Get started in seconds';
    const ctaLabel = ds?.voice.samples.cta ?? 'Get Started';
    const palette = ds?.palette ?? {
      primary: '#4F46E5',
      neutral: '#0F172A',
      semantic: { success: '#10B981', danger: '#EF4444', warning: '#F59E0B' },
    };

    const home = `export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--skeed-bg)] text-[var(--skeed-fg)]">
      <header className="container mx-auto flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="${projectName} logo" width={32} height={32} />
          <span className="font-semibold">${escape(projectName)}</span>
        </div>
        <nav className="text-sm opacity-80">
          <a href="#features" className="hover:underline">Features</a>
        </nav>
      </header>
      <section className="container mx-auto px-6 py-24 text-center">
        <h1 className="mx-auto max-w-2xl text-5xl font-bold tracking-tight">${escape(projectName)}</h1>
        <p className="mx-auto mt-6 max-w-xl text-lg opacity-80">${escape(tagline)}</p>
        <a
          href="#cta"
          className="mt-10 inline-block rounded-full bg-[var(--skeed-brand)] px-8 py-3 font-semibold text-white"
        >
          ${escape(ctaLabel)}
        </a>
      </section>
      <section id="features" className="container mx-auto grid gap-6 px-6 py-16 md:grid-cols-3">
        <Feature title="Built for ${escape(state.classification?.candidates[0]?.demographic ?? 'you')}" body="Tuned to your audience from token to copy." />
        <Feature title="Ships in minutes" body="Skeed scaffolds a working Next.js project end-to-end." />
        <Feature title="Production-grade" body="Tokens enforce contrast, motion, and density automatically." />
      </section>
      <footer className="container mx-auto px-6 py-10 text-center text-sm opacity-60">
        Built with <a href="https://github.com/" className="underline">Skeed</a>
      </footer>
    </main>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded-2xl border border-black/5 bg-white/60 p-6 shadow-sm">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm opacity-80">{body}</p>
    </article>
  );
}
`;

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

    const globals = `:root {
  --skeed-brand: ${palette.primary};
  --skeed-bg: ${palette.neutral === '#0F172A' ? '#FFFFFF' : '#FFFFFF'};
  --skeed-fg: ${palette.neutral};
}
* { box-sizing: border-box; }
html, body { padding: 0; margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
.container { width: 100%; max-width: 1100px; }
.mx-auto { margin-left: auto; margin-right: auto; }
.min-h-screen { min-height: 100vh; }
.flex { display: flex; }
.grid { display: grid; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.text-center { text-align: center; }
.text-5xl { font-size: 3rem; line-height: 1.1; }
.text-lg { font-size: 1.125rem; }
.text-sm { font-size: 0.875rem; }
.font-bold { font-weight: 700; }
.font-semibold { font-weight: 600; }
.tracking-tight { letter-spacing: -0.025em; }
.opacity-80 { opacity: .8; }
.opacity-60 { opacity: .6; }
.gap-2 { gap: .5rem; } .gap-6 { gap: 1.5rem; }
.px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
.py-3 { padding-top: .75rem; padding-bottom: .75rem; }
.py-5 { padding-top: 1.25rem; padding-bottom: 1.25rem; }
.py-10 { padding-top: 2.5rem; padding-bottom: 2.5rem; }
.py-16 { padding-top: 4rem; padding-bottom: 4rem; }
.py-24 { padding-top: 6rem; padding-bottom: 6rem; }
.mt-2 { margin-top: .5rem; } .mt-6 { margin-top: 1.5rem; } .mt-10 { margin-top: 2.5rem; }
.max-w-xl { max-width: 36rem; } .max-w-2xl { max-width: 42rem; }
.rounded-full { border-radius: 9999px; }
.rounded-2xl { border-radius: 1rem; }
.bg-white\\/60 { background: rgba(255,255,255,.6); }
.border { border-width: 1px; border-style: solid; }
.border-black\\/5 { border-color: rgba(0,0,0,.05); }
.shadow-sm { box-shadow: 0 1px 2px rgba(0,0,0,.05); }
.text-white { color: #fff; }
.p-6 { padding: 1.5rem; }
.inline-block { display: inline-block; }
@media (min-width: 768px) { .md\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
header a, header a:visited { color: inherit; }
a.hover\\:underline:hover { text-decoration: underline; }
a.underline { text-decoration: underline; }
`;

    return {
      ...state,
      composedPages: [
        { pageId: 'home', route: '/', tsx: home },
        { pageId: '_layout', route: '__layout', tsx: layoutTsx },
        { pageId: '_globals', route: '__globals.css', tsx: globals },
      ],
    };
  },
};

function escape(s: string): string {
  return s.replace(/[<>&'"`]/g, (c) => `&#${c.charCodeAt(0)};`);
}
