'use client';

import { useMemo, useState } from 'react';
import { CodeBlock, PreviewPanel } from '@/components/ui';
import type { PlaygroundGenerateResult } from '@/lib/playground';
import { previewStyleForDemographic } from '@/lib/theme';

type Status = 'idle' | 'loading' | 'done' | 'error';

export function PlaygroundClient({ demographics }: { demographics: string[] }) {
  const [prompt, setPrompt] = useState('A fitness tracking app for runners with workout plans');
  const [demographic, setDemographic] = useState('health');
  const [density, setDensity] = useState('cozy');
  const [tone, setTone] = useState('calm');
  const [constraints, setConstraints] = useState('No placeholder copy\nTailwind 3 only');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<PlaygroundGenerateResult | null>(null);

  const firstFile = result?.files[0];
  const style = useMemo(
    () => previewStyleForDemographic(result?.demographic ?? demographic),
    [demographic, result?.demographic],
  );

  async function generate() {
    setStatus('loading');
    setError('');
    try {
      const response = await fetch('/api/playground/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          prompt,
          demographic,
          density,
          tone,
          constraints: constraints
            .split('\n')
            .map((item) => item.trim())
            .filter(Boolean),
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'Generation failed');
      setResult(body);
      setStatus('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus('error');
    }
  }

  async function copyInstallCommand() {
    if (!result) return;
    await navigator.clipboard.writeText(result.installCommand);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function downloadProjectManifest() {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${result.appName}-skeed-project.json`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <form
        className="rounded-skeed-radius-md border border-skeed-border bg-skeed-surface p-5"
        onSubmit={(event) => {
          event.preventDefault();
          void generate();
        }}
      >
        <label className="text-sm font-semibold" htmlFor="prompt">
          App idea
        </label>
        <textarea
          className="mt-2 min-h-32 w-full rounded-skeed-radius-sm border border-skeed-border bg-white p-3 text-sm outline-none focus-visible:skeed-focus-ring"
          id="prompt"
          onChange={(event) => setPrompt(event.target.value)}
          value={prompt}
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Demographic">
            <select
              className="h-10 w-full rounded-skeed-radius-sm border border-skeed-border bg-white px-3 text-sm"
              onChange={(event) => setDemographic(event.target.value)}
              value={demographic}
            >
              {demographics.map((id) => (
                <option key={id} value={id}>
                  {id.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Density">
            <select
              className="h-10 w-full rounded-skeed-radius-sm border border-skeed-border bg-white px-3 text-sm"
              onChange={(event) => setDensity(event.target.value)}
              value={density}
            >
              <option value="compact">Compact</option>
              <option value="cozy">Cozy</option>
              <option value="comfy">Comfy</option>
            </select>
          </Field>
          <Field label="Motion">
            <select
              className="h-10 w-full rounded-skeed-radius-sm border border-skeed-border bg-white px-3 text-sm"
              onChange={(event) => setTone(event.target.value)}
              value={tone}
            >
              <option value="calm">Calm</option>
              <option value="precise">Precise</option>
              <option value="premium">Premium</option>
              <option value="playful">Playful</option>
            </select>
          </Field>
        </div>
        <label className="mt-4 block text-sm font-semibold" htmlFor="constraints">
          Constraints
        </label>
        <textarea
          className="mt-2 min-h-24 w-full rounded-skeed-radius-sm border border-skeed-border bg-white p-3 text-sm outline-none focus-visible:skeed-focus-ring"
          id="constraints"
          onChange={(event) => setConstraints(event.target.value)}
          value={constraints}
        />
        <button className="skeed-cta-primary mt-5 w-full" disabled={status === 'loading'} type="submit">
          {status === 'loading' ? 'Generating...' : 'Generate preview'}
        </button>
        {error ? <p className="mt-3 text-sm text-skeed-danger">{error}</p> : null}
      </form>

      <div className="space-y-6">
        <PreviewPanel style={style}>
          {result ? (
            <>
              <p className="skeed-eyebrow">{result.demographic.replace(/_/g, ' ')}</p>
              <h2 className="skeed-type-title mt-3">{result.previewModel.headline}</h2>
              <p className="mt-4 text-skeed-muted">{result.previewModel.body}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <span className="skeed-cta-primary">{result.previewModel.cta}</span>
                <button className="skeed-cta-secondary" onClick={copyInstallCommand} type="button">
                  {copied ? 'Copied' : 'Copy CLI command'}
                </button>
                <button className="skeed-cta-secondary" onClick={downloadProjectManifest} type="button">
                  Download project JSON
                </button>
              </div>
              <p className="mt-3 text-xs text-skeed-muted">
                WebContainer export requires cross-origin isolation; this preview keeps a reliable CLI and download
                fallback available by default.
              </p>
              <div className="mt-6 grid gap-2 md:grid-cols-2">
                {result.selectedComponents.slice(0, 4).map((component) => (
                  <div className="rounded-skeed-radius-sm border border-skeed-border p-3" key={component.id}>
                    <p className="text-sm font-semibold">{component.name}</p>
                    <p className="mt-1 text-xs text-skeed-muted">{component.qualityTier}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="skeed-eyebrow">Ready</p>
              <h2 className="skeed-type-title mt-3">Generate an app preview</h2>
              <p className="mt-4 text-skeed-muted">
                The result will show classification, selected components, install command, and project files.
              </p>
            </>
          )}
        </PreviewPanel>

        {result ? (
          <div className="grid gap-5 xl:grid-cols-2">
            <article className="rounded-skeed-radius-md border border-skeed-border bg-skeed-surface p-5">
              <h3 className="font-skeed-display text-xl font-bold">Why these choices</h3>
              <ul className="mt-4 space-y-2 text-sm text-skeed-muted">
                {result.explanations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="mt-5">
                <CodeBlock value={result.installCommand} />
              </div>
            </article>
            <article className="rounded-skeed-radius-md border border-skeed-border bg-skeed-surface p-5">
              <h3 className="font-skeed-display text-xl font-bold">{firstFile?.path ?? 'Generated files'}</h3>
              <div className="mt-4">
                <CodeBlock value={firstFile?.contents ?? 'Run the generator to inspect files.'} />
              </div>
            </article>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <label className="block text-sm font-semibold">
      <span className="mb-2 block">{label}</span>
      {children}
    </label>
  );
}
