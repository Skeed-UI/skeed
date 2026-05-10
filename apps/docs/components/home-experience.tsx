'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { DemographicHomeShowcase, previewComponentByDemographic } from '@/components/demographic-home-showcase';
import { RealComponentPreview } from '@/components/real-component-preview';
import { ComponentCard, DemographicSurface, MetricStrip, SectionHeader } from '@/components/ui';
import { SHOWCASE_DEMOGRAPHIC_CHOICES, previewStyleForDemographic } from '@/lib/theme';
import { storyForDemographic } from '@/lib/showcase';

export type HomeComponentCard = {
  demographic: string;
  description: string;
  href: string;
  meta: string;
  title: string;
};

export function HomeExperience({
  components,
  metrics,
}: {
  components: HomeComponentCard[];
  metrics: Array<{ label: string; value: string; detail: string }>;
}) {
  const [selected, setSelected] = useState('health');
  const style = useMemo(() => previewStyleForDemographic(selected), [selected]);
  const story = storyForDemographic(selected);
  const componentId = previewComponentByDemographic[selected] ?? 'productivity/dashboard-card/cozy/default';

  useEffect(() => {
    const root = document.documentElement;
    const entries = Object.entries(style).filter(([key]) => key.startsWith('--')) as Array<
      [string, string]
    >;
    const previous = entries.map(([key]) => [key, root.style.getPropertyValue(key)] as const);
    for (const [key, value] of entries) {
      root.style.setProperty(key, value);
    }
    return () => {
      for (const [key, value] of previous) {
        if (value) root.style.setProperty(key, value);
        else root.style.removeProperty(key);
      }
    };
  }, [style]);

  return (
    <main className="skeed-live-page" style={style}>
      <section className="mx-auto grid max-w-docs gap-10 px-5 py-14 md:py-20 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
        <div>
          <p className="skeed-eyebrow mb-4">Live target: {story.label}</p>
          <h1 className="skeed-type-hero max-w-4xl text-skeed-fg">
            Design-system context that changes with the audience
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-skeed-muted">
            Skeed turns component selection, type scale, motion, CTA emphasis, and color into
            demographic-aware defaults that AI agents can explain and install.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className="skeed-cta-primary" href="/playground">
              Generate for {story.label}
            </Link>
            <Link className="skeed-cta-secondary" href="/components">
              Browse components
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            {SHOWCASE_DEMOGRAPHIC_CHOICES.slice(0, 8).map((id) => {
              const target = storyForDemographic(id);
              return (
                <button
                  className={`rounded-full border px-3 py-1 text-sm font-semibold transition ${
                    selected === id
                      ? 'border-skeed-brand bg-skeed-brand text-white'
                      : 'border-skeed-border bg-skeed-surface/70 text-skeed-muted hover:border-skeed-brand hover:text-skeed-fg'
                  }`}
                  key={id}
                  onClick={() => setSelected(id)}
                  type="button"
                >
                  {target.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="skeed-hero-stage p-3 md:p-4">
          <DemographicSurface compact story={story} style={style} />
        </div>
      </section>

      <MetricStrip items={metrics} />

      <DemographicHomeShowcase selected={selected} onSelectedChange={setSelected} />

      <section className="mx-auto max-w-docs px-5 py-14">
        <SectionHeader
          body={`These are real @skeed/ui components rendered under the active ${story.label} target, not isolated screenshots or token-only mockups.`}
          eyebrow="Real component previews"
          title="The whole page is the preview."
        />
        <div className="mt-8 grid gap-5">
          <RealComponentPreview componentId={componentId} demographic={selected} style={style} />
          <div className="grid gap-5 lg:grid-cols-2">
            <RealComponentPreview
              componentId="ai-apps/command-palette/comfy/default"
              demographic={selected}
              style={style}
            />
            <RealComponentPreview
              componentId="classic/pricing-card/cozy/default"
              demographic={selected}
              style={style}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-docs px-5 py-14">
        <SectionHeader
          action={
            <Link className="text-sm font-semibold text-skeed-brand hover:underline" href="/components">
              View all
            </Link>
          }
          body="The public gallery stays installable, but the surrounding page now demonstrates how Skeed tokens control hierarchy, copy, motion posture, and visual temperature together."
          eyebrow="Flagship components"
          title={`${story.label} page feel, production component breadth.`}
        />
        <div className="skeed-preview-fit-grid mt-8 grid gap-4">
          {components.map((component) => (
            <ComponentCard
              demographic={selected}
              description={component.description}
              href={component.href}
              key={component.href}
              meta={`${component.meta} / viewed as ${story.label}`}
              style={style}
              title={component.title}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
