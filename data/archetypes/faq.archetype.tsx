import { type HTMLAttributes, forwardRef, useState } from 'react';
import { cn } from '@skeed/core/cn';
import { ChevronDown } from '@skeed/asset-icon';

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface FaqProps extends HTMLAttributes<HTMLDivElement> {
  items: FaqItem[];
  allowMultiple?: boolean;
}

export const Faq = forwardRef<HTMLDivElement, FaqProps>(function Faq(
  { className, items, allowMultiple = false, ...rest },
  ref,
) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    setOpenItems((prev) => {
      const next = new Set(allowMultiple ? prev : []);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div
      ref={ref}
      className={cn('w-full space-y-skeed-spacing-2', className)}
      {...rest}
    >
      {items.map((item) => {
        const isOpen = openItems.has(item.id);
        return (
          <div
            key={item.id}
            className={cn(
              'border border-skeed-color-neutral-200 rounded-skeed-radius-2',
              'bg-skeed-color-neutral-50',
            )}
          >
            <button
              type="button"
              onClick={() => toggleItem(item.id)}
              aria-expanded={isOpen}
              className={cn(
                'w-full flex items-center justify-between',
                'px-skeed-spacing-4 py-skeed-spacing-3',
                'text-left font-medium font-skeed-body text-skeed-color-neutral-900',
                'hover:bg-skeed-color-neutral-100',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500',
                'transition-colors duration-skeed-motion-duration-fast',
                'rounded-skeed-radius-2',
              )}
            >
              <span>{item.question}</span>
              <ChevronDown
                size={16}
                className={cn(
                  'transition-transform duration-skeed-motion-duration-fast',
                  isOpen ? 'rotate-180' : '',
                )}
              />
            </button>
            {isOpen && (
              <div className="px-skeed-spacing-4 py-skeed-spacing-3 text-sm font-skeed-body text-skeed-color-neutral-600">
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});
