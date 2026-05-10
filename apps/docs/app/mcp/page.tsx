import { CodeBlock, PageHeader } from '@/components/ui';
import { llmsText } from '@/lib/registry';

export default function McpPage() {
  return (
    <main>
      <PageHeader
        body="Skeed’s MCP server exposes registry search, component context, install plans, prompts, and resources so agents can choose UI with reasons."
        eyebrow="Agent context"
        title="MCP and AI editor setup"
      />
      <section className="mx-auto grid max-w-docs gap-5 px-5 pb-16 lg:grid-cols-[.9fr_1.1fr]">
        <article className="rounded-skeed-radius-md border border-skeed-border bg-skeed-surface p-5">
          <h2 className="font-skeed-display text-xl font-bold">Editor config</h2>
          <p className="mt-2 text-sm leading-6 text-skeed-muted">
            Add this to Claude, Cursor, Windsurf, or any MCP-compatible editor.
          </p>
          <div className="mt-5">
            <CodeBlock
              value={`{\n  "mcpServers": {\n    "skeed": {\n      "command": "npx",\n      "args": ["-y", "@skeed/mcp-server"]\n    }\n  }\n}`}
            />
          </div>
        </article>
        <article className="rounded-skeed-radius-md border border-skeed-border bg-skeed-surface p-5">
          <h2 className="font-skeed-display text-xl font-bold">Agent-facing rules</h2>
          <div className="mt-5">
            <CodeBlock value={llmsText()} />
          </div>
        </article>
      </section>
    </main>
  );
}
