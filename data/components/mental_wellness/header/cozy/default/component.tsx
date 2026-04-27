import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@skeed/core/cn';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface HeaderProps extends HTMLAttributes<HTMLElement> {
  title: string;
  subtitle?: string;
  breadcrumb?: BreadcrumbItem[];
  actions?: React.ReactNode;
  divider?: boolean;
}

const BASE_CLASSES =
  'w-full bg-skeed-color-neutral-50 px-skeed-spacing-6 py-skeed-spacing-4';

const DIVIDER_CLASSES = 'border-b border-skeed-color-neutral-200';

const BREADCRUMB_NAV_CLASSES = 'mb-skeed-spacing-2';

const BREADCRUMB_LIST_CLASSES =
  'flex items-center gap-skeed-spacing-1 list-none m-0 p-0 flex-wrap';

const BREADCRUMB_ITEM_CLASSES = 'flex items-center gap-skeed-spacing-1';

const BREADCRUMB_LINK_CLASSES =
  'font-skeed-body text-sm text-skeed-color-neutral-500 ' +
  'hover:text-skeed-color-brand-500 ' +
  'transition-colors duration-skeed-motion-duration-fast ease-skeed-motion-easing-default ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500 ' +
  'rounded-skeed-radius-1';

const BREADCRUMB_CURRENT_CLASSES =
  'font-skeed-body text-sm text-skeed-color-neutral-700 font-medium';

const BREADCRUMB_SEPARATOR_CLASSES =
  'text-skeed-color-neutral-400 font-skeed-body text-sm select-none';

const CONTENT_ROW_CLASSES = 'flex items-start justify-between gap-skeed-density-cozy-gap';

const TEXT_GROUP_CLASSES = 'flex flex-col gap-skeed-spacing-1 min-w-0';

const TITLE_CLASSES =
  'font-skeed-display font-semibold text-skeed-color-neutral-900 truncate';

const SUBTITLE_CLASSES =
  'font-skeed-body text-skeed-color-neutral-500';

const ACTIONS_CLASSES = 'flex-shrink-0 flex items-center gap-skeed-density-cozy-gap';

export const Header = forwardRef<HTMLElement, HeaderProps>(function Header(
  {
    title,
    subtitle,
    breadcrumb,
    actions,
    divider = true,
    className,
    ...rest
  },
  ref,
) {
  return (
    <header
      ref={ref}
      className={cn(BASE_CLASSES, divider && DIVIDER_CLASSES, className)}
      {...rest}
    >
      {breadcrumb && breadcrumb.length > 0 && (
        <nav aria-label="Breadcrumb" className={BREADCRUMB_NAV_CLASSES}>
          <ol className={BREADCRUMB_LIST_CLASSES} aria-label="breadcrumb">
            {breadcrumb.map((crumb, index) => {
              const isLast = index === breadcrumb.length - 1;
              return (
                <li key={index} className={BREADCRUMB_ITEM_CLASSES}>
                  {index > 0 && (
                    <span className={BREADCRUMB_SEPARATOR_CLASSES} aria-hidden="true">/</span>
                  )}
                  {isLast || !crumb.href ? (
                    <span
                      className={BREADCRUMB_CURRENT_CLASSES}
                      aria-current={isLast ? 'page' : undefined}
                    >
                      {crumb.label}
                    </span>
                  ) : (
                    <a href={crumb.href} className={BREADCRUMB_LINK_CLASSES}>
                      {crumb.label}
                    </a>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      )}

      <div className={CONTENT_ROW_CLASSES}>
        <div className={TEXT_GROUP_CLASSES}>
          <h1 className={TITLE_CLASSES}>{title}</h1>
          {subtitle && <p className={SUBTITLE_CLASSES}>{subtitle}</p>}
        </div>
        {actions && <div className={ACTIONS_CLASSES}>{actions}</div>}
      </div>
    </header>
  );
});
