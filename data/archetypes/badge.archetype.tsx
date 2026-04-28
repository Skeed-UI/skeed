import { cn } from '@skeed/core/cn';
import { type HTMLAttributes, forwardRef } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  dot?: boolean;
}

const variantClasses: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-skeed-color-brand-100 text-skeed-color-brand-700',
  success: 'bg-skeed-color-success-100 text-skeed-color-success-700',
  warning: 'bg-skeed-color-warning-100 text-skeed-color-warning-700',
  danger: 'bg-skeed-color-danger-100 text-skeed-color-danger-700',
  info: 'bg-skeed-color-info-100 text-skeed-color-info-700',
  neutral: 'bg-skeed-color-neutral-100 text-skeed-color-neutral-700',
};

const dotVariantClasses: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-skeed-color-brand-500',
  success: 'bg-skeed-color-success-500',
  warning: 'bg-skeed-color-warning-500',
  danger: 'bg-skeed-color-danger-500',
  info: 'bg-skeed-color-info-500',
  neutral: 'bg-skeed-color-neutral-500',
};

const sizeClasses: Record<NonNullable<BadgeProps['size']>, string> = {
  sm: 'px-skeed-spacing-2 py-skeed-spacing-0 text-xs font-skeed-body',
  md: 'px-skeed-spacing-3 py-skeed-spacing-1 text-sm font-skeed-body',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { className, variant = 'default', size = 'md', dot = false, children, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center gap-skeed-spacing-1 rounded-skeed-radius-7 font-medium',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...rest}
    >
      {dot && (
        <span
          aria-hidden="true"
          className={cn(
            'block rounded-skeed-radius-9999',
            size === 'sm'
              ? 'h-skeed-spacing-1 w-skeed-spacing-1'
              : 'h-skeed-spacing-2 w-skeed-spacing-2',
            dotVariantClasses[variant],
          )}
        />
      )}
      {children}
    </span>
  );
});
