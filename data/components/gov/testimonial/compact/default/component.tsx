import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@skeed/core/cn';

export interface TestimonialProps extends HTMLAttributes<HTMLElement> {
  quote: string;
  authorName: string;
  authorTitle?: string;
  authorCompany?: string;
  avatarSrc?: string;
  rating?: number;
  variant?: 'card' | 'quote' | 'minimal';
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-skeed-spacing-1 mb-skeed-spacing-3" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={cn(
            'text-base',
            i < rating
              ? 'text-skeed-color-warning-500'
              : 'text-skeed-color-neutral-300',
          )}
        >
          {i < rating ? '★' : '☆'}
        </span>
      ))}
    </div>
  );
}

export const Testimonial = forwardRef<HTMLElement, TestimonialProps>(
  function Testimonial(
    {
      className,
      quote,
      authorName,
      authorTitle,
      authorCompany,
      avatarSrc,
      rating,
      variant = 'card',
      ...rest
    },
    ref,
  ) {
    const variantClasses = {
      card: 'bg-skeed-color-neutral-50 shadow-skeed-shadow-1 rounded-skeed-radius-2 px-skeed-density-cozy-padx py-skeed-density-cozy-pady',
      quote: 'border-l-4 border-skeed-color-brand-500 pl-skeed-spacing-5 py-skeed-spacing-3',
      minimal: 'py-skeed-spacing-3',
    };

    return (
      <figure
        ref={ref as React.Ref<HTMLElement>}
        className={cn(variantClasses[variant], className)}
        {...rest}
      >
        {rating !== undefined && rating > 0 && <StarRating rating={Math.min(5, Math.max(1, rating))} />}

        <blockquote className="mb-skeed-spacing-4">
          {variant !== 'minimal' && (
            <span aria-hidden="true" className="text-skeed-color-brand-300 font-skeed-display text-4xl leading-none select-none">
              &ldquo;
            </span>
          )}
          <p className="text-skeed-color-neutral-800 font-skeed-body text-base leading-relaxed">
            {quote}
          </p>
          {variant !== 'minimal' && (
            <span aria-hidden="true" className="text-skeed-color-brand-300 font-skeed-display text-4xl leading-none select-none">
              &rdquo;
            </span>
          )}
        </blockquote>

        <figcaption className="flex items-center gap-skeed-spacing-3">
          {avatarSrc && (
            <img
              src={avatarSrc}
              alt={authorName}
              className="h-skeed-spacing-10 w-skeed-spacing-10 rounded-skeed-radius-9999 object-cover shrink-0"
            />
          )}
          <div>
            <p className="font-skeed-body font-semibold text-skeed-color-neutral-900">
              {authorName}
            </p>
            {(authorTitle || authorCompany) && (
              <p className="font-skeed-body text-sm text-skeed-color-neutral-600">
                {[authorTitle, authorCompany].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
        </figcaption>
      </figure>
    );
  },
);
