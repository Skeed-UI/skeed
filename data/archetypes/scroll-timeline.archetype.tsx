import { CheckCircle } from '@skeed/asset-icon';
import { cn } from '@skeed/core/cn';
import { type HTMLAttributes, forwardRef } from 'react';

export interface ScrollTimelineItem {
  id: string;
  title: string;
  description?: string;
  eyebrow?: string;
}

export interface ScrollTimelineProps extends HTMLAttributes<HTMLElement> {
  items: ScrollTimelineItem[];
  activeIndex?: number;
  orientation?: 'vertical' | 'alternating';
}

export const ScrollTimeline = forwardRef<HTMLElement, ScrollTimelineProps>(function ScrollTimeline(
  { items, activeIndex = 0, orientation = 'vertical', className, ...rest },
  ref,
) {
  return (
    <section ref={ref} className={cn('relative w-full', className)} {...rest}>
      <div className="absolute bottom-0 left-skeed-spacing-4 top-0 w-skeed-spacing-1 rounded-skeed-radius-9999 bg-skeed-color-neutral-200" />
      <ol className="relative flex flex-col gap-skeed-spacing-6">
        {items.map((item, index) => {
          const active = index === activeIndex;
          const complete = index < activeIndex;
          const alternate = orientation === 'alternating' && index % 2 === 1;

          return (
            <li
              key={item.id}
              className={cn(
                'grid gap-skeed-spacing-4 pl-skeed-spacing-10',
                orientation === 'alternating' && 'md:grid-cols-2 md:pl-skeed-spacing-10',
              )}
            >
              {orientation === 'alternating' && alternate && <div className="hidden md:block" />}
              <article
                className={cn(
                  'group relative rounded-skeed-radius-2 border bg-skeed-color-neutral-50 p-skeed-spacing-4 shadow-skeed-shadow-1',
                  'transition-all duration-skeed-motion-duration-normal ease-skeed-motion-easing-default',
                  active
                    ? 'border-skeed-color-brand-500 shadow-skeed-shadow-2'
                    : 'border-skeed-color-neutral-200',
                )}
              >
                <span
                  className={cn(
                    'absolute -left-skeed-spacing-10 top-skeed-spacing-4 inline-flex h-skeed-spacing-8 w-skeed-spacing-8 items-center justify-center rounded-skeed-radius-9999 border bg-skeed-color-neutral-50',
                    active || complete
                      ? 'border-skeed-color-brand-500 text-skeed-color-brand-600'
                      : 'border-skeed-color-neutral-200 text-skeed-color-neutral-500',
                  )}
                  aria-hidden="true"
                >
                  {complete ? <CheckCircle size={16} /> : index + 1}
                </span>
                {item.eyebrow && (
                  <p className="mb-skeed-spacing-1 font-skeed-body text-xs font-semibold uppercase tracking-wide text-skeed-color-brand-600">
                    {item.eyebrow}
                  </p>
                )}
                <h3 className="font-skeed-display text-base font-semibold text-skeed-color-neutral-900">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="mt-skeed-spacing-2 font-skeed-body text-sm text-skeed-color-neutral-600">
                    {item.description}
                  </p>
                )}
              </article>
            </li>
          );
        })}
      </ol>
    </section>
  );
});
