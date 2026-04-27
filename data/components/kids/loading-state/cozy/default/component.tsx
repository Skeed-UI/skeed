import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@skeed/core/cn';

export interface LoadingStateProps extends HTMLAttributes<HTMLElement> {
  message?: string;
  variant?: 'spinner' | 'skeleton' | 'pulse';
  size?: 'sm' | 'md' | 'lg';
  fullPage?: boolean;
}

const spinnerSizeClasses: Record<NonNullable<LoadingStateProps['size']>, string> = {
  sm: 'h-skeed-spacing-4 w-skeed-spacing-4',
  md: 'h-skeed-spacing-8 w-skeed-spacing-8',
  lg: 'h-skeed-spacing-12 w-skeed-spacing-12',
};

function Spinner({ size = 'md' }: { size?: LoadingStateProps['size'] }) {
  return (
    <svg
      className={cn('animate-spin text-skeed-color-brand-500', spinnerSizeClasses[size ?? 'md'])}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

function SkeletonBlocks({ size = 'md' }: { size?: LoadingStateProps['size'] }) {
  const blockHeightClass = {
    sm: 'h-skeed-spacing-2',
    md: 'h-skeed-spacing-3',
    lg: 'h-skeed-spacing-4',
  }[size ?? 'md'];

  return (
    <div className="w-full max-w-sm flex flex-col gap-skeed-spacing-2" aria-hidden="true">
      <div className={cn('rounded-skeed-radius-1 bg-skeed-color-neutral-200 animate-pulse w-full', blockHeightClass)} />
      <div className={cn('rounded-skeed-radius-1 bg-skeed-color-neutral-200 animate-pulse', blockHeightClass, 'w-4/5')} />
      <div className={cn('rounded-skeed-radius-1 bg-skeed-color-neutral-200 animate-pulse', blockHeightClass, 'w-2/3')} />
    </div>
  );
}

function PulseBlock({ size = 'md' }: { size?: LoadingStateProps['size'] }) {
  const pulseHeightClass = {
    sm: 'h-skeed-spacing-8',
    md: 'h-skeed-spacing-12',
    lg: 'h-skeed-spacing-16',
  }[size ?? 'md'];

  return (
    <div
      aria-hidden="true"
      className={cn(
        'w-full max-w-sm rounded-skeed-radius-2 bg-skeed-color-neutral-200 animate-pulse',
        pulseHeightClass,
      )}
    />
  );
}

export const LoadingState = forwardRef<HTMLElement, LoadingStateProps>(
  function LoadingState(
    { className, message, variant = 'spinner', size = 'md', fullPage = false, ...rest },
    ref,
  ) {
    return (
      <div
        ref={ref as React.Ref<HTMLElement>}
        role="status"
        aria-live="polite"
        aria-label={message ?? 'Loading'}
        className={cn(
          'flex flex-col items-center justify-center gap-skeed-spacing-3',
          fullPage
            ? 'fixed inset-0 bg-skeed-color-neutral-50 bg-opacity-90 z-50'
            : 'w-full py-skeed-spacing-10',
          className,
        )}
        {...rest}
      >
        {variant === 'spinner' && <Spinner size={size} />}
        {variant === 'skeleton' && <SkeletonBlocks size={size} />}
        {variant === 'pulse' && <PulseBlock size={size} />}

        {message && (
          <p className="font-skeed-body text-sm text-skeed-color-neutral-600">
            {message}
          </p>
        )}

        {/* Visually hidden text for screen readers when no visible message */}
        {!message && (
          <span className="sr-only">Loading</span>
        )}
      </div>
    );
  },
);
