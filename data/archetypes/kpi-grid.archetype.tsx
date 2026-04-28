import { ArrowDown, ArrowRight, ArrowUp } from '@skeed/asset-icon';
import { cn } from '@skeed/core/cn';
import { type HTMLAttributes, forwardRef } from 'react';

export interface KpiMetric {
  id: string;
  label: string;
  value: string | number;
  unit?: string;
  change?: number;
  changeLabel?: string;
  trend?: 'up' | 'down' | 'flat';
}

export interface KpiGridProps extends HTMLAttributes<HTMLElement> {
  metrics: KpiMetric[];
  columns?: 2 | 3 | 4;
  compact?: boolean;
}

const gridColsClasses: Record<2 | 3 | 4, string> = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
};

const trendColorClasses: Record<'up' | 'down' | 'flat', string> = {
  up: 'text-skeed-color-success-600',
  down: 'text-skeed-color-danger-600',
  flat: 'text-skeed-color-neutral-500',
};

const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'flat' }) => {
  if (trend === 'up') return <ArrowUp size={14} />;
  if (trend === 'down') return <ArrowDown size={14} />;
  return <ArrowRight size={14} />;
};

export const KpiGrid = forwardRef<HTMLElement, KpiGridProps>(function KpiGrid(
  { className, metrics, columns = 4, compact = false, ...rest },
  ref,
) {
  return (
    <section ref={ref as React.Ref<HTMLElement>} className={cn('w-full', className)} {...rest}>
      <div className={cn('grid gap-skeed-density-cozy-gap', gridColsClasses[columns])}>
        {metrics.map((metric) => (
          <div
            key={metric.id}
            className={cn(
              'flex flex-col bg-skeed-color-neutral-50 rounded-skeed-radius-2 shadow-skeed-shadow-1 border border-skeed-color-neutral-200',
              compact
                ? 'px-skeed-spacing-3 py-skeed-spacing-2'
                : 'px-skeed-density-cozy-padx py-skeed-density-cozy-pady',
            )}
          >
            <p className="font-skeed-body text-sm text-skeed-color-neutral-600 mb-skeed-spacing-1">
              {metric.label}
            </p>

            <div className="flex items-baseline gap-skeed-spacing-1">
              <span
                className={cn(
                  'font-skeed-numeric font-bold text-skeed-color-neutral-900',
                  compact ? 'text-2xl' : 'text-3xl',
                )}
              >
                {metric.value}
              </span>
              {metric.unit && (
                <span className="font-skeed-body text-sm text-skeed-color-neutral-500">
                  {metric.unit}
                </span>
              )}
            </div>

            {(metric.change !== undefined || metric.changeLabel) && (
              <div
                className={cn(
                  'mt-skeed-spacing-2 flex items-center gap-skeed-spacing-1 font-skeed-body text-sm',
                  metric.trend ? trendColorClasses[metric.trend] : 'text-skeed-color-neutral-500',
                )}
                aria-label={metric.trend ? `Trend: ${metric.trend}` : undefined}
              >
                {metric.trend && (
                  <span aria-hidden="true">
                    <TrendIcon trend={metric.trend} />
                  </span>
                )}
                {metric.change !== undefined && (
                  <span>
                    {metric.change > 0 ? '+' : ''}
                    {metric.change}%
                  </span>
                )}
                {metric.changeLabel && (
                  <span className="text-skeed-color-neutral-500">{metric.changeLabel}</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
});

// Skeleton Component
export interface KpiGridSkeletonProps {
  columns?: 2 | 3 | 4;
  itemCount?: number;
  compact?: boolean;
  className?: string;
}

export function KpiGridSkeleton({
  columns = 4,
  itemCount = 4,
  compact = false,
  className,
}: KpiGridSkeletonProps) {
  return (
    <section className={cn('w-full', className)} aria-busy="true" aria-label="Loading KPI grid">
      <div className={cn('grid gap-skeed-density-cozy-gap', gridColsClasses[columns])}>
        {Array.from({ length: itemCount }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'flex flex-col bg-skeed-color-neutral-50 rounded-skeed-radius-2 shadow-skeed-shadow-1 border border-skeed-color-neutral-200 animate-pulse',
              compact
                ? 'px-skeed-spacing-3 py-skeed-spacing-2'
                : 'px-skeed-density-cozy-padx py-skeed-density-cozy-pady',
            )}
          >
            {/* Label */}
            <div className="h-skeed-spacing-4 w-24 bg-skeed-color-neutral-200 rounded-skeed-radius-1 mb-skeed-spacing-1" />

            {/* Value */}
            <div className="flex items-baseline gap-skeed-spacing-1">
              <div
                className={cn(
                  'bg-skeed-color-neutral-300 rounded-skeed-radius-1',
                  compact ? 'h-7 w-16' : 'h-9 w-20',
                )}
              />
              <div className="h-skeed-spacing-4 w-skeed-spacing-8 bg-skeed-color-neutral-200 rounded-skeed-radius-1" />
            </div>

            {/* Change indicator */}
            <div className="mt-skeed-spacing-2 flex items-center gap-skeed-spacing-1">
              <div className="h-skeed-spacing-3 w-3 bg-skeed-color-neutral-200 rounded-skeed-radius-1" />
              <div className="h-skeed-spacing-3 w-12 bg-skeed-color-neutral-200 rounded-skeed-radius-1" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
