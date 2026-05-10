import { ComponentCard, PageHeader } from '@/components/ui';
import {
  DEMOGRAPHIC_CHOICES,
  componentNameFromId,
  listDocsComponents,
  previewStyleForDemographic,
} from '@/lib/registry';

export default async function ComponentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; demographic?: string; tier?: string }>;
}) {
  const params = await searchParams;
  const components = listDocsComponents({
    ...(params.q ? { query: params.q } : {}),
    ...(params.demographic ? { demographic: params.demographic } : {}),
    tier: params.tier ?? 'flagship',
    limit: 48,
  });

  return (
    <main>
      <PageHeader
        body="Search installable Skeed UI by intent and audience. Flagship components are shown first; generated variants are available through filters and registry endpoints."
        eyebrow="Component registry"
        title="Preview, inspect, and install components"
      />
      <section className="mx-auto max-w-docs px-5 pb-16">
        <form className="grid gap-3 rounded-skeed-radius-md border border-skeed-border bg-skeed-surface p-4 md:grid-cols-[1fr_190px_150px_auto]">
          <input
            className="h-11 rounded-skeed-radius-sm border border-skeed-border bg-white px-3 text-sm outline-none focus-visible:skeed-focus-ring"
            defaultValue={params.q ?? ''}
            name="q"
            placeholder="Search intent, e.g. wellness signup form"
          />
          <select
            className="h-11 rounded-skeed-radius-sm border border-skeed-border bg-white px-3 text-sm"
            defaultValue={params.demographic ?? ''}
            name="demographic"
          >
            <option value="">All demographics</option>
            {DEMOGRAPHIC_CHOICES.map((id) => (
              <option key={id} value={id}>
                {id.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
          <select
            className="h-11 rounded-skeed-radius-sm border border-skeed-border bg-white px-3 text-sm"
            defaultValue={params.tier ?? 'flagship'}
            name="tier"
          >
            <option value="flagship">Flagship</option>
            <option value="generated">Generated</option>
          </select>
          <button className="skeed-cta-primary h-11" type="submit">
            Search
          </button>
        </form>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {components.map((component) => (
            <ComponentCard
              demographic={component.demographics[0] ?? 'productivity'}
              description={component.summary}
              href={component.href}
              key={component.id}
              meta={`${component.qualityTier} / ${component.demographics.join(', ')}`}
              style={previewStyleForDemographic(component.demographics[0] ?? 'productivity')}
              title={componentNameFromId(component.id)}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
