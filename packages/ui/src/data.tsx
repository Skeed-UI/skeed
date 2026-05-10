import type * as React from 'react';

type SkeedStatus = 'success' | 'warning' | 'danger' | 'info' | 'neutral';
type SkeedTrend = 'up' | 'down' | 'flat';
type SkeedTone = 'brand' | 'accent' | 'success' | 'danger' | 'neutral';

type WithClassName = {
  className?: string;
};

type ActionSlot = {
  label: string;
  href?: string;
  onClick?: () => void;
  current?: boolean;
};

type DashboardCardItem = {
  label: string;
  value: string;
  detail?: string;
};

export type SkeedDashboardCardProps = WithClassName & {
  title: string;
  eyebrow?: string;
  description?: string;
  value?: string;
  trend?: string;
  trendTone?: Exclude<SkeedStatus, 'warning' | 'info'>;
  actions?: ActionSlot[];
  items?: DashboardCardItem[];
  children?: React.ReactNode;
};

export type SkeedMetricTrendProps = WithClassName & {
  label: string;
  value: string;
  change: string;
  trend?: SkeedTrend;
  caption?: string;
  points?: number[];
};

export type SkeedDataTableColumn<Row extends Record<string, React.ReactNode>> = {
  key: keyof Row;
  header: React.ReactNode;
  align?: 'left' | 'right' | 'center';
};

export type SkeedDataTableProps<Row extends Record<string, React.ReactNode>> = WithClassName & {
  caption?: string;
  columns: Array<SkeedDataTableColumn<Row>>;
  rows: Array<Row & { id?: string }>;
  emptyState?: React.ReactNode;
};

type FeedItem = {
  id: string;
  title: string;
  body?: React.ReactNode;
  time?: string;
  actor?: string;
  status?: SkeedStatus;
};

export type SkeedActivityFeedProps = WithClassName & {
  title?: string;
  items: FeedItem[];
  footer?: React.ReactNode;
};

type PricingFeature = {
  id?: string;
  label: React.ReactNode;
  included?: boolean;
};

export type SkeedPricingCardProps = WithClassName & {
  name: string;
  price: string;
  period?: string;
  description?: string;
  features: PricingFeature[];
  highlighted?: boolean;
  badge?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

type FAQItem = {
  question: string;
  answer: React.ReactNode;
  open?: boolean;
};

export type SkeedFAQProps = WithClassName & {
  title?: string;
  items: FAQItem[];
};

type NotificationItem = {
  id: string;
  title: string;
  body?: React.ReactNode;
  time?: string;
  unread?: boolean;
  status?: SkeedStatus;
};

export type SkeedNotificationListProps = WithClassName & {
  title?: string;
  notifications: NotificationItem[];
};

type ComparisonFeature = {
  label: string;
  values: Array<React.ReactNode | boolean>;
};

export type SkeedComparisonTableProps = WithClassName & {
  plans: string[];
  features: ComparisonFeature[];
  caption?: string;
};

type KanbanColumn = {
  id: string;
  title: string;
  items: Array<{
    id: string;
    title: string;
    meta?: string;
    status?: SkeedStatus;
  }>;
};

export type SkeedKanbanPreviewProps = WithClassName & {
  title?: string;
  columns: KanbanColumn[];
};

type CalendarDay = {
  id: string;
  label: string;
  date: string;
  detail?: string;
  active?: boolean;
  complete?: boolean;
};

export type SkeedCalendarStripProps = WithClassName & {
  days: CalendarDay[];
  ariaLabel?: string;
};

type WorkoutPlanDay = {
  id: string;
  day: string;
  title: string;
  duration?: string;
  intensity?: string;
  complete?: boolean;
};

export type SkeedWorkoutPlanProps = WithClassName & {
  title?: string;
  summary?: string;
  days: WorkoutPlanDay[];
};

export type SkeedGoalProgressProps = WithClassName & {
  title: string;
  value: number;
  max?: number;
  label?: string;
  milestones?: Array<{ label: string; reached?: boolean }>;
};

export type SkeedInsightCardProps = WithClassName & {
  title: string;
  insight: React.ReactNode;
  metric?: string;
  tone?: SkeedTone;
  action?: ActionSlot;
};

type ResourceItem = {
  id: string;
  title: string;
  description?: React.ReactNode;
  meta?: string;
  href?: string;
  status?: SkeedStatus;
};

export type SkeedResourceListProps = WithClassName & {
  title?: string;
  resources: ResourceItem[];
};

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

function clampPercent(value: number, max = 100): number {
  if (!Number.isFinite(value) || max <= 0) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round((value / max) * 100)));
}

