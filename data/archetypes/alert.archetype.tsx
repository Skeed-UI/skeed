import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@skeed/core/cn';
import { X } from '@skeed/asset-icon';

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'danger';
  dismissible?: boolean;
  onDismiss?: () => void;
}

const variantClasses: Record<NonNullable<AlertProps['variant']>, string> = {
  info: 'bg-skeed-color-info-50 border-skeed-color-info-200 text-skeed-color-info-800',
  success: 'bg-skeed-color-success-50 border-skeed-color-success-200 text-skeed-color-success-800',
  warning: 'bg-skeed-color-warning-50 border-skeed-color-warning-200 text-skeed-color-warning-800',
  danger: 'bg-skeed-color-danger-50 border-skeed-color-danger-200 text-skeed-color-danger-800',
};

export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
  { className, variant = 'info', dismissible, onDismiss, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      role="alert"
      className={cn(
        'flex items-start gap-skeed-spacing-3',
        'px-skeed-spacing-4 py-skeed-spacing-3',
        'rounded-skeed-radius-2 border',
        variantClasses[variant],
        className,
      )}
      {...rest}
    >
      <div className="flex-1 text-sm font-skeed-body">{children}</div>
      {dismissible && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss alert"
          className={cn(
            'flex items-center justify-center',
            'h-skeed-spacing-5 w-skeed-spacing-5',
            'rounded-skeed-radius-1',
            'hover:bg-skeed-color-neutral-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500',
          )}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
});
