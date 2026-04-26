/**
 * @generated Component: accordion
 * @demographic classic
 * @density comfy
 * @variant default
 * @category molecule
 * @schemaVersion 1
 * @generatedAt 2026-04-26T03:16:26.960Z
 * 
 * DO NOT EDIT: This file is auto-generated from archetype:
 *   - Source: accordion
 *   - Preset: classic
 */
import { type HTMLAttributes, forwardRef, useState } from 'react';
import { cn } from '@skeed/core/cn';

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
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn('transition-transform duration-skeed-motion-duration-fast', isOpen ? 'rotate-180' : '')}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
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
