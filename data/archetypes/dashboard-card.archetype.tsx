import { type HTMLAttributes, forwardRef, type ReactNode } from 'react';
import { cn } from '@skeed/core/cn';
import { ArrowUp, ArrowDown, ArrowRight } from '@skeed/asset-icon';

export interface DashboardCardProps extends HTMLAttributes<HTMLElement> {
  title: string;
  value: string | number;
  unit?: string;
  icon?: ReactNode;
  change?: number;
  changeLabel?: string;
  sparkline?: number[];
  variant?: 'default' | 'compact';
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const width = 100;
  const height = 32;
  const stepX = width / (values.length - 1);

  const points = values
    .map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className="w-full h-skeed-spacing-8"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        className="text-skeed-color-brand-400"
      />
    </svg>
  );
}

export const DashboardCard = forwardRef<HTMLElement, DashboardCardProps>(
  function DashboardCard(
    {
      className,
      title,
      value,
      unit,
      icon,
      change,
      changeLabel,
      sparkline,
      variant = 'default',
      ...rest
    },
    ref,
  ) {
    const isPositive = change !== undefined && change >= 0;
    const isNegative = change !== undefined && change < 0;

    return (
      <article
        ref={ref as React.Ref<HTMLElement>}
        className={cn(
          'flex flex-col bg-skeed-color-neutral-50 rounded-skeed-radius-2 shadow-skeed-shadow-1 border border-skeed-color-neutral-200',
          variant === 'compact'
            ? 'px-skeed-spacing-3 py-skeed-spacing-2'
            : 'px-skeed-density-cozy-padx py-skeed-density-cozy-pady',
          className,
        )}
        {...rest}
      >
        <div className="flex items-start justify-between mb-skeed-spacing-2">
          <p className="font-skeed-body text-sm text-skeed-color-neutral-600">
            {title}
          </p>
          {icon && (
            <span
              aria-hidden="true"
              className="flex items-center justify-center h-skeed-spacing-8 w-skeed-spacing-8 rounded-skeed-radius-2 bg-skeed-color-brand-50 text-skeed-color-brand-500"
            >
              {icon}
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-skeed-spacing-1 mb-skeed-spacing-1">
          <span
            className={cn(
              'font-skeed-numeric font-bold text-skeed-color-neutral-900',
              variant === 'compact' ? 'text-xl' : 'text-2xl',
            )}
          >
            {value}
          </span>
          {unit && (
            <span className="font-skeed-body text-xs text-skeed-color-neutral-500">
              {unit}
            </span>
          )}
        </div>

        {change !== undefined && (
          <p
            className={cn(
              'font-skeed-body text-xs flex items-center gap-skeed-spacing-1',
              isPositive && 'text-skeed-color-success-600',
              isNegative && 'text-skeed-color-danger-600',
              !isPositive && !isNegative && 'text-skeed-color-neutral-500',
            )}
            aria-label={`${change >= 0 ? 'Increased' : 'Decreased'} by ${Math.abs(change)}%${changeLabel ? ` ${changeLabel}` : ''}`}
          >
            <span aria-hidden="true">
              {isPositive ? <ArrowUp size={12} /> : isNegative ? <ArrowDown size={12} /> : <ArrowRight size={12} />}
            </span>
            <span>
              {change > 0 ? '+' : ''}
              {change}%
            </span>
            {changeLabel && (
              <span className="text-skeed-color-neutral-400">{changeLabel}</span>
            )}
          </p>
        )}

        {sparkline && sparkline.length >= 2 && (
          <div className="mt-skeed-spacing-3 text-skeed-color-brand-400">
            <Sparkline values={sparkline} />
          </div>
        )}
      </article>
    );
  },
);

// Skeleton Component
export interface DashboardCardSkeletonProps {
  variant?: 'default' | 'compact';
  hasSparkline?: boolean;
  className?: string;
}

export function DashboardCardSkeleton({
  variant = 'default',
  hasSparkline = true,
  className,
}: DashboardCardSkeletonProps) {
  return (
    <article
      className={cn(
        'flex flex-col bg-skeed-color-neutral-50 rounded-skeed-radius-2 shadow-skeed-shadow-1 border border-skeed-color-neutral-200 animate-pulse',
        variant === 'compact'
          ? 'px-skeed-spacing-3 py-skeed-spacing-2'
          : 'px-skeed-density-cozy-padx py-skeed-density-cozy-pady',
        className,
      )}
      aria-busy="true"
      aria-label="Loading dashboard card"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-skeed-spacing-2">
        <div className="h-skeed-spacing-4 w-24 bg-skeed-color-neutral-200 rounded-skeed-radius-1" />
        <div className="flex items-center justify-center h-skeed-spacing-8 w-skeed-spacing-8 rounded-skeed-radius-2 bg-skeed-color-neutral-200" />
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-skeed-spacing-1 mb-skeed-spacing-1">
        <div
          className={cn(
            'bg-skeed-color-neutral-300 rounded-skeed-radius-1',
            variant === 'compact' ? 'h-6 w-16' : 'h-8 w-20',
          )}
        />
        <div className="h-skeed-spacing-3 w-skeed-spacing-8 bg-skeed-color-neutral-200 rounded-skeed-radius-1" />
      </div>

      {/* Change indicator */}
      <div className="flex items-center gap-skeed-spacing-1">
        <div className="h-skeed-spacing-3 w-3 bg-skeed-color-neutral-200 rounded-skeed-radius-1" />
        <div className="h-skeed-spacing-3 w-12 bg-skeed-color-neutral-200 rounded-skeed-radius-1" />
      </div>

      {/* Sparkline */}
      {hasSparkline && (
        <div className="mt-skeed-spacing-3 h-skeed-spacing-8 bg-skeed-color-neutral-200 rounded-skeed-radius-1" />
      )}
    </article>
  );
}
