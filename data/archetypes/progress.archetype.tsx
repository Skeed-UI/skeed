import { cn } from '@skeed/core/cn';
import { type HTMLAttributes, forwardRef } from 'react';

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  size?: 'sm' | 'md';
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

const sizeClasses: Record<NonNullable<ProgressProps['size']>, string> = {
  sm: 'h-skeed-spacing-1',
  md: 'h-skeed-spacing-2',
};

const barVariantClasses: Record<NonNullable<ProgressProps['variant']>, string> = {
  default: 'bg-skeed-color-brand-500',
  success: 'bg-skeed-color-success-500',
  warning: 'bg-skeed-color-warning-500',
  danger: 'bg-skeed-color-danger-500',
};

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(function Progress(
  { className, value, max = 100, size = 'md', variant = 'default', ...rest },
  ref,
) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div
      ref={ref}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn(
        'w-full rounded-skeed-radius-9999 bg-skeed-color-neutral-200 overflow-hidden',
        sizeClasses[size],
        className,
      )}
      {...rest}
    >
      <div
        className={cn(
          'h-full transition-all duration-skeed-motion-duration-fast ease-skeed-motion-easing-default',
          'rounded-skeed-radius-9999',
          barVariantClasses[variant],
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
});
