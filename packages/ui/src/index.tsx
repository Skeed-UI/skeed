import type * as React from 'react';

type Feature = {
  id: string;
  title: string;
  description: string;
};

type Stat = {
  label: string;
  value: string;
  detail?: string;
};

export function FlagshipHero({
  eyebrow = 'Built with Skeed',
  headline,
  subtext,
  ctaLabel = 'Get started',
  secondaryLabel = 'See details',
}: {
  eyebrow?: string;
  headline: string;
  subtext: string;
  ctaLabel?: string;
  secondaryLabel?: string;
}): React.ReactElement {
  return (
    <section className="relative overflow-hidden bg-skeed-bg px-6 py-20 text-skeed-fg">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.08fr_.92fr] lg:items-center">
        <div className="skeed-enter-slide-up">
          <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-skeed-accent">
            {eyebrow}
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">{headline}</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-skeed-muted sm:text-lg">
            {subtext}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              className="skeed-press-soft inline-flex items-center justify-center rounded-skeed bg-skeed-brand px-5 py-3 text-sm font-semibold text-white shadow-sm transition focus-visible:skeed-focus-ring"
              href="#start"
            >
              {ctaLabel}
            </a>
            <a
              className="skeed-hover-lift inline-flex items-center justify-center rounded-skeed border border-skeed-border bg-white px-5 py-3 text-sm font-semibold text-skeed-fg focus-visible:skeed-focus-ring"
              href="#details"
            >
              {secondaryLabel}
            </a>
          </div>
        </div>
        <div className="skeed-hover-lift rounded-[calc(var(--skeed-radius)*1.6)] border border-skeed-border bg-white p-5 shadow-sm">
          <div className="rounded-skeed bg-[linear-gradient(135deg,color-mix(in_srgb,var(--skeed-brand)_12%,white),color-mix(in_srgb,var(--skeed-accent)_10%,white))] p-6">
            <div className="h-2 w-24 rounded-full bg-skeed-brand/80" />
            <div className="mt-8 grid gap-3">
              <div className="h-16 rounded-skeed bg-white/80 shadow-sm" />
              <div className="h-16 rounded-skeed bg-white/70 shadow-sm" />
              <div className="h-16 rounded-skeed bg-white/60 shadow-sm" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FlagshipFeatureGrid({
  title,
  subtitle,
  features,
}: {
  title: string;
  subtitle?: string;
  features: Feature[];
}): React.ReactElement {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold tracking-normal text-skeed-fg">{title}</h2>
          {subtitle ? <p className="mt-3 text-skeed-muted">{subtitle}</p> : null}
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <article
              className="skeed-hover-lift rounded-skeed border border-skeed-border bg-white p-5"
              key={feature.id}
            >
              <div className="mb-4 h-9 w-9 rounded-full bg-skeed-brand/10" />
              <h3 className="font-semibold text-skeed-fg">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-skeed-muted">{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FlagshipKpiGrid({ stats }: { stats: Stat[] }): React.ReactElement {
  return (
    <section className="px-6 py-12">
      <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <article
            className="rounded-skeed border border-skeed-border bg-white p-5"
            key={stat.label}
          >
            <p className="text-sm text-skeed-muted">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-skeed-fg">{stat.value}</p>
            {stat.detail ? <p className="mt-2 text-sm text-skeed-muted">{stat.detail}</p> : null}
          </article>
        ))}
      </div>
    </section>
  );
}

export function FlagshipCTA({
  title,
  body,
  ctaLabel = 'Start now',
}: {
  title: string;
  body: string;
  ctaLabel?: string;
}): React.ReactElement {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-6 rounded-[calc(var(--skeed-radius)*1.5)] bg-skeed-fg p-8 text-white md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">{body}</p>
        </div>
        <a
          className="skeed-press-soft inline-flex shrink-0 rounded-skeed bg-white px-5 py-3 text-sm font-semibold text-skeed-fg focus-visible:skeed-focus-ring"
          href="#start"
        >
          {ctaLabel}
        </a>
      </div>
    </section>
  );
}

export * from './advanced';
export * from './ai';
export * from './data';
export * from './forms';
export * from './primitives';
export * from './specialized';
export * from './visualization';
