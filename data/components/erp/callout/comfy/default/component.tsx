import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@skeed/core/cn';

export interface CalloutProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
}

const variantClasses: Record<NonNullable<CalloutProps['variant']>, string> = {
  info: 'bg-skeed-color-info-50 border-l-skeed-color-info-500 text-skeed-color-info-800',
  success: 'bg-skeed-color-success-50 border-l-skeed-color-success-500 text-skeed-color-success-800',
  warning: 'bg-skeed-color-warning-50 border-l-skeed-color-warning-500 text-skeed-color-warning-800',
  danger: 'bg-skeed-color-danger-50 border-l-skeed-color-danger-500 text-skeed-color-danger-800',
};

export const Callout = forwardRef<HTMLDivElement, CalloutProps>(function Callout(
  { className, variant = 'info', title, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'px-skeed-spacing-4 py-skeed-spacing-3',
        'border-l-4 rounded-skeed-radius-1',
        variantClasses[variant],
        className,
      )}
      {...rest}
    >
      {title && (
        <p className="font-medium font-skeed-body mb-skeed-spacing-1">{title}</p>
      )}
      <div className="text-sm font-skeed-body">{children}</div>
    </div>
  );
});
