import { cn } from '@skeed/core/cn';
import { type HTMLAttributes, forwardRef } from 'react';

export interface PricingCardProps extends HTMLAttributes<HTMLElement> {
  planName: string;
  price: string | number;
  currency?: string;
  period?: string;
  description?: string;
  features: string[];
  ctaLabel: string;
  onCtaClick?: () => void;
  featured?: boolean;
  badge?: string;
}

export const PricingCard = forwardRef<HTMLElement, PricingCardProps>(function PricingCard(
  {
    className,
    planName,
    price,
    currency = '$',
    period,
    description,
    features,
    ctaLabel,
    onCtaClick,
    featured = false,
    badge,
    ...rest
  },
  ref,
) {
  return (
    <article
      ref={ref as React.Ref<HTMLElement>}
      className={cn(
        'relative flex flex-col rounded-skeed-radius-2',
        featured
          ? 'bg-skeed-color-brand-500 text-skeed-color-neutral-50 shadow-skeed-shadow-2 ring-2 ring-skeed-color-brand-500'
          : 'bg-skeed-color-neutral-50 text-skeed-color-neutral-900 shadow-skeed-shadow-1 border border-skeed-color-neutral-200',
        'px-skeed-density-cozy-padx py-skeed-density-cozy-pady',
        className,
      )}
      {...rest}
    >
      {badge && (
        <div className="absolute -top-skeed-spacing-3 left-1/2 -translate-x-1/2">
          <span
            className={cn(
              'inline-flex items-center rounded-skeed-radius-7 px-skeed-spacing-3 py-skeed-spacing-1 text-xs font-medium font-skeed-body',
              featured
                ? 'bg-skeed-color-neutral-50 text-skeed-color-brand-600'
                : 'bg-skeed-color-brand-500 text-skeed-color-neutral-50',
            )}
          >
            {badge}
          </span>
        </div>
      )}

      <header className="mb-skeed-spacing-5">
        <h3
          className={cn(
            'font-skeed-display font-semibold text-lg mb-skeed-spacing-2',
            featured ? 'text-skeed-color-neutral-50' : 'text-skeed-color-neutral-900',
          )}
        >
          {planName}
        </h3>

        <div className="flex items-baseline gap-skeed-spacing-1 mb-skeed-spacing-2">
          <span
            className={cn(
              'font-skeed-body text-sm',
              featured ? 'text-skeed-color-brand-200' : 'text-skeed-color-neutral-500',
            )}
          >
            {currency}
          </span>
          <span
            className={cn(
              'font-skeed-numeric font-bold text-4xl',
              featured ? 'text-skeed-color-neutral-50' : 'text-skeed-color-neutral-900',
            )}
          >
            {price}
          </span>
          {period && (
            <span
              className={cn(
                'font-skeed-body text-sm',
                featured ? 'text-skeed-color-brand-200' : 'text-skeed-color-neutral-500',
              )}
            >
              {period}
            </span>
          )}
        </div>

        {description && (
          <p
            className={cn(
              'font-skeed-body text-sm',
              featured ? 'text-skeed-color-brand-100' : 'text-skeed-color-neutral-600',
            )}
          >
            {description}
          </p>
        )}
      </header>

      <ul
        className="mb-skeed-spacing-6 flex flex-col gap-skeed-spacing-3 flex-1"
        aria-label={`${planName} features`}
      >
        {features.map((feature, index) => (
          <li
            key={index}
            className={cn(
              'flex items-start gap-skeed-spacing-2 font-skeed-body text-sm',
              featured ? 'text-skeed-color-neutral-50' : 'text-skeed-color-neutral-700',
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'mt-0.5 shrink-0 text-base',
                featured ? 'text-skeed-color-brand-200' : 'text-skeed-color-success-500',
              )}
            >
              ✓
            </span>
            {feature}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onCtaClick}
        className={cn(
          'w-full rounded-skeed-radius-2 px-skeed-density-cozy-padx py-skeed-density-cozy-pady font-skeed-body font-medium text-sm',
          'transition-colors duration-skeed-motion-duration-fast ease-skeed-motion-easing-default',
          'focus-visible:outline-none focus-visible:ring-2',
          featured
            ? 'bg-skeed-color-neutral-50 text-skeed-color-brand-600 hover:bg-skeed-color-brand-50 focus-visible:ring-skeed-color-neutral-50'
            : 'bg-skeed-color-brand-500 text-skeed-color-neutral-50 hover:bg-skeed-color-brand-600 focus-visible:ring-skeed-color-brand-500',
        )}
      >
        {ctaLabel}
      </button>
    </article>
  );
});
