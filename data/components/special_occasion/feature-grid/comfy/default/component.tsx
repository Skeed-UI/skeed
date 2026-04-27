import { type HTMLAttributes, forwardRef, type ReactNode } from 'react';
import { cn } from '@skeed/core/cn';

export interface FeatureItem {
  id: string;
  icon?: ReactNode;
  title: string;
  description: string;
}

export interface FeatureGridProps extends HTMLAttributes<HTMLElement> {
  features: FeatureItem[];
  columns?: 2 | 3 | 4;
  variant?: 'icon-top' | 'icon-left' | 'numbered';
  title?: string;
  subtitle?: string;
}

const gridColsClasses: Record<2 | 3 | 4, string> = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
};

export const FeatureGrid = forwardRef<HTMLElement, FeatureGridProps>(
  function FeatureGrid(
    {
      className,
      features,
      columns = 3,
      variant = 'icon-top',
      title,
      subtitle,
      ...rest
    },
    ref,
  ) {
    return (
      <section
        ref={ref as React.Ref<HTMLElement>}
        className={cn('w-full', className)}
        {...rest}
      >
        {(title || subtitle) && (
          <div className="mb-skeed-spacing-10 text-center">
            {title && (
              <h2 className="font-skeed-display text-skeed-color-neutral-900 mb-skeed-spacing-3">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="font-skeed-body text-skeed-color-neutral-600 max-w-prose mx-auto">
                {subtitle}
              </p>
            )}
          </div>
        )}

        <div
          className={cn(
            'grid gap-skeed-density-cozy-gap',
            gridColsClasses[columns],
          )}
        >
          {features.map((feature, index) => (
            <article
              key={feature.id}
              className={cn(
                'flex',
                variant === 'icon-left' ? 'flex-row gap-skeed-spacing-4' : 'flex-col gap-skeed-spacing-3',
                'bg-skeed-color-neutral-50 rounded-skeed-radius-2 px-skeed-density-cozy-padx py-skeed-density-cozy-pady shadow-skeed-shadow-1',
              )}
            >
              {variant === 'numbered' ? (
                <div
                  aria-hidden="true"
                  className="flex h-skeed-spacing-10 w-skeed-spacing-10 shrink-0 items-center justify-center rounded-skeed-radius-7 bg-skeed-color-brand-500 text-skeed-color-neutral-50 font-skeed-display font-bold"
                >
                  {String(index + 1).padStart(2, '0')}
                </div>
              ) : feature.icon ? (
                <div
                  aria-hidden="true"
                  className={cn(
                    'flex shrink-0 items-center justify-center rounded-skeed-radius-2 bg-skeed-color-brand-100 text-skeed-color-brand-600',
                    variant === 'icon-left'
                      ? 'h-skeed-spacing-10 w-skeed-spacing-10'
                      : 'h-skeed-spacing-12 w-skeed-spacing-12',
                  )}
                >
                  {feature.icon}
                </div>
              ) : null}

              <div className="flex flex-col gap-skeed-spacing-1">
                <h3 className="font-skeed-display font-semibold text-skeed-color-neutral-900">
                  {feature.title}
                </h3>
                <p className="font-skeed-body text-skeed-color-neutral-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  },
);
