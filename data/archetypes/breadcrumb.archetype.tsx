import { cn } from '@skeed/core/cn';
import { type HTMLAttributes, forwardRef } from 'react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps extends HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
}

const BASE_CLASSES = 'w-full';

const LIST_CLASSES = 'flex items-center flex-wrap gap-skeed-spacing-1 list-none m-0 p-0';

const ITEM_CLASSES = 'flex items-center gap-skeed-spacing-1';

const LINK_CLASSES =
  'font-skeed-body text-sm text-skeed-color-neutral-500 ' +
  'hover:text-skeed-color-brand-500 ' +
  'transition-colors duration-skeed-motion-duration-fast ease-skeed-motion-easing-default ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500 ' +
  'rounded-skeed-radius-1';

const CURRENT_CLASSES = 'font-skeed-body text-sm text-skeed-color-neutral-900 font-medium';

const SEPARATOR_CLASSES =
  'text-skeed-color-neutral-400 font-skeed-body text-sm select-none ' + 'px-skeed-spacing-1';

export const Breadcrumb = forwardRef<HTMLElement, BreadcrumbProps>(function Breadcrumb(
  { items, separator = '/', className, ...rest },
  ref,
) {
  return (
    <nav ref={ref} aria-label="Breadcrumb" className={cn(BASE_CLASSES, className)} {...rest}>
      <ol className={LIST_CLASSES} aria-label="breadcrumb">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className={ITEM_CLASSES}>
              {index > 0 && (
                <span className={SEPARATOR_CLASSES} aria-hidden="true">
                  {separator}
                </span>
              )}
              {isLast || !item.href ? (
                <span className={CURRENT_CLASSES} aria-current={isLast ? 'page' : undefined}>
                  {item.label}
                </span>
              ) : (
                <a href={item.href} className={LINK_CLASSES}>
                  {item.label}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
});
