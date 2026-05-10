import { notFound } from 'next/navigation';
import { RealComponentPreview } from '@/components/real-component-preview';
import { CodeBlock, PageHeader } from '@/components/ui';
import {
  componentNameFromId,
  getDocsComponent,
  humanizeComponentName,
  previewStyleForDemographic,
} from '@/lib/registry';

export default async function ComponentDocsPage({
  params,
}: {
  params: Promise<{ id: string[] }>;
}) {
  const { id: segments } = await params;
  const id = segments.map(decodeURIComponent).join('/');
  const component = getDocsComponent(id);
  if (!component) notFound();
  const manifest = component.manifest;
  const demographic = String(manifest.demographicId ?? segments[0] ?? 'productivity');
  const title = humanizeComponentName(String(manifest.name ?? componentNameFromId(id)));
  const description = String(manifest.description ?? 'Skeed registry component.');

  return (
    <main>
      <PageHeader
        body={description}
        eyebrow={`${manifest.qualityTier ?? 'generated'} / ${demographic}`}
        title={title}
      />
      <section className="mx-auto max-w-docs px-5 pb-16">
        <RealComponentPreview
          componentId={id}
          demographic={demographic}
          style={previewStyleForDemographic(demographic)}
        />

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,.72fr)]">
          <div className="min-w-0 space-y-6">
            <article className="rounded-skeed-radius-md border border-skeed-border bg-skeed-surface p-5">
              <h2 className="font-skeed-display text-xl font-bold">Install</h2>
              <div className="mt-4">
                <CodeBlock value={`npx shadcn@latest add https://skeed.dev/r/${id.replace(/_/g, '-').replace(/\//g, '-')}.json`} />
              </div>
            </article>

            <article className="rounded-skeed-radius-md border border-skeed-border bg-skeed-surface p-5">
              <h2 className="font-skeed-display text-xl font-bold">Source</h2>
              <div className="mt-4">
                <CodeBlock value={component.sourceTsx ?? 'Source is not available in the registry context.'} />
              </div>
            </article>
          </div>

          <aside className="min-w-0 space-y-6">
            <MetadataBlock
              title="Demographic fit"
              value={JSON.stringify(component.fit, null, 2)}
            />
            <MetadataBlock
              title="Install plan"
              value={JSON.stringify(component.installPlan, null, 2)}
            />
            <MetadataBlock
              title="Registry payload"
              value={JSON.stringify(component.shadcnPayload, null, 2)}
            />
            <article className="rounded-skeed-radius-md border border-skeed-border bg-skeed-surface p-5">
              <h2 className="font-skeed-display text-xl font-bold">Content slots</h2>
              <ul className="mt-4 space-y-2 text-sm text-skeed-muted">
                {Array.isArray(manifest.contentSlots) && manifest.contentSlots.length > 0 ? (
                  manifest.contentSlots.map((slot) => (
                    <li key={String((slot as { name?: string }).name)}>
                      {String((slot as { name?: string }).name)} -{' '}
                      {String((slot as { type?: string }).type)}
                    </li>
                  ))
                ) : (
                  <li>No explicit content slots declared.</li>
                )}
              </ul>
            </article>
          </aside>
        </div>
      </section>
    </main>
  );
}

function MetadataBlock({ title, value }: { title: string; value: string }) {
  return (
    <article className="rounded-skeed-radius-md border border-skeed-border bg-skeed-surface p-5">
      <h2 className="font-skeed-display text-xl font-bold">{title}</h2>
      <div className="mt-4">
        <CodeBlock value={value} />
      </div>
    </article>
  );
}
