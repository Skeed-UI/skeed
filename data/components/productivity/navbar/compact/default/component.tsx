import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@skeed/core/cn';

export interface NavbarLink {
  label: string;
  href: string;
  active?: boolean;
}

export interface NavbarProps extends HTMLAttributes<HTMLElement> {
  logo?: React.ReactNode;
  links?: NavbarLink[];
  actions?: React.ReactNode;
  sticky?: boolean;
}

const BASE_CLASSES =
  'w-full bg-skeed-color-neutral-50 border-b border-skeed-color-neutral-200 ' +
  'shadow-skeed-shadow-1';

const STICKY_CLASSES = 'sticky top-0 z-50 backdrop-blur-sm';

const INNER_CLASSES =
  'mx-auto max-w-screen-xl flex items-center justify-between ' +
  'px-skeed-spacing-6 py-skeed-spacing-4 gap-skeed-density-cozy-gap';

const LOGO_CLASSES = 'flex-shrink-0 flex items-center';

const LINKS_WRAPPER_CLASSES = 'flex-1 flex items-center justify-center';

const LIST_CLASSES = 'flex items-center gap-skeed-density-cozy-gap list-none m-0 p-0';

const LINK_BASE_CLASSES =
  'font-skeed-body text-skeed-color-neutral-700 ' +
  'transition-colors duration-skeed-motion-duration-fast ease-skeed-motion-easing-default ' +
  'hover:text-skeed-color-brand-500 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500 ' +
  'rounded-skeed-radius-1 px-skeed-spacing-2 py-skeed-spacing-1';

const LINK_ACTIVE_CLASSES = 'text-skeed-color-brand-500 font-semibold';

const ACTIONS_CLASSES = 'flex-shrink-0 flex items-center gap-skeed-density-cozy-gap';

export const Navbar = forwardRef<HTMLElement, NavbarProps>(function Navbar(
  { logo, links, actions, sticky = false, className, ...rest },
  ref,
) {
  return (
    <nav
      ref={ref}
      aria-label="Main navigation"
      className={cn(BASE_CLASSES, sticky && STICKY_CLASSES, className)}
      {...rest}
    >
      <div className={INNER_CLASSES}>
        {logo && <div className={LOGO_CLASSES}>{logo}</div>}

        {links && links.length > 0 && (
          <div className={LINKS_WRAPPER_CLASSES}>
            <ul className={LIST_CLASSES} role="list">
              {links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className={cn(LINK_BASE_CLASSES, link.active && LINK_ACTIVE_CLASSES)}
                    aria-current={link.active ? 'page' : undefined}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {actions && <div className={ACTIONS_CLASSES}>{actions}</div>}
      </div>
    </nav>
  );
});
