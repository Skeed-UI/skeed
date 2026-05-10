import { DemographicSurface, PageHeader } from '@/components/ui';
import { getDocsDemographic, previewStyleForDemographic, SHOWCASE_DEMOGRAPHIC_CHOICES } from '@/lib/registry';
import { allStories } from '@/lib/showcase';

export default function DemographicsPage() {
  const stories = allStories(SHOWCASE_DEMOGRAPHIC_CHOICES);

  return (
    <main>
      <PageHeader
        body="Compare Skeed presets as product decisions: typography, color temperature, CTA weight, density, motion posture, and the kind of copy a user should feel."
        eyebrow="Theme intelligence"
        title="Demographic choices that shape hierarchy"
      />
      <section className="mx-auto grid max-w-docs gap-7 px-5 pb-16">
        {stories.map((story) => {
          const item = getDocsDemographic(story.id);
          if (!item) return null;
          return (
            <article
              className="grid gap-5 rounded-[calc(var(--skeed-radius)+12px)] border border-skeed-border bg-skeed-surface/78 p-4 shadow-skeed-shadow-md lg:grid-cols-[.38fr_.62fr]"
              id={story.id}
              key={story.id}
            >
              <div className="flex flex-col justify-between p-2 md:p-4">
                <div>
                  <p className="skeed-eyebrow">{story.category}</p>
                  <h2 className="mt-3 font-skeed-display text-3xl font-bold leading-tight">
                    {story.label}
                  </h2>
                  <p className="mt-4 leading-7 text-skeed-muted">{story.body}</p>
                </div>
                <div className="mt-6">
                  <div className="skeed-token-strip" style={previewStyleForDemographic(story.id)}>
                    <Swatch label="brand" value="var(--skeed-brand)" />
                    <Swatch label="accent" value="var(--skeed-accent)" />
                    <Swatch label="surface" value="var(--skeed-surface-muted)" />
                    <Swatch label="border" value="var(--skeed-border)" />
                  </div>
                  <div className="mt-5 grid gap-2 text-sm text-skeed-muted sm:grid-cols-2">
                    <p>
                      <span className="font-semibold text-skeed-fg">Display:</span>{' '}
                      {item.typography.label}
                    </p>
                    <p>
                      <span className="font-semibold text-skeed-fg">Radius:</span>{' '}
                      {item.visual.radius}
                    </p>
                    <p>
                      <span className="font-semibold text-skeed-fg">Best for:</span>{' '}
                      {item.bestFor.slice(0, 2).join(', ')}
                    </p>
                    <p>
                      <span className="font-semibold text-skeed-fg">Motion:</span> {story.motion}
                    </p>
                  </div>
                </div>
              </div>
              <DemographicSurface story={story} style={previewStyleForDemographic(story.id)} />
            </article>
          );
        })}
      </section>
    </main>
  );
}

function Swatch({ label, value }: { label: string; value: string }) {
  return (
    <div className="skeed-token-swatch">
      <span style={{ background: value }} />
      <p>{label}</p>
    </div>
  );
}
