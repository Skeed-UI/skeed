import { cn } from '@skeed/core/cn';
import { type HTMLAttributes, forwardRef } from 'react';

export interface BannerProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'danger';
}

const variantClasses: Record<NonNullable<BannerProps['variant']>, string> = {
  info: 'bg-skeed-color-info-100 border-skeed-color-info-300 text-skeed-color-info-800',
  success: 'bg-skeed-color-success-100 border-skeed-color-success-300 text-skeed-color-success-800',
  warning: 'bg-skeed-color-warning-100 border-skeed-color-warning-300 text-skeed-color-warning-800',
  danger: 'bg-skeed-color-danger-100 border-skeed-color-danger-300 text-skeed-color-danger-800',
};

export const Banner = forwardRef<HTMLDivElement, BannerProps>(function Banner(
  { className, variant = 'info', children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      role="banner"
      className={cn(
        'px-skeed-spacing-4 py-skeed-spacing-3',
        'rounded-skeed-radius-2 border',
        'text-sm font-skeed-body',
        variantClasses[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
});
