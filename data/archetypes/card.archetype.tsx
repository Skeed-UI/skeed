import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@skeed/core/cn';

export interface CardProps extends HTMLAttributes<HTMLElement> {
  variant?: 'elevated' | 'outlined' | 'flat';
  padding?: 'sm' | 'md' | 'lg' | 'none';
  interactive?: boolean;
}

const paddingClasses = {
  none: '',
  sm: 'px-skeed-spacing-3 py-skeed-spacing-2',
  md: 'px-skeed-density-cozy-padx py-skeed-density-cozy-pady',
  lg: 'px-skeed-spacing-6 py-skeed-spacing-5',
};

const variantClasses = {
  elevated:
    'bg-skeed-color-neutral-50 shadow-skeed-shadow-1 rounded-skeed-radius-2',
  outlined:
    'bg-skeed-color-neutral-50 border border-skeed-color-neutral-200 rounded-skeed-radius-2',
  flat: 'bg-skeed-color-neutral-100 rounded-skeed-radius-2',
};

export const Card = forwardRef<HTMLElement, CardProps>(function Card(
  {
    className,
    variant = 'elevated',
    padding = 'md',
    interactive = false,
    ...rest
  },
  ref,
) {
  return (
    <article
      ref={ref as React.Ref<HTMLElement>}
      className={cn(
        variantClasses[variant],
        paddingClasses[padding],
        interactive &&
          'cursor-pointer transition-shadow duration-skeed-motion-duration-fast ease-skeed-motion-easing-default hover:shadow-skeed-shadow-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500',
        className,
      )}
      tabIndex={interactive ? 0 : undefined}
      {...rest}
    />
  );
});

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  function CardHeader({ className, ...rest }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          'mb-skeed-spacing-3 border-b border-skeed-color-neutral-200 pb-skeed-spacing-3',
          className,
        )}
        {...rest}
      />
    );
  },
);

export interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {}

export const CardBody = forwardRef<HTMLDivElement, CardBodyProps>(
  function CardBody({ className, ...rest }, ref) {
    return (
      <div
        ref={ref}
        className={cn('text-skeed-color-neutral-900 font-skeed-body', className)}
        {...rest}
      />
    );
  },
);

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  function CardFooter({ className, ...rest }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          'mt-skeed-spacing-3 border-t border-skeed-color-neutral-200 pt-skeed-spacing-3',
          className,
        )}
        {...rest}
      />
    );
  },
);

// Skeleton Components
export interface CardSkeletonProps extends HTMLAttributes<HTMLElement> {
  variant?: 'elevated' | 'outlined' | 'flat';
  hasHeader?: boolean;
  hasFooter?: boolean;
  lines?: number;
}

export function CardSkeleton({
  variant = 'elevated',
  hasHeader = true,
  hasFooter = false,
  lines = 3,
  className,
  ...rest
}: CardSkeletonProps) {
  return (
    <article
      className={cn(
        variantClasses[variant],
        'px-skeed-density-cozy-padx py-skeed-density-cozy-pady animate-pulse',
        className,
      )}
      aria-busy="true"
      aria-label="Loading card"
      {...rest}
    >
      {hasHeader && (
        <div className="mb-skeed-spacing-3 pb-skeed-spacing-3 border-b border-skeed-color-neutral-200">
          <div className="h-skeed-spacing-5 w-2/3 bg-skeed-color-neutral-200 rounded-skeed-radius-1" />
        </div>
      )}

      <div className="space-y-skeed-spacing-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-skeed-spacing-4 bg-skeed-color-neutral-200 rounded-skeed-radius-1',
              i === lines - 1 && 'w-3/4',
            )}
          />
        ))}
      </div>

      {hasFooter && (
        <div className="mt-skeed-spacing-3 pt-skeed-spacing-3 border-t border-skeed-color-neutral-200 flex justify-end gap-skeed-spacing-2">
          <div className="h-skeed-spacing-8 w-skeed-spacing-20 bg-skeed-color-neutral-200 rounded-skeed-radius-1" />
          <div className="h-skeed-spacing-8 w-skeed-spacing-20 bg-skeed-color-neutral-300 rounded-skeed-radius-1" />
        </div>
      )}
    </article>
  );
}
