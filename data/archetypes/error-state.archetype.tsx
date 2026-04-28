import { cn } from '@skeed/core/cn';
import { type HTMLAttributes, forwardRef } from 'react';

export interface ErrorStateProps extends HTMLAttributes<HTMLElement> {
  title?: string;
  description?: string;
  errorCode?: string;
  retry?: () => void;
  backHref?: string;
  variant?: 'inline' | 'page';
}

export const ErrorState = forwardRef<HTMLElement, ErrorStateProps>(function ErrorState(
  {
    className,
    title = 'Something went wrong',
    description,
    errorCode,
    retry,
    backHref,
    variant = 'inline',
    ...rest
  },
  ref,
) {
  return (
    <div
      ref={ref as React.Ref<HTMLElement>}
      role="alert"
      aria-live="assertive"
      className={cn(
        'flex flex-col items-center justify-center text-center',
        variant === 'page'
          ? 'min-h-screen w-full px-skeed-density-cozy-padx py-skeed-density-cozy-pady'
          : 'w-full py-skeed-spacing-10 px-skeed-density-cozy-padx',
        'gap-skeed-spacing-3',
        className,
      )}
      {...rest}
    >
      {/* Error icon */}
      <div
        aria-hidden="true"
        className={cn(
          'flex items-center justify-center rounded-skeed-radius-9999',
          variant === 'page'
            ? 'h-skeed-spacing-16 w-skeed-spacing-16 bg-skeed-color-danger-50 text-skeed-color-danger-500'
            : 'h-skeed-spacing-12 w-skeed-spacing-12 bg-skeed-color-danger-50 text-skeed-color-danger-500',
        )}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={
            variant === 'page'
              ? 'h-skeed-spacing-8 w-skeed-spacing-8'
              : 'h-skeed-spacing-6 w-skeed-spacing-6'
          }
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      {errorCode && (
        <p className="font-skeed-mono text-xs text-skeed-color-danger-400 uppercase tracking-wide">
          Error {errorCode}
        </p>
      )}

      <h2
        className={cn(
          'font-skeed-display font-semibold text-skeed-color-neutral-900',
          variant === 'page' ? 'text-2xl' : 'text-lg',
        )}
      >
        {title}
      </h2>

      {description && (
        <p className="font-skeed-body text-sm text-skeed-color-neutral-600 max-w-sm">
          {description}
        </p>
      )}

      {(retry || backHref) && (
        <div className="flex items-center gap-skeed-spacing-3 mt-skeed-spacing-2">
          {retry && (
            <button
              type="button"
              onClick={retry}
              className={cn(
                'rounded-skeed-radius-2 px-skeed-density-cozy-padx py-skeed-density-cozy-pady',
                'font-skeed-body text-sm font-medium',
                'bg-skeed-color-danger-500 text-skeed-color-neutral-50',
                'hover:bg-skeed-color-danger-600',
                'transition-colors duration-skeed-motion-duration-fast ease-skeed-motion-easing-default',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-danger-500',
              )}
            >
              Try again
            </button>
          )}
          {backHref && (
            <a
              href={backHref}
              className={cn(
                'rounded-skeed-radius-2 px-skeed-density-cozy-padx py-skeed-density-cozy-pady',
                'font-skeed-body text-sm font-medium',
                'bg-skeed-color-neutral-100 text-skeed-color-neutral-700',
                'hover:bg-skeed-color-neutral-200',
                'transition-colors duration-skeed-motion-duration-fast ease-skeed-motion-easing-default',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-neutral-400',
              )}
            >
              Go back
            </a>
          )}
        </div>
      )}
    </div>
  );
});
