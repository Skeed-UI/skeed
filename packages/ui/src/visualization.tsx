import type * as React from 'react';

type WithClassName = {
  className?: string;
};

type Tone = 'brand' | 'accent' | 'success' | 'warning' | 'danger' | 'neutral';

const toneText: Record<Tone, string> = {
  accent: 'text-skeed-accent',
  brand: 'text-skeed-brand',
  danger: 'text-skeed-danger',
  neutral: 'text-skeed-muted',
  success: 'text-skeed-success',
  warning: 'text-skeed-warning',
};

const toneBg: Record<Tone, string> = {
  accent: 'bg-skeed-accent',
  brand: 'bg-skeed-brand',
  danger: 'bg-skeed-danger',
  neutral: 'bg-skeed-muted',
  success: 'bg-skeed-success',
  warning: 'bg-skeed-warning',
};

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

function pointsFromValues(values: number[], width: number, height: number): string {
  if (values.length === 0) {
    return '';
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);

  return values
    .map((value, index) => {
      const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}

export type SkeedSparklinePoint = {
  id: string;
  value: number;
};

export type SkeedSparklineProps = WithClassName & {
  points: SkeedSparklinePoint[];
  label?: string;
  tone?: Tone;
};

export function SkeedSparkline({
  className,
  label = 'Trend',
  points,
  tone = 'brand',
}: SkeedSparklineProps): React.ReactElement {
  const values = points.map((point) => point.value);
  const polyline = pointsFromValues(values, 160, 48);
  const last = values.at(-1);

  return (
    <figure className={cx('rounded-skeed border border-skeed-border bg-white p-4', className)}>
      <figcaption className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-skeed-muted">{label}</span>
        {last === undefined ? null : (
          <span className={cx('font-bold', toneText[tone])}>{last}</span>
        )}
      </figcaption>
      <svg aria-hidden="true" className="mt-3 h-12 w-full overflow-visible" viewBox="0 0 160 48">
        <polyline
          fill="none"
          points={polyline}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
          className={toneText[tone]}
        />
      </svg>
    </figure>
  );
}

export type SkeedDonutMeterProps = WithClassName & {
  value: number;
  label: string;
  detail?: string;
  tone?: Tone;
};

export function SkeedDonutMeter({
  className,
  detail,
  label,
  tone = 'brand',
  value,
}: SkeedDonutMeterProps): React.ReactElement {
  const bounded = clamp(value);
  const circumference = 2 * Math.PI * 38;
  const offset = circumference - (bounded / 100) * circumference;

  return (
    <figure
      className={cx(
        'grid grid-cols-[6rem_1fr] items-center gap-4 rounded-skeed border border-skeed-border bg-white p-4',
        className,
      )}
    >
      <svg
        aria-label={`${label}: ${bounded}%`}
        className="h-24 w-24"
        role="img"
        viewBox="0 0 96 96"
      >
        <title>{`${label}: ${bounded}%`}</title>
        <circle
          className="text-skeed-color-neutral-100"
          cx="48"
          cy="48"
          fill="none"
          r="38"
          stroke="currentColor"
          strokeWidth="10"
        />
        <circle
          className={cx('origin-center -rotate-90 transition-[stroke-dashoffset]', toneText[tone])}
          cx="48"
          cy="48"
          fill="none"
          r="38"
          stroke="currentColor"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          strokeWidth="10"
        />
        <text
          className="fill-skeed-fg text-base font-bold"
          dominantBaseline="middle"
          textAnchor="middle"
          x="48"
          y="50"
        >
          {bounded}%
        </text>
      </svg>
      <figcaption>
        <p className="font-semibold text-skeed-fg">{label}</p>
        {detail ? <p className="mt-1 text-sm leading-6 text-skeed-muted">{detail}</p> : null}
      </figcaption>
    </figure>
  );
}

export type SkeedBarListItem = {
  id: string;
  label: string;
  value: number;
  detail?: string;
  tone?: Tone;
};

export type SkeedBarListProps = WithClassName & {
  items: SkeedBarListItem[];
  max?: number;
};

export function SkeedBarList({ className, items, max }: SkeedBarListProps): React.ReactElement {
  const resolvedMax = Math.max(1, max ?? Math.max(...items.map((item) => item.value), 1));

  return (
    <div
      className={cx('grid gap-3 rounded-skeed border border-skeed-border bg-white p-4', className)}
    >
      {items.map((item) => {
        const width = clamp((item.value / resolvedMax) * 100);
        const tone = item.tone ?? 'brand';

        return (
          <div className="grid gap-1.5" key={item.id}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium text-skeed-fg">{item.label}</span>
              <span className="text-skeed-muted">{item.detail ?? item.value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-skeed-color-neutral-100">
              <div
                aria-label={`${item.label}: ${item.value}`}
                aria-valuemax={resolvedMax}
                aria-valuemin={0}
                aria-valuenow={clamp(item.value, 0, resolvedMax)}
                className={cx('h-full rounded-full transition-[width]', toneBg[tone])}
                role="progressbar"
                style={{ width: `${width}%` }}
                tabIndex={0}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export type SkeedHeatmapCell = {
  id: string;
  label: string;
  value: number;
};

export type SkeedHeatmapProps = WithClassName & {
  cells: SkeedHeatmapCell[];
  columns?: 7 | 12;
  label?: string;
};

export function SkeedHeatmap({
  cells,
  className,
  columns = 7,
  label = 'Activity heatmap',
}: SkeedHeatmapProps): React.ReactElement {
  const max = Math.max(1, ...cells.map((cell) => cell.value));

  return (
    <figure className={cx('rounded-skeed border border-skeed-border bg-white p-4', className)}>
      <figcaption className="mb-3 text-sm font-semibold text-skeed-fg">{label}</figcaption>
      <div
        aria-hidden="true"
        className={cx('grid gap-1', columns === 12 ? 'grid-cols-12' : 'grid-cols-7')}
      >
        {cells.map((cell) => {
          const intensity = clamp(cell.value / max, 0.12, 1);

          return (
            <div
              className="aspect-square rounded-[4px] bg-skeed-brand transition-transform hover:scale-110"
              key={cell.id}
              style={{ opacity: intensity }}
              title={`${cell.label}: ${cell.value}`}
            />
          );
        })}
      </div>
      <dl className="sr-only">
        {cells.map((cell) => (
          <div key={cell.id}>
            <dt>{cell.label}</dt>
            <dd>{cell.value}</dd>
          </div>
        ))}
      </dl>
    </figure>
  );
}

export type SkeedGaugeProps = WithClassName & {
  value: number;
  label: string;
  minLabel?: string;
  maxLabel?: string;
  tone?: Tone;
};

export function SkeedGauge({
  className,
  label,
  maxLabel = 'High',
  minLabel = 'Low',
  tone = 'brand',
  value,
}: SkeedGaugeProps): React.ReactElement {
  const bounded = clamp(value);

  return (
    <figure className={cx('rounded-skeed border border-skeed-border bg-white p-4', className)}>
      <figcaption className="flex items-center justify-between text-sm">
        <span className="font-semibold text-skeed-fg">{label}</span>
        <span className={cx('font-bold', toneText[tone])}>{bounded}%</span>
      </figcaption>
      <div className="relative mt-5 h-16 overflow-hidden">
        <div className="absolute inset-x-0 bottom-0 h-32 rounded-t-full bg-skeed-color-neutral-100" />
        <div
          className={cx(
            'absolute bottom-0 left-1/2 h-14 w-1 origin-bottom rounded-full transition-transform',
            toneBg[tone],
          )}
          style={{ transform: `translateX(-50%) rotate(${bounded * 1.8 - 90}deg)` }}
        />
        <div className="absolute bottom-0 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-skeed-fg" />
      </div>
      <div className="mt-2 flex justify-between text-xs text-skeed-muted">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
      <p className="sr-only">{`${label}: ${bounded}%`}</p>
    </figure>
  );
}

export type SkeedFunnelStep = {
  id: string;
  label: string;
  value: number;
  detail?: string;
};

export type SkeedFunnelProps = WithClassName & {
  steps: SkeedFunnelStep[];
  label?: string;
};

export function SkeedFunnel({
  className,
  label = 'Conversion funnel',
  steps,
}: SkeedFunnelProps): React.ReactElement {
  const max = Math.max(1, ...steps.map((step) => step.value));

  return (
    <figure className={cx('rounded-skeed border border-skeed-border bg-white p-4', className)}>
      <figcaption className="mb-4 font-semibold text-skeed-fg">{label}</figcaption>
      <div className="grid gap-2">
        {steps.map((step) => {
          const width = clamp((step.value / max) * 100, 12, 100);

          return (
            <div className="grid gap-1" key={step.id}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-skeed-fg">{step.label}</span>
                <span className="text-skeed-muted">{step.detail ?? step.value}</span>
              </div>
              <div
                aria-label={`${step.label}: ${step.value}`}
                aria-valuemax={max}
                aria-valuemin={0}
                aria-valuenow={clamp(step.value, 0, max)}
                className="skeed-hover-lift h-9 rounded-skeed bg-skeed-color-brand-100"
                role="progressbar"
                style={{ width: `${width}%` }}
                tabIndex={0}
              >
                <div className="h-full rounded-skeed bg-skeed-color-brand-300" />
              </div>
            </div>
          );
        })}
      </div>
    </figure>
  );
}

export type SkeedScoreAxis = {
  id: string;
  label: string;
  value: number;
};

export type SkeedRadarScoreProps = WithClassName & {
  axes: SkeedScoreAxis[];
  label?: string;
};

export function SkeedRadarScore({
  axes,
  className,
  label = 'Readiness score',
}: SkeedRadarScoreProps): React.ReactElement {
  const center = 56;
  const radius = 42;
  const points = axes
    .map((axis, index) => {
      const angle = (Math.PI * 2 * index) / axes.length - Math.PI / 2;
      const axisRadius = radius * (clamp(axis.value) / 100);
      return `${center + Math.cos(angle) * axisRadius},${center + Math.sin(angle) * axisRadius}`;
    })
    .join(' ');

  return (
    <figure className={cx('rounded-skeed border border-skeed-border bg-white p-4', className)}>
      <figcaption className="mb-3 font-semibold text-skeed-fg">{label}</figcaption>
      <div className="grid gap-4 sm:grid-cols-[8rem_1fr] sm:items-center">
        <svg aria-hidden="true" className="h-32 w-32" viewBox="0 0 112 112">
          <circle
            className="fill-skeed-color-neutral-50 stroke-skeed-border"
            cx={center}
            cy={center}
            r={radius}
          />
          <polygon
            className="fill-skeed-color-brand-100 stroke-skeed-brand"
            points={points}
            strokeWidth="2"
          />
        </svg>
        <dl className="grid gap-2 text-sm">
          {axes.map((axis) => (
            <div className="flex items-center justify-between gap-3" key={axis.id}>
              <dt className="text-skeed-muted">{axis.label}</dt>
              <dd className="font-semibold text-skeed-fg">{clamp(axis.value)}%</dd>
            </div>
          ))}
        </dl>
      </div>
    </figure>
  );
}

export type SkeedStatMatrixItem = {
  id: string;
  label: string;
  value: string;
  detail?: string;
  tone?: Tone;
};

export type SkeedStatMatrixProps = WithClassName & {
  items: SkeedStatMatrixItem[];
};

export function SkeedStatMatrix({ className, items }: SkeedStatMatrixProps): React.ReactElement {
  return (
    <dl
      className={cx(
        'grid gap-px overflow-hidden rounded-skeed border border-skeed-border bg-skeed-border sm:grid-cols-2',
        className,
      )}
    >
      {items.map((item) => {
        const tone = item.tone ?? 'brand';

        return (
          <div className="bg-white p-4" key={item.id}>
            <dt className="text-sm text-skeed-muted">{item.label}</dt>
            <dd className={cx('mt-2 text-2xl font-bold', toneText[tone])}>{item.value}</dd>
            {item.detail ? <p className="mt-1 text-sm text-skeed-muted">{item.detail}</p> : null}
          </div>
        );
      })}
    </dl>
  );
}

export type SkeedRetentionCell = {
  id: string;
  cohort: string;
  period: string;
  value: number;
};

export type SkeedRetentionGridProps = WithClassName & {
  cells: SkeedRetentionCell[];
  label?: string;
};

export function SkeedRetentionGrid({
  cells,
  className,
  label = 'Retention grid',
}: SkeedRetentionGridProps): React.ReactElement {
  const max = Math.max(1, ...cells.map((cell) => cell.value));

  return (
    <figure
      className={cx(
        'overflow-x-auto rounded-skeed border border-skeed-border bg-white p-4',
        className,
      )}
    >
      <figcaption className="mb-3 font-semibold text-skeed-fg">{label}</figcaption>
      <div
        aria-hidden="true"
        className="grid min-w-[34rem] grid-cols-[repeat(auto-fit,minmax(4rem,1fr))] gap-1"
      >
        {cells.map((cell) => {
          const intensity = clamp(cell.value / max, 0.1, 1);

          return (
            <div
              className="rounded-[4px] bg-skeed-brand px-2 py-2 text-center text-xs font-medium text-white"
              key={cell.id}
              style={{ opacity: intensity }}
              title={`${cell.cohort} ${cell.period}: ${cell.value}%`}
            >
              {cell.value}%
            </div>
          );
        })}
      </div>
      <dl className="sr-only">
        {cells.map((cell) => (
          <div key={cell.id}>
            <dt>{`${cell.cohort} ${cell.period}`}</dt>
            <dd>{`${cell.value}%`}</dd>
          </div>
        ))}
      </dl>
    </figure>
  );
}
