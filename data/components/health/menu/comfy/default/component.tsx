import { type HTMLAttributes, forwardRef, type ReactNode } from 'react';
import { cn } from '@skeed/core/cn';

export interface MenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}

export interface MenuProps extends HTMLAttributes<HTMLDivElement> {
  items: MenuItem[];
}

export const Menu = forwardRef<HTMLDivElement, MenuProps>(function Menu(
  { className, items, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      role="menu"
      className={cn(
        'flex flex-col',
        'min-w-skeed-spacing-40',
        'bg-skeed-color-neutral-50 border border-skeed-color-neutral-200',
        'rounded-skeed-radius-2 shadow-skeed-shadow-2',
        'py-skeed-spacing-1',
        className,
      )}
      {...rest}
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="menuitem"
          disabled={item.disabled}
          onClick={item.onClick}
          className={cn(
            'flex items-center gap-skeed-spacing-2',
            'px-skeed-spacing-3 py-skeed-spacing-2',
            'text-sm font-skeed-body text-skeed-color-neutral-700',
            'hover:bg-skeed-color-neutral-100',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500',
            item.disabled && 'opacity-50 cursor-not-allowed hover:bg-transparent',
          )}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
});
