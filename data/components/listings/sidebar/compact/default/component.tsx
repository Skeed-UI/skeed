import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@skeed/core/cn';

export interface SidebarItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
  active?: boolean;
  badge?: string | number;
}

export interface SidebarProps extends HTMLAttributes<HTMLElement> {
  items: SidebarItem[];
  collapsed?: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

const BASE_CLASSES =
  'flex flex-col bg-skeed-color-neutral-50 border-r border-skeed-color-neutral-200 ' +
  'transition-all duration-skeed-motion-duration-normal ease-skeed-motion-easing-default ' +
  'h-full overflow-hidden';

const EXPANDED_CLASSES = 'w-skeed-spacing-10';
const COLLAPSED_CLASSES = 'w-skeed-spacing-6';

const HEADER_CLASSES =
  'flex-shrink-0 flex items-center px-skeed-spacing-3 py-skeed-spacing-4 ' +
  'border-b border-skeed-color-neutral-200';

const NAV_CLASSES = 'flex-1 overflow-y-auto py-skeed-spacing-3';

const LIST_CLASSES = 'flex flex-col gap-skeed-spacing-1 px-skeed-spacing-2 list-none m-0 p-0';

const ITEM_BASE_CLASSES =
  'flex items-center gap-skeed-spacing-3 ' +
  'px-skeed-density-cozy-padx py-skeed-density-cozy-pady rounded-skeed-radius-2 ' +
  'font-skeed-body text-skeed-color-neutral-700 ' +
  'transition-colors duration-skeed-motion-duration-fast ease-skeed-motion-easing-default ' +
  'hover:bg-skeed-color-neutral-100 hover:text-skeed-color-neutral-900 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500 ' +
  'cursor-pointer w-full text-left';

const ITEM_ACTIVE_CLASSES =
  'bg-skeed-color-brand-50 text-skeed-color-brand-600 font-semibold ' +
  'hover:bg-skeed-color-brand-100 hover:text-skeed-color-brand-700';

const ICON_CLASSES = 'flex-shrink-0 w-skeed-spacing-4 h-skeed-spacing-4';

const LABEL_CLASSES =
  'flex-1 truncate transition-opacity duration-skeed-motion-duration-fast ease-skeed-motion-easing-default';

const BADGE_CLASSES =
  'ml-auto flex-shrink-0 ' +
  'bg-skeed-color-brand-500 text-skeed-color-neutral-50 ' +
  'font-skeed-body text-xs font-semibold ' +
  'px-skeed-spacing-1 py-skeed-spacing-0 rounded-skeed-radius-7 ' +
  'min-w-skeed-spacing-3 text-center';

const FOOTER_CLASSES =
  'flex-shrink-0 border-t border-skeed-color-neutral-200 ' +
  'px-skeed-spacing-3 py-skeed-spacing-4';

export const Sidebar = forwardRef<HTMLElement, SidebarProps>(function Sidebar(
  { items, collapsed = false, header, footer, className, ...rest },
  ref,
) {
  return (
    <aside
      ref={ref}
      aria-label="Navigation"
      className={cn(BASE_CLASSES, collapsed ? COLLAPSED_CLASSES : EXPANDED_CLASSES, className)}
      {...rest}
    >
      {header && <div className={HEADER_CLASSES}>{header}</div>}

      <nav className={NAV_CLASSES} aria-label="Sidebar navigation">
        <ul className={LIST_CLASSES} role="list">
          {items.map((item) => {
            const content = (
              <>
                {item.icon && <span className={ICON_CLASSES} aria-hidden="true">{item.icon}</span>}
                {!collapsed && (
                  <span className={LABEL_CLASSES}>{item.label}</span>
                )}
                {!collapsed && item.badge !== undefined && (
                  <span className={BADGE_CLASSES} aria-label={`${item.badge} notifications`}>
                    {item.badge}
                  </span>
                )}
              </>
            );

            return (
              <li key={item.id}>
                {item.href ? (
                  <a
                    href={item.href}
                    className={cn(ITEM_BASE_CLASSES, item.active && ITEM_ACTIVE_CLASSES)}
                    aria-current={item.active ? 'page' : undefined}
                    title={collapsed ? item.label : undefined}
                  >
                    {content}
                  </a>
                ) : (
                  <button
                    type="button"
                    className={cn(ITEM_BASE_CLASSES, item.active && ITEM_ACTIVE_CLASSES)}
                    aria-pressed={item.active}
                    title={collapsed ? item.label : undefined}
                  >
                    {content}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {footer && <div className={FOOTER_CLASSES}>{footer}</div>}
    </aside>
  );
});