function sparkBars(points: number[]): Array<{ key: string; height: number }> {
  if (points.length === 0) {
    return [];
  }

  const max = Math.max(...points);
  const seen: Record<string, number> = {};
  return points.map((point) => {
    const height = clampPercent(point, max);
    const countKey = String(point);
    seen[countKey] = (seen[countKey] ?? 0) + 1;
    return {
      key: `${point}-${seen[countKey]}`,
      height,
    };
  });
}

function statusClasses(status: SkeedStatus = 'neutral'): string {
  const classes: Record<SkeedStatus, string> = {
    success:
      'border-skeed-color-success-200 bg-skeed-color-success-50 text-skeed-color-success-700',
    warning:
      'border-skeed-color-warning-200 bg-skeed-color-warning-50 text-skeed-color-warning-800',
    danger: 'border-skeed-color-danger-200 bg-skeed-color-danger-50 text-skeed-color-danger-700',
    info: 'border-skeed-color-info-200 bg-skeed-color-info-50 text-skeed-color-info-700',
    neutral: 'border-skeed-border bg-skeed-bg text-skeed-muted',
  };
  return classes[status];
}

function toneClasses(tone: SkeedTone = 'brand'): string {
  const classes: Record<SkeedTone, string> = {
    brand: 'bg-skeed-brand text-white',
    accent: 'bg-skeed-accent text-white',
    success: 'bg-skeed-success text-white',
    danger: 'bg-skeed-danger text-white',
    neutral: 'bg-skeed-fg text-white',
  };
  return classes[tone];
}

function rowKey<Row extends Record<string, React.ReactNode>>(
  row: Row & { id?: string },
  columns: Array<SkeedDataTableColumn<Row>>,
): string {
  return row.id ?? columns.map((column) => String(row[column.key] ?? '')).join('|');
}

function ActionLink({
  action,
  primary = false,
}: { action: ActionSlot; primary?: boolean }): React.ReactElement {
  const className = cn(
    'skeed-press-soft inline-flex items-center justify-center rounded-skeed px-3 py-2 text-sm font-semibold transition focus-visible:skeed-focus-ring',
    primary
      ? 'bg-skeed-brand text-white shadow-sm'
      : 'border border-skeed-border bg-white text-skeed-fg hover:border-skeed-color-brand-300',
  );

  if (action.href) {
    return (
      <a
        aria-current={action.current ? 'page' : undefined}
        className={className}
        href={action.href}
      >
        {action.label}
      </a>
    );
  }

  return (
    <button className={className} onClick={action.onClick} type="button">
      {action.label}
    </button>
  );
}

