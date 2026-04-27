import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@skeed/core/cn';

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger';
  removable?: boolean;
  onRemove?: () => void;
}

const variantClasses: Record<NonNullable<TagProps['variant']>, string> = {
  default: 'bg-skeed-color-neutral-100 text-skeed-color-neutral-700 border-skeed-color-neutral-200',
  success: 'bg-skeed-color-success-100 text-skeed-color-success-700 border-skeed-color-success-200',
  warning: 'bg-skeed-color-warning-100 text-skeed-color-warning-700 border-skeed-color-warning-200',
  danger: 'bg-skeed-color-danger-100 text-skeed-color-danger-700 border-skeed-color-danger-200',
};

export const Tag = forwardRef<HTMLSpanElement, TagProps>(function Tag(
  { className, variant = 'default', removable, onRemove, children, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center gap-skeed-spacing-1',
        'px-skeed-spacing-2 py-skeed-spacing-0',
        'rounded-skeed-radius-2 border',
        'text-xs font-medium font-skeed-body',
        variantClasses[variant],
        className,
      )}
      {...rest}
    >
      <span>{children}</span>
      {removable && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove tag"
          className={cn(
            'flex items-center justify-center',
            'h-skeed-spacing-3 w-skeed-spacing-3',
            'rounded-skeed-radius-1',
            'hover:bg-skeed-color-neutral-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500',
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </span>
  );
});
