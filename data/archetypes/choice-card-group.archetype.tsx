import { CheckCircle } from '@skeed/asset-icon';
import { cn } from '@skeed/core/cn';
import { type HTMLAttributes, type ReactNode, forwardRef } from 'react';

export interface ChoiceCardOption {
  id: string;
  title: string;
  description?: string;
  meta?: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface ChoiceCardGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  options: ChoiceCardOption[];
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  layout?: 'grid' | 'stack' | 'featured' | 'segmented';
  columns?: 2 | 3 | 4;
}

const layoutClasses = {
  grid: 'grid',
  stack: 'grid grid-cols-1',
  featured: 'grid',
  segmented: 'inline-grid w-full grid-flow-col auto-cols-fr rounded-skeed-radius-2 bg-skeed-color-neutral-100 p-skeed-spacing-1',
};

const columnClasses = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
};

export const ChoiceCardGroup = forwardRef<HTMLDivElement, ChoiceCardGroupProps>(
  function ChoiceCardGroup(
    { options, value, onChange, label, layout = 'grid', columns = 3, className, ...rest },
    ref,
  ) {
    const isSegmented = layout === 'segmented';

    return (
      <div
        ref={ref}
        role="radiogroup"
        aria-label={label}
        className={cn(
          'gap-skeed-spacing-3',
          layoutClasses[layout],
          !isSegmented && layout !== 'stack' && columnClasses[columns],
          className,
        )}
        {...rest}
      >
        {options.map((option, index) => {
          const selected = option.id === value;
          const featured = layout === 'featured' && index === 0;

          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={option.disabled}
              onClick={() => !option.disabled && onChange?.(option.id)}
              className={cn(
                'group relative flex min-w-0 text-left font-skeed-body',
                'transition-all duration-skeed-motion-duration-fast ease-skeed-motion-easing-default',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500',
                'disabled:pointer-events-none disabled:opacity-50',
                isSegmented
                  ? 'items-center justify-center rounded-skeed-radius-2 px-skeed-spacing-3 py-skeed-spacing-2'
                  : 'flex-col gap-skeed-spacing-3 rounded-skeed-radius-2 border p-skeed-spacing-4 shadow-skeed-shadow-1 hover:-translate-y-skeed-spacing-1 hover:shadow-skeed-shadow-2',
                featured && 'sm:col-span-2 lg:col-span-2',
                selected
                  ? 'border-skeed-color-brand-500 bg-skeed-color-brand-50 text-skeed-color-neutral-900'
                  : 'border-skeed-color-neutral-200 bg-skeed-color-neutral-50 text-skeed-color-neutral-900 hover:border-skeed-color-brand-300',
              )}
            >
              <span className="flex min-w-0 items-start justify-between gap-skeed-spacing-3">
                <span className="flex min-w-0 items-start gap-skeed-spacing-3">
                  {option.icon && (
                    <span className="inline-flex h-skeed-spacing-8 w-skeed-spacing-8 shrink-0 items-center justify-center rounded-skeed-radius-2 bg-skeed-color-neutral-100 text-skeed-color-brand-600">
                      {option.icon}
                    </span>
                  )}
                  <span className="flex min-w-0 flex-col gap-skeed-spacing-1">
                    <span className="truncate text-sm font-semibold">{option.title}</span>
                    {!isSegmented && option.description && (
                      <span className="text-sm text-skeed-color-neutral-600">
                        {option.description}
                      </span>
                    )}
                  </span>
                </span>
                {!isSegmented && selected && (
                  <CheckCircle size={18} className="shrink-0 text-skeed-color-brand-600" />
                )}
              </span>
              {!isSegmented && option.meta && (
                <span className="text-xs font-medium text-skeed-color-neutral-500">
                  {option.meta}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  },
);
