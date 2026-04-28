import { cn } from '@skeed/core/cn';
import { type HTMLAttributes, forwardRef } from 'react';

export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  ariaLabel?: string;
}

const sizeClasses: Record<NonNullable<SpinnerProps['size']>, string> = {
  sm: 'h-skeed-spacing-4 w-skeed-spacing-4',
  md: 'h-skeed-spacing-6 w-skeed-spacing-6',
  lg: 'h-skeed-spacing-8 w-skeed-spacing-8',
};

export const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(function Spinner(
  { className, size = 'md', ariaLabel = 'Loading...', ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      role="status"
      aria-label={ariaLabel}
      className={cn(
        'inline-block animate-spin',
        sizeClasses[size],
        'border-2 border-skeed-color-neutral-300 border-t-skeed-color-brand-500',
        'rounded-skeed-radius-9999',
        className,
      )}
      {...rest}
    >
      <span className="sr-only">{ariaLabel}</span>
    </div>
  );
});
