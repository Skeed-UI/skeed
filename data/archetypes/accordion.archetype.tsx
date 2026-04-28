import { ChevronDown } from '@skeed/asset-icon';
import { cn } from '@skeed/core/cn';
import { type HTMLAttributes, forwardRef, useState } from 'react';

let idCounter = 0;
function generateId() {
  idCounter += 1;
  return `accordion-item-${idCounter}`;
}

export interface AccordionItemProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  defaultOpen?: boolean;
}

export const AccordionItem = forwardRef<HTMLDivElement, AccordionItemProps>(function AccordionItem(
  { title, defaultOpen = false, children, className, ...rest },
  ref,
) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [itemId] = useState(() => generateId());

  return (
    <div ref={ref} className={cn('border-b border-skeed-color-neutral-200', className)} {...rest}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={`${itemId}-content`}
        className={cn(
          'w-full flex items-center justify-between',
          'px-skeed-spacing-4 py-skeed-spacing-3',
          'text-left font-medium font-skeed-body text-skeed-color-neutral-900',
          'hover:bg-skeed-color-neutral-50',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500',
          'transition-colors duration-skeed-motion-duration-fast ease-skeed-motion-easing-default',
        )}
      >
        <span>{title}</span>
        <ChevronDown
          size={16}
          className={cn(
            'transition-transform duration-skeed-motion-duration-fast',
            isOpen ? 'rotate-180' : '',
          )}
        />
      </button>
      {isOpen && (
        <div
          id={`${itemId}-content`}
          className="px-skeed-spacing-4 py-skeed-spacing-3 text-sm font-skeed-body text-skeed-color-neutral-600"
        >
          {children}
        </div>
      )}
    </div>
  );
});

export interface AccordionProps extends HTMLAttributes<HTMLDivElement> {}

export const Accordion = forwardRef<HTMLDivElement, AccordionProps>(function Accordion(
  { className, children, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={cn('w-full', className)} {...rest}>
      {children}
    </div>
  );
});