export function SkeedDashboardCard({
  title,
  eyebrow,
  description,
  value,
  trend,
  trendTone = 'neutral',
  actions = [],
  items = [],
  children,
  className,
}: SkeedDashboardCardProps): React.ReactElement {
  return (
    <section
      className={cn(
        'skeed-hover-lift rounded-skeed border border-skeed-border bg-white p-5 text-skeed-fg shadow-sm',
        className,
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-wide text-skeed-accent">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="mt-1 text-lg font-bold tracking-normal text-skeed-fg">{title}</h2>
          {description ? (
            <p className="mt-2 max-w-xl text-sm leading-6 text-skeed-muted">{description}</p>
          ) : null}
        </div>
        {actions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {actions.map((action, index) => (
              <ActionLink action={action} key={action.label} primary={index === 0} />
            ))}
          </div>
        ) : null}
      </div>
      {value ? (
        <div className="mt-5 flex items-end gap-3">
          <p className="text-3xl font-bold tracking-normal text-skeed-fg">{value}</p>
          {trend ? (
            <span
              className={cn(
                'mb-1 rounded-full border px-2 py-1 text-xs font-semibold',
                statusClasses(trendTone),
              )}
            >
              {trend}
            </span>
          ) : null}
        </div>
      ) : null}
      {items.length > 0 ? (
        <dl className="skeed-adaptive-grid-dense mt-5 grid gap-3">
          {items.map((item) => (
            <div
              className="rounded-skeed border border-skeed-border bg-skeed-bg p-3"
              key={item.label}
            >
              <dt className="text-xs font-medium uppercase tracking-wide text-skeed-muted">
                {item.label}
              </dt>
              <dd className="mt-1 text-base font-semibold text-skeed-fg">{item.value}</dd>
              {item.detail ? (
                <dd className="mt-1 text-xs text-skeed-muted">{item.detail}</dd>
              ) : null}
            </div>
          ))}
        </dl>
      ) : null}
      {children ? <div className="mt-5">{children}</div> : null}
    </section>
  );
}

export function SkeedMetricTrend({
  label,
  value,
  change,
  trend = 'flat',
  caption,
  points = [],
  className,
}: SkeedMetricTrendProps): React.ReactElement {
  const trendTone = trend === 'up' ? 'success' : trend === 'down' ? 'danger' : 'neutral';
  const normalizedPoints = sparkBars(points);

  return (
    <article
      className={cn('rounded-skeed border border-skeed-border bg-white p-5 shadow-sm', className)}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-skeed-muted">{label}</p>
          <p className="mt-2 text-3xl font-bold text-skeed-fg">{value}</p>
        </div>
        <span
          className={cn(
            'rounded-full border px-2.5 py-1 text-xs font-semibold',
            statusClasses(trendTone),
          )}
        >
          {change}
        </span>
      </div>
      {normalizedPoints.length > 0 ? (
        <div aria-hidden="true" className="mt-5 flex h-16 items-end gap-1">
          {normalizedPoints.map((point) => (
            <span
              className="block min-h-[8px] flex-1 rounded-t-skeed bg-skeed-color-brand-300"
              key={point.key}
              style={{ height: `${Math.max(8, point.height)}%` }}
            />
          ))}
        </div>
      ) : null}
      {caption ? <p className="mt-4 text-sm leading-6 text-skeed-muted">{caption}</p> : null}
    </article>
  );
}

export function SkeedDataTable<Row extends Record<string, React.ReactNode>>({
  caption,
  columns,
  rows,
  emptyState = 'No rows to display.',
  className,
}: SkeedDataTableProps<Row>): React.ReactElement {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-skeed border border-skeed-border bg-white shadow-sm',
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-skeed-border text-sm">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead className="bg-skeed-bg text-skeed-muted">
            <tr>
              {columns.map((column) => (
                <th
                  className={cn(
                    'whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide',
                    column.align === 'right' && 'text-right',
                    column.align === 'center' && 'text-center',
                  )}
                  key={String(column.key)}
                  scope="col"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-skeed-border text-skeed-fg">
            {rows.length > 0 ? (
              rows.map((row) => (
                <tr className="transition hover:bg-skeed-bg" key={rowKey(row, columns)}>
                  {columns.map((column) => (
                    <td
                      className={cn(
                        'whitespace-nowrap px-4 py-3',
                        column.align === 'right' && 'text-right',
                        column.align === 'center' && 'text-center',
                      )}
                      key={String(column.key)}
                    >
                      {row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-8 text-center text-skeed-muted" colSpan={columns.length}>
                  {emptyState}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SkeedActivityFeed({
  title = 'Activity',
  items,
  footer,
  className,
}: SkeedActivityFeedProps): React.ReactElement {
  return (
    <section
      className={cn('rounded-skeed border border-skeed-border bg-white p-5 shadow-sm', className)}
    >
      <h2 className="text-lg font-bold text-skeed-fg">{title}</h2>
      <ol className="mt-5 space-y-4">
        {items.map((item) => (
          <li className="flex gap-3" key={item.id}>
            <span
              aria-hidden="true"
              className={cn(
                'mt-1 h-2.5 w-2.5 shrink-0 rounded-full border',
                statusClasses(item.status),
              )}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold text-skeed-fg">{item.title}</p>
                {item.time ? <time className="text-xs text-skeed-muted">{item.time}</time> : null}
              </div>
              {item.actor ? (
                <p className="mt-1 text-xs font-medium text-skeed-accent">{item.actor}</p>
              ) : null}
              {item.body ? (
                <div className="mt-1 text-sm leading-6 text-skeed-muted">{item.body}</div>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
      {footer ? <div className="mt-5 border-t border-skeed-border pt-4">{footer}</div> : null}
    </section>
  );
}

export function SkeedPricingCard({
  name,
  price,
  period,
  description,
  features,
  highlighted = false,
  badge,
  ctaLabel = 'Choose plan',
  ctaHref = '#',
  className,
}: SkeedPricingCardProps): React.ReactElement {
  return (
    <article
      className={cn(
        'skeed-hover-lift flex h-full flex-col rounded-skeed border bg-white p-6 shadow-sm',
        highlighted
          ? 'border-skeed-brand ring-2 ring-skeed-color-brand-100'
          : 'border-skeed-border',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-xl font-bold text-skeed-fg">{name}</h2>
        {badge ? (
          <span className="rounded-full bg-skeed-color-brand-50 px-2.5 py-1 text-xs font-semibold text-skeed-color-brand-700">
            {badge}
          </span>
        ) : null}
      </div>
      {description ? (
        <p className="mt-3 text-sm leading-6 text-skeed-muted">{description}</p>
      ) : null}
      <div className="mt-5 flex items-baseline gap-2">
        <p className="text-4xl font-bold text-skeed-fg">{price}</p>
        {period ? <p className="text-sm text-skeed-muted">{period}</p> : null}
      </div>
      <ul className="mt-6 flex-1 space-y-3">
        {features.map((feature) => (
          <li
            className="flex gap-3 text-sm leading-6 text-skeed-muted"
            key={feature.id ?? String(feature.label)}
          >
            <span
              className={cn(
                'mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                feature.included === false
                  ? 'bg-skeed-bg text-skeed-muted'
                  : 'bg-skeed-color-success-50 text-skeed-color-success-700',
              )}
            >
              {feature.included === false ? '-' : 'Yes'}
            </span>
            <span>{feature.label}</span>
          </li>
        ))}
      </ul>
      <a
        className={cn(
          'skeed-press-soft mt-6 inline-flex items-center justify-center rounded-skeed px-4 py-3 text-sm font-semibold focus-visible:skeed-focus-ring',
          highlighted
            ? 'bg-skeed-brand text-white'
            : 'border border-skeed-border bg-white text-skeed-fg',
        )}
        href={ctaHref}
      >
        {ctaLabel}
      </a>
    </article>
  );
}

export function SkeedFAQ({
  title = 'Questions',
  items,
  className,
}: SkeedFAQProps): React.ReactElement {
  return (
    <section
      className={cn('rounded-skeed border border-skeed-border bg-white p-5 shadow-sm', className)}
    >
      <h2 className="text-lg font-bold text-skeed-fg">{title}</h2>
      <div className="mt-4 divide-y divide-skeed-border">
        {items.map((item) => (
          <details className="group py-4" key={item.question} open={item.open}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-skeed-fg focus-visible:skeed-focus-ring">
              <span>{item.question}</span>
              <span
                aria-hidden="true"
                className="text-lg text-skeed-muted transition group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <div className="mt-3 text-sm leading-6 text-skeed-muted">{item.answer}</div>
          </details>
        ))}
      </div>
    </section>
  );
}

export function SkeedNotificationList({
  title = 'Notifications',
  notifications,
  className,
}: SkeedNotificationListProps): React.ReactElement {
  return (
    <section
      className={cn('rounded-skeed border border-skeed-border bg-white p-5 shadow-sm', className)}
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-skeed-fg">{title}</h2>
        <span className="rounded-full bg-skeed-color-brand-50 px-2.5 py-1 text-xs font-semibold text-skeed-color-brand-700">
          {notifications.filter((notification) => notification.unread).length} unread
        </span>
      </div>
      <ul className="mt-4 divide-y divide-skeed-border">
        {notifications.map((notification) => (
          <li className="flex gap-3 py-4" key={notification.id}>
            <span
              aria-hidden="true"
              className={cn(
                'mt-1 h-2.5 w-2.5 shrink-0 rounded-full border',
                statusClasses(notification.status),
              )}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p
                  className={cn(
                    'font-semibold text-skeed-fg',
                    notification.unread && 'text-skeed-brand',
                  )}
                >
                  {notification.title}
                </p>
                {notification.time ? (
                  <time className="text-xs text-skeed-muted">{notification.time}</time>
                ) : null}
              </div>
              {notification.body ? (
                <div className="mt-1 text-sm leading-6 text-skeed-muted">{notification.body}</div>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function SkeedComparisonTable({
  plans,
  features,
  caption,
  className,
}: SkeedComparisonTableProps): React.ReactElement {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-skeed border border-skeed-border bg-white shadow-sm',
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-skeed-border text-sm">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead className="bg-skeed-bg">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-skeed-fg" scope="col">
                Feature
              </th>
              {plans.map((plan) => (
                <th
                  className="px-4 py-3 text-center font-semibold text-skeed-fg"
                  key={plan}
                  scope="col"
                >
                  {plan}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-skeed-border">
            {features.map((feature) => (
              <tr className="hover:bg-skeed-bg" key={feature.label}>
                <th className="px-4 py-3 text-left font-medium text-skeed-fg" scope="row">
                  {feature.label}
                </th>
                {plans.map((plan, index) => {
                  const value = feature.values[index];
                  return (
                    <td
                      className="px-4 py-3 text-center text-skeed-muted"
                      key={`${feature.label}-${plan}`}
                    >
                      {typeof value === 'boolean' ? (
                        <span
                          className={cn(
                            'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                            value
                              ? 'bg-skeed-color-success-50 text-skeed-color-success-700'
                              : 'bg-skeed-bg text-skeed-muted',
                          )}
                        >
                          {value ? 'Yes' : '-'}
                        </span>
                      ) : (
                        value
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SkeedKanbanPreview({
  title = 'Plan preview',
  columns,
  className,
}: SkeedKanbanPreviewProps): React.ReactElement {
  return (
    <section
      className={cn(
        'rounded-skeed border border-skeed-border bg-skeed-bg p-4 shadow-sm',
        className,
      )}
    >
      <h2 className="px-1 text-lg font-bold text-skeed-fg">{title}</h2>
      <div className="skeed-adaptive-grid-3 mt-4 grid gap-4">
        {columns.map((column) => (
          <div className="rounded-skeed border border-skeed-border bg-white p-3" key={column.id}>
            <div className="flex items-center justify-between gap-3">
              <h3 className="skeed-smart-text text-sm font-semibold uppercase tracking-wide text-skeed-muted">
                {column.title}
              </h3>
              <span className="rounded-full bg-skeed-bg px-2 py-1 text-xs font-semibold text-skeed-muted">
                {column.items.length}
              </span>
            </div>
            <ul className="mt-3 space-y-3">
              {column.items.map((item) => (
                <li
                  className="skeed-hover-lift rounded-skeed border border-skeed-border bg-white p-3"
                  key={item.id}
                >
                  <div className="flex items-start gap-2">
                    <span
                      aria-hidden="true"
                      className={cn('mt-1 h-2 w-2 rounded-full border', statusClasses(item.status))}
                    />
                    <div>
                      <p className="skeed-smart-title text-sm font-semibold text-skeed-fg">
                        {item.title}
                      </p>
                      {item.meta ? (
                        <p className="skeed-smart-text mt-1 text-xs text-skeed-muted">
                          {item.meta}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

export function SkeedCalendarStrip({
  days,
  ariaLabel = 'Calendar',
  className,
}: SkeedCalendarStripProps): React.ReactElement {
  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        'overflow-x-auto rounded-skeed border border-skeed-border bg-white p-3 shadow-sm',
        className,
      )}
    >
      <ol className="flex min-w-max gap-2">
        {days.map((day) => (
          <li key={day.id}>
            <a
              aria-current={day.active ? 'date' : undefined}
              className={cn(
                'skeed-press-soft block min-w-[5.25rem] rounded-skeed border px-3 py-3 text-center transition focus-visible:skeed-focus-ring',
                day.active
                  ? 'border-skeed-brand bg-skeed-brand text-white'
                  : 'border-skeed-border bg-white text-skeed-fg hover:bg-skeed-bg',
              )}
              href={`#${day.id}`}
            >
              <span className="block text-xs font-semibold uppercase tracking-wide opacity-80">
                {day.label}
              </span>
              <span className="mt-1 block text-xl font-bold">{day.date}</span>
              {day.detail ? (
                <span className="mt-1 block text-xs opacity-80">{day.detail}</span>
              ) : null}
              {day.complete ? <span className="sr-only">Complete</span> : null}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function SkeedWorkoutPlan({
  title = 'Workout plan',
  summary,
  days,
  className,
}: SkeedWorkoutPlanProps): React.ReactElement {
  return (
    <section
      className={cn('rounded-skeed border border-skeed-border bg-white p-5 shadow-sm', className)}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-skeed-fg">{title}</h2>
          {summary ? <p className="mt-1 text-sm leading-6 text-skeed-muted">{summary}</p> : null}
        </div>
        <span className="rounded-full bg-skeed-color-success-50 px-2.5 py-1 text-xs font-semibold text-skeed-color-success-700">
          {days.filter((day) => day.complete).length}/{days.length} complete
        </span>
      </div>
      <ol className="mt-5 grid gap-3">
        {days.map((day) => (
          <li
            className="flex items-center gap-3 rounded-skeed border border-skeed-border bg-skeed-bg p-3"
            key={day.id}
          >
            <span
              className={cn(
                'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                day.complete ? 'bg-skeed-success text-white' : 'bg-white text-skeed-muted',
              )}
            >
              {day.complete ? 'Done' : day.day.slice(0, 1)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-skeed-fg">
                {day.day}: {day.title}
              </p>
              <p className="mt-1 text-xs text-skeed-muted">
                {[day.duration, day.intensity].filter(Boolean).join(' / ')}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function SkeedGoalProgress({
  title,
  value,
  max = 100,
  label,
  milestones = [],
  className,
}: SkeedGoalProgressProps): React.ReactElement {
  const percent = clampPercent(value, max);

  return (
    <section
      className={cn('rounded-skeed border border-skeed-border bg-white p-5 shadow-sm', className)}
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-lg font-bold text-skeed-fg">{title}</h2>
        <p className="text-sm font-semibold text-skeed-brand">{label ?? `${value}/${max}`}</p>
      </div>
      <div
        aria-valuetext={`${percent}% complete`}
        className="mt-4 h-3 overflow-hidden rounded-full bg-skeed-bg"
        role="progressbar"
        aria-label={title}
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        tabIndex={0}
      >
        <span
          className="block h-full rounded-full bg-skeed-brand"
          style={{ width: `${percent}%` }}
        />
      </div>
      {milestones.length > 0 ? (
        <ol className="skeed-adaptive-grid-dense mt-4 grid gap-2">
          {milestones.map((milestone) => (
            <li className="flex items-center gap-2 text-sm text-skeed-muted" key={milestone.label}>
              <span
                className={cn(
                  'h-2.5 w-2.5 rounded-full',
                  milestone.reached ? 'bg-skeed-success' : 'bg-skeed-border',
                )}
              />
              <span>{milestone.label}</span>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}

export function SkeedInsightCard({
  title,
  insight,
  metric,
  tone = 'brand',
  action,
  className,
}: SkeedInsightCardProps): React.ReactElement {
  return (
    <aside
      className={cn(
        'overflow-hidden rounded-skeed border border-skeed-border bg-white shadow-sm',
        className,
      )}
    >
      <div className={cn('p-5', toneClasses(tone))}>
        <p className="text-sm font-semibold uppercase tracking-wide opacity-80">{title}</p>
        {metric ? <p className="mt-2 text-3xl font-bold">{metric}</p> : null}
      </div>
      <div className="p-5">
        <div className="text-sm leading-6 text-skeed-muted">{insight}</div>
        {action ? (
          <div className="mt-5">
            <ActionLink action={action} primary />
          </div>
        ) : null}
      </div>
    </aside>
  );
}

export function SkeedResourceList({
  title = 'Resources',
  resources,
  className,
}: SkeedResourceListProps): React.ReactElement {
  return (
    <section
      className={cn('rounded-skeed border border-skeed-border bg-white p-5 shadow-sm', className)}
    >
      <h2 className="text-lg font-bold text-skeed-fg">{title}</h2>
      <ul className="mt-4 divide-y divide-skeed-border">
        {resources.map((resource) => {
          const content = (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <p className="font-semibold text-skeed-fg">{resource.title}</p>
                {resource.meta ? (
                  <span className="text-xs font-medium text-skeed-muted">{resource.meta}</span>
                ) : null}
              </div>
              {resource.description ? (
                <div className="mt-1 text-sm leading-6 text-skeed-muted">
                  {resource.description}
                </div>
              ) : null}
              {resource.status ? (
                <span
                  className={cn(
                    'mt-3 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold',
                    statusClasses(resource.status),
                  )}
                >
                  {resource.status}
                </span>
              ) : null}
            </>
          );

          return (
            <li className="py-4" key={resource.id}>
              {resource.href ? (
                <a
                  className="skeed-hover-lift block rounded-skeed p-2 focus-visible:skeed-focus-ring"
                  href={resource.href}
                >
                  {content}
                </a>
              ) : (
                <div className="rounded-skeed p-2">{content}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
