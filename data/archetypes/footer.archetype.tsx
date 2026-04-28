import { cn } from '@skeed/core/cn';
import { type HTMLAttributes, forwardRef } from 'react';

export interface FooterLinkColumn {
  heading: string;
  links: Array<{ label: string; href: string }>;
}

export interface FooterSocialLink {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export interface FooterProps extends HTMLAttributes<HTMLElement> {
  logo?: React.ReactNode;
  columns?: FooterLinkColumn[];
  copyright?: string;
  social?: FooterSocialLink[];
}

const BASE_CLASSES =
  'w-full bg-skeed-color-neutral-900 text-skeed-color-neutral-300 ' +
  'pt-skeed-spacing-8 pb-skeed-spacing-6 px-skeed-spacing-6';

const INNER_CLASSES = 'mx-auto max-w-screen-xl';

const TOP_ROW_CLASSES =
  'flex flex-col gap-skeed-spacing-8 ' + 'sm:flex-row sm:items-start sm:justify-between';

const LOGO_CLASSES = 'flex-shrink-0';

const COLUMNS_GRID_CLASSES =
  'flex-1 grid grid-cols-2 gap-skeed-spacing-6 sm:grid-cols-4 sm:gap-skeed-spacing-8';

const COLUMN_HEADING_CLASSES =
  'font-skeed-body font-semibold text-skeed-color-neutral-50 ' +
  'mb-skeed-spacing-3 uppercase tracking-wide';

const COLUMN_LIST_CLASSES = 'flex flex-col gap-skeed-spacing-2 list-none m-0 p-0';

const COLUMN_LINK_CLASSES =
  'font-skeed-body text-sm text-skeed-color-neutral-400 ' +
  'hover:text-skeed-color-neutral-50 ' +
  'transition-colors duration-skeed-motion-duration-fast ease-skeed-motion-easing-default ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500 ' +
  'rounded-skeed-radius-1';

const BOTTOM_ROW_CLASSES =
  'mt-skeed-spacing-8 pt-skeed-spacing-6 border-t border-skeed-color-neutral-700 ' +
  'flex flex-col gap-skeed-spacing-4 sm:flex-row sm:items-center sm:justify-between';

const COPYRIGHT_CLASSES = 'font-skeed-body text-sm text-skeed-color-neutral-500';

const SOCIAL_LIST_CLASSES = 'flex items-center gap-skeed-spacing-3 list-none m-0 p-0';

const SOCIAL_LINK_CLASSES =
  'flex items-center justify-center ' +
  'w-skeed-spacing-4 h-skeed-spacing-4 ' +
  'text-skeed-color-neutral-400 hover:text-skeed-color-neutral-50 ' +
  'transition-colors duration-skeed-motion-duration-fast ease-skeed-motion-easing-default ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500 ' +
  'rounded-skeed-radius-1';

export const Footer = forwardRef<HTMLElement, FooterProps>(function Footer(
  { logo, columns, copyright, social, className, ...rest },
  ref,
) {
  return (
    <footer ref={ref} className={cn(BASE_CLASSES, className)} {...rest}>
      <div className={INNER_CLASSES}>
        <div className={TOP_ROW_CLASSES}>
          {/* Asset slot: logo (optional) */}
          {logo && <div className={LOGO_CLASSES}>{logo}</div>}

          {columns && columns.length > 0 && (
            <div className={COLUMNS_GRID_CLASSES}>
              {columns.map((col) => (
                <div key={col.heading}>
                  <p className={COLUMN_HEADING_CLASSES}>{col.heading}</p>
                  <ul className={COLUMN_LIST_CLASSES} role="list">
                    {col.links.map((link) => (
                      <li key={link.href}>
                        <a href={link.href} className={COLUMN_LINK_CLASSES}>
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={BOTTOM_ROW_CLASSES}>
          {copyright && <p className={COPYRIGHT_CLASSES}>{copyright}</p>}

          {social && social.length > 0 && (
            <ul className={SOCIAL_LIST_CLASSES} role="list" aria-label="Social links">
              {social.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className={SOCIAL_LINK_CLASSES}
                    aria-label={item.label}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {item.icon}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </footer>
  );
});
