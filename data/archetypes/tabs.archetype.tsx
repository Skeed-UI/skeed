import { cn } from '@skeed/core/cn';
import { type HTMLAttributes, type KeyboardEvent, forwardRef, useRef } from 'react';

type TabVariant = 'underline' | 'solid' | 'ghost';

export interface TabItem {
  id: string;
  label: string;
  disabled?: boolean;
}

export interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: TabVariant;
}

const WRAPPER_CLASSES = 'w-full';

const TABLIST_BASE_CLASSES = 'flex items-center gap-skeed-spacing-1';

const TABLIST_VARIANT_CLASSES: Record<TabVariant, string> = {
  underline: 'border-b border-skeed-color-neutral-200 gap-skeed-spacing-0',
  solid: 'bg-skeed-color-neutral-100 rounded-skeed-radius-2 p-skeed-spacing-1 gap-skeed-spacing-1',
  ghost: 'gap-skeed-spacing-1',
};

const TAB_BASE_CLASSES =
  'inline-flex items-center justify-center ' +
  'font-skeed-body font-medium ' +
  'px-skeed-density-cozy-padx py-skeed-density-cozy-pady ' +
  'transition-colors duration-skeed-motion-duration-fast ease-skeed-motion-easing-default ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500 ' +
  'disabled:pointer-events-none disabled:opacity-50 ' +
  'cursor-pointer select-none whitespace-nowrap';

const TAB_VARIANT_INACTIVE: Record<TabVariant, string> = {
  underline:
    'text-skeed-color-neutral-500 hover:text-skeed-color-neutral-900 ' +
    'border-b-2 border-transparent -mb-px rounded-t-skeed-radius-1',
  solid:
    'text-skeed-color-neutral-500 hover:text-skeed-color-neutral-900 ' +
    'hover:bg-skeed-color-neutral-200 rounded-skeed-radius-2',
  ghost:
    'text-skeed-color-neutral-500 hover:text-skeed-color-neutral-900 ' +
    'hover:bg-skeed-color-neutral-100 rounded-skeed-radius-2',
};

const TAB_VARIANT_ACTIVE: Record<TabVariant, string> = {
  underline:
    'text-skeed-color-brand-600 border-b-2 border-skeed-color-brand-500 -mb-px rounded-t-skeed-radius-1',
  solid:
    'bg-skeed-color-neutral-50 text-skeed-color-neutral-900 ' +
    'shadow-skeed-shadow-1 rounded-skeed-radius-2',
  ghost: 'bg-skeed-color-brand-50 text-skeed-color-brand-600 rounded-skeed-radius-2',
};

export const Tabs = forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  { tabs, activeTab, onChange, variant = 'underline', className, ...rest },
  ref,
) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const enabledTabs = tabs.map((tab, i) => ({ tab, i })).filter(({ tab }) => !tab.disabled);

    const currentEnabledIndex = enabledTabs.findIndex(({ i }) => i === index);

    let nextEnabledIndex: number | undefined;

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      nextEnabledIndex = enabledTabs[(currentEnabledIndex + 1) % enabledTabs.length]?.i;
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      nextEnabledIndex =
        enabledTabs[(currentEnabledIndex - 1 + enabledTabs.length) % enabledTabs.length]?.i;
    } else if (event.key === 'Home') {
      event.preventDefault();
      nextEnabledIndex = enabledTabs[0]?.i;
    } else if (event.key === 'End') {
      event.preventDefault();
      nextEnabledIndex = enabledTabs[enabledTabs.length - 1]?.i;
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!tabs[index]?.disabled) {
        onChange(tabs[index].id);
      }
      return;
    }

    if (nextEnabledIndex !== undefined) {
      tabRefs.current[nextEnabledIndex]?.focus();
      onChange(tabs[nextEnabledIndex].id);
    }
  };

  return (
    <div ref={ref} className={cn(WRAPPER_CLASSES, className)} {...rest}>
      <div
        role="tablist"
        aria-orientation="horizontal"
        className={cn(TABLIST_BASE_CLASSES, TABLIST_VARIANT_CLASSES[variant])}
      >
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              aria-disabled={tab.disabled}
              disabled={tab.disabled}
              tabIndex={isActive ? 0 : -1}
              className={cn(
                TAB_BASE_CLASSES,
                isActive ? TAB_VARIANT_ACTIVE[variant] : TAB_VARIANT_INACTIVE[variant],
              )}
              onClick={() => !tab.disabled && onChange(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
});
