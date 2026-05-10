import { ChevronDown } from '@skeed/asset-icon';
import { cn } from '@skeed/core/cn';
import { type HTMLAttributes, type ReactNode, forwardRef, useEffect, useRef, useState } from 'react';

export interface ScrollAccordionItem {
  id: string;
  title: string;
  summary?: string;
  content: ReactNode;
}

export interface ScrollAccordionProps extends HTMLAttributes<HTMLElement> {
  items: ScrollAccordionItem[];
  defaultIndex?: number;
  observeScroll?: boolean;
}

export const ScrollAccordion = forwardRef<HTMLElement, ScrollAccordionProps>(
  function ScrollAccordion(
    { items, defaultIndex = 0, observeScroll = true, className, ...rest },
    ref,
  ) {
    const [activeIndex, setActiveIndex] = useState(defaultIndex);
    const itemRefs = useRef<Array<HTMLDivElement | null>>([]);

    useEffect(() => {
      if (!observeScroll || typeof IntersectionObserver === 'undefined') return;

      const observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
          if (!visible) return;

          const index = itemRefs.current.findIndex((node) => node === visible.target);
          if (index >= 0) setActiveIndex(index);
        },
        { rootMargin: '-35% 0px -45% 0px', threshold: [0.25, 0.5, 0.75] },
      );

      for (const node of itemRefs.current) {
        if (node) observer.observe(node);
      }

      return () => observer.disconnect();
    }, [observeScroll]);

    return (
      <section
        ref={ref}
        className={cn('flex flex-col gap-skeed-spacing-3', className)}
        {...rest}
      >
        {items.map((item, index) => {
          const open = index === activeIndex;
          const contentId = `${item.id}-content`;

          return (
            <div
              key={item.id}
              ref={(node) => {
                itemRefs.current[index] = node;
              }}
              className={cn(
                'rounded-skeed-radius-2 border bg-skeed-color-neutral-50 shadow-skeed-shadow-1',
                'transition-all duration-skeed-motion-duration-normal ease-skeed-motion-easing-default',
                open ? 'border-skeed-color-brand-500 shadow-skeed-shadow-2' : 'border-skeed-color-neutral-200',
              )}
            >
              <button
                type="button"
                aria-expanded={open}
                aria-controls={contentId}
                onClick={() => setActiveIndex(index)}
                className="flex w-full items-start justify-between gap-skeed-spacing-4 px-skeed-spacing-4 py-skeed-spacing-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500"
              >
                <span className="flex min-w-0 flex-col gap-skeed-spacing-1">
                  <span className="font-skeed-display text-base font-semibold text-skeed-color-neutral-900">
                    {item.title}
                  </span>
                  {item.summary && (
                    <span className="font-skeed-body text-sm text-skeed-color-neutral-600">
                      {item.summary}
                    </span>
                  )}
                </span>
                <ChevronDown
                  size={18}
                  className={cn(
                    'mt-skeed-spacing-1 shrink-0 text-skeed-color-brand-600 transition-transform duration-skeed-motion-duration-fast ease-skeed-motion-easing-default',
                    open && 'rotate-180',
                  )}
                />
              </button>
              <div
                id={contentId}
                hidden={!open}
                className="px-skeed-spacing-4 pb-skeed-spacing-4 font-skeed-body text-sm text-skeed-color-neutral-700"
              >
                {item.content}
              </div>
            </div>
          );
        })}
      </section>
    );
  },
);
