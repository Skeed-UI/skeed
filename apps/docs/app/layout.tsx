import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Skeed Docs',
  description:
    'Documentation, component previews, demographic design tokens, and online app generation for Skeed.',
  icons: {
    icon: '/icon.svg',
  },
};

const nav = [
  ['Docs', '/docs'],
  ['Components', '/components'],
  ['Demographics', '/demographics'],
  ['Playground', '/playground'],
  ['MCP', '/mcp'],
] as const;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Cormorant+Garamond:wght@500;600;700&family=Crimson+Text:wght@400;600;700&family=Fraunces:opsz,wght@9..144,500;9..144,650;9..144,750&family=IBM+Plex+Sans:wght@400;500;600;700&family=Inter+Tight:wght@500;600;700;800&family=Inter:wght@400;500;600;700;800&family=Libre+Baskerville:wght@400;700&family=Nunito:wght@400;600;700;800&family=Source+Sans+3:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="docs-shell">
          <header className="sticky top-0 z-30 border-b border-skeed-border bg-skeed-bg/88 backdrop-blur">
            <div className="mx-auto flex max-w-docs items-center justify-between gap-6 px-5 py-4">
              <Link className="flex items-center gap-2 font-skeed-display text-lg font-bold text-skeed-fg" href="/">
                <span className="grid h-8 w-8 place-items-center rounded-skeed-radius-sm bg-skeed-fg text-sm text-skeed-bg shadow-skeed-shadow-md">
                  S
                </span>
                Skeed
              </Link>
              <nav className="hidden items-center gap-5 text-sm text-skeed-muted md:flex">
                {nav.map(([label, href]) => (
                  <Link className="transition hover:text-skeed-fg" href={href} key={href}>
                    {label}
                  </Link>
                ))}
              </nav>
              <Link className="skeed-cta-primary text-sm" href="/playground">
                Generate app
              </Link>
            </div>
          </header>
          {children}
          <footer className="border-t border-skeed-border px-5 py-10 text-sm text-skeed-muted">
            <div className="mx-auto flex max-w-docs flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p>Skeed is the semantic context layer for demographic UI generation.</p>
              <div className="flex gap-4">
                <Link href="/llms.txt">llms.txt</Link>
                <Link href="/agents.md">agents.md</Link>
                <Link href="/r/registry.json">registry.json</Link>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
