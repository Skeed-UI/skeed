import { CodeBlock, PageHeader } from '@/components/ui';

const sections = [
  {
    title: 'Install the CLI',
    body: 'Use the CLI when you want Skeed to scaffold a full demographic-targeted app.',
    code: 'npx @skeed/cli init "A fitness tracker for runners" --demographic health --yes',
  },
  {
    title: 'Use Tailwind 3 tokens',
    body: 'Skeed projects should start from the Tailwind 3 preset and only opt into Tailwind 4 later.',
    code: `import { createSkeedTailwindPreset } from '@skeed/tailwind';\n\nexport default {\n  presets: [createSkeedTailwindPreset({ demographic: 'classic', tone: 'calm' })],\n};`,
  },
  {
    title: 'Install from the registry',
    body: 'Every public component page exposes a shadcn-compatible registry payload and install command.',
    code: 'npx shadcn@latest add https://skeed.dev/r/health-hero-compact-default.json',
  },
  {
    title: 'Give agents context',
    body: 'Use the MCP server so Codex, Claude, Cursor, Windsurf, and v0-style tools can search by intent and demographic fit.',
    code: `{\n  "mcpServers": {\n    "skeed": {\n      "command": "npx",\n      "args": ["-y", "@skeed/mcp-server"]\n    }\n  }\n}`,
  },
];

export default function DocsPage() {
  return (
    <main>
      <PageHeader
        body="The short path from idea to installable, explainable, demographic-aware UI."
        eyebrow="Getting started"
        title="Build with Skeed"
      />
      <section className="mx-auto grid max-w-docs gap-5 px-5 pb-16 md:grid-cols-2">
        {sections.map((section) => (
          <article className="rounded-skeed-radius-md border border-skeed-border bg-skeed-surface p-5" key={section.title}>
            <h2 className="font-skeed-display text-xl font-bold">{section.title}</h2>
            <p className="mt-2 text-sm leading-6 text-skeed-muted">{section.body}</p>
            <div className="mt-5">
              <CodeBlock value={section.code} />
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
