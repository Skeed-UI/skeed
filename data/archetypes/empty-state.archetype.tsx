import { cn } from '@skeed/core/cn';
import { type HTMLAttributes, type ReactNode, forwardRef } from 'react';

export interface EmptyStateProps extends HTMLAttributes<HTMLElement> {
  title: string;
  description?: string;
  illustration?: ReactNode;
  action?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses: Record<NonNullable<EmptyStateProps['size']>, string> = {
  sm: 'py-skeed-spacing-6 gap-skeed-spacing-2',
  md: 'py-skeed-spacing-10 gap-skeed-spacing-3',
  lg: 'py-skeed-spacing-16 gap-skeed-spacing-4',
};

const titleSizeClasses: Record<NonNullable<EmptyStateProps['size']>, string> = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-xl',
};

const illustrationSizeClasses: Record<NonNullable<EmptyStateProps['size']>, string> = {
  sm: 'mb-skeed-spacing-2',
  md: 'mb-skeed-spacing-3',
  lg: 'mb-skeed-spacing-4',
};

export const EmptyState = forwardRef<HTMLElement, EmptyStateProps>(function EmptyState(
  { className, title, description, illustration, action, size = 'md', ...rest },
  ref,
) {
  return (
    <div
      ref={ref as React.Ref<HTMLElement>}
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center justify-center text-center w-full',
        sizeClasses[size],
        className,
      )}
      {...rest}
    >
      {illustration && (
        <div
          aria-hidden="true"
          className={cn(
            'flex items-center justify-center text-skeed-color-neutral-400',
            illustrationSizeClasses[size],
          )}
        >
          {illustration}
        </div>
      )}

      <h3
        className={cn(
          'font-skeed-display font-semibold text-skeed-color-neutral-900',
          titleSizeClasses[size],
        )}
      >
        {title}
      </h3>

      {description && (
        <p
          className={cn(
            'font-skeed-body text-skeed-color-neutral-600 max-w-sm',
            size === 'sm' ? 'text-xs' : 'text-sm',
          )}
        >
          {description}
        </p>
      )}

      {action && <div className="mt-skeed-spacing-4">{action}</div>}
    </div>
  );
});
