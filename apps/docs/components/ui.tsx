import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import type { DemographicStory } from '@/lib/showcase';
import { fontProfileForDemographic } from '@/lib/theme';

export function PageHeader({
  eyebrow,
  title,
  body,
  action,
}: {
  eyebrow?: string;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <section className="mx-auto max-w-docs px-5 py-14 md:py-20">
      {eyebrow ? <p className="skeed-eyebrow mb-4">{eyebrow}</p> : null}
      <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <h1 className="skeed-type-hero max-w-4xl text-skeed-fg">{title}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-skeed-muted">{body}</p>
        </div>
        {action}
      </div>
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  body,
  action,
}: {
  eyebrow: string;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <p className="skeed-eyebrow">{eyebrow}</p>
        <h2 className="skeed-type-title mt-3">{title}</h2>
        {body ? <p className="mt-4 leading-7 text-skeed-muted">{body}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function MetricStrip({
  items,
}: {
  items: Array<{ label: string; value: string; detail: string }>;
}) {
  return (
    <div className="mx-auto grid max-w-docs gap-3 px-5 pb-12 md:grid-cols-3">
      {items.map((item) => (
        <div className="border-y border-skeed-border py-5" key={item.label}>
          <p className="text-sm text-skeed-muted">{item.label}</p>
          <p className="mt-2 font-skeed-display text-3xl font-bold">{item.value}</p>
          <p className="mt-1 text-sm text-skeed-muted">{item.detail}</p>
        </div>
      ))}
    </div>
  );
}

export function ComponentCard({
  href,
  title,
  description,
  meta,
  demographic = 'productivity',
  style,
}: {
  href: string;
  title: string;
  description: string;
  meta: string;
  demographic?: string;
  style?: CSSProperties;
}) {
  return (
    <Link
      className="skeed-component-card skeed-hover-lift group flex min-h-72 flex-col justify-between overflow-hidden rounded-skeed-radius-md border border-skeed-border bg-skeed-surface transition"
      href={href}
      style={style}
    >
      <div className="skeed-card-preview" data-demo={demographic}>
        <div className="skeed-card-preview-window">
          <span />
          <span />
          <span />
        </div>
        <div className="mt-5 grid grid-cols-[1fr_88px] gap-3">
          <div>
            <div className="skeed-card-preview-line w-4/5" />
            <div className="skeed-card-preview-line w-3/5" />
            <div className="mt-4 h-7 w-24 rounded-skeed-radius-sm bg-skeed-brand shadow-skeed-shadow-md" />
          </div>
          <div className="skeed-card-preview-meter">
            <span />
            <strong>{demographic.split('_')[0]}</strong>
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
        <p className="skeed-eyebrow">{meta}</p>
        <h2 className="mt-4 font-skeed-display text-xl font-bold text-skeed-fg">{title}</h2>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-skeed-muted">{description}</p>
        </div>
        <span className="mt-6 text-sm font-semibold text-skeed-brand group-hover:underline">
          View docs
        </span>
      </div>
    </Link>
  );
}

export function PreviewPanel({
  children,
  style,
  dark = false,
}: {
  children: ReactNode;
  style?: CSSProperties;
  dark?: boolean;
}) {
  return (
    <div
      className={`docs-preview-grid overflow-hidden rounded-skeed-radius-lg border border-skeed-border p-4 ${dark ? 'skeed-dark' : ''}`}
      data-skeed-theme={dark ? 'dark' : 'light'}
      style={style}
    >
      <div className="rounded-skeed-radius-md border border-skeed-border bg-skeed-surface p-6 shadow-skeed-shadow-md">
        {children}
      </div>
    </div>
  );
}

export function DemographicSurface({
  story,
  style,
  compact = false,
}: {
  story: DemographicStory;
  style?: CSSProperties;
  compact?: boolean;
}) {
  const fontProfile = fontProfileForDemographic(story.id);

  return (
    <div className="skeed-demo-surface" style={style}>
      <div className="skeed-demo-chrome">
        <span />
        <span />
        <span />
      </div>
      <div className="skeed-adaptive-surface-grid">
        <div className="min-w-0">
          <p className="skeed-eyebrow">{story.category}</p>
          <h3 className="skeed-type-title mt-3">{story.headline}</h3>
          <p className="mt-4 max-w-xl text-skeed-muted">{story.body}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <span className="skeed-cta-primary">{story.primary}</span>
            <span className="skeed-cta-secondary">{story.secondary}</span>
          </div>
          <div className="skeed-spec-grid mt-6">
            <SpecChip label="Typeface" value={fontProfile.label} />
            <SpecChip label="Tone" value={story.tone} />
            <SpecChip label="Density" value={story.density} />
            <SpecChip label="Motion" value={story.motion} />
          </div>
        </div>
        <div className="skeed-demo-card">
          <p className="text-xs font-bold uppercase tracking-[.12em] text-skeed-muted">{story.metricLabel}</p>
          <p className="mt-2 font-skeed-display text-4xl font-bold leading-none">{story.metricValue}</p>
          <p className="mt-2 text-sm text-skeed-muted">{story.metricDetail}</p>
          <div className="my-5 h-px bg-skeed-border" />
          <p className="font-semibold">{story.panelTitle}</p>
          <ul className="mt-3 space-y-2 text-sm text-skeed-muted">
            {story.panelItems.slice(0, compact ? 2 : 3).map((item) => (
              <li className="flex gap-2" key={item}>
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-skeed-accent" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function SpecChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-skeed-radius-sm border border-skeed-border bg-skeed-surface/75 p-3">
      <p className="text-[.68rem] font-bold uppercase tracking-[.11em] text-skeed-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

export function CodeBlock({ value }: { value: string }) {
  return (
    <pre className="max-w-full overflow-x-auto rounded-skeed-radius-md border border-skeed-border bg-skeed-color-neutral-950 p-4 text-xs leading-5 text-skeed-color-neutral-100">
      <code>{value}</code>
    </pre>
  );
}
