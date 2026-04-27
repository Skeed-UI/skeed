import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@skeed/core/cn';

export interface ToastProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error';
  onClose?: () => void;
}

const variantClasses: Record<NonNullable<ToastProps['variant']>, string> = {
  info: 'bg-skeed-color-neutral-800 text-white',
  success: 'bg-skeed-color-success-500 text-white',
  warning: 'bg-skeed-color-warning-500 text-skeed-color-neutral-900',
  error: 'bg-skeed-color-danger-500 text-white',
};

export const Toast = forwardRef<HTMLDivElement, ToastProps>(function Toast(
  { className, variant = 'info', onClose, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      role="alert"
      className={cn(
        'flex items-center gap-skeed-spacing-3',
        'px-skeed-spacing-4 py-skeed-spacing-3',
        'rounded-skeed-radius-2 shadow-skeed-shadow-2',
        'text-sm font-skeed-body',
        variantClasses[variant],
        className,
      )}
      {...rest}
    >
      <div className="flex-1">{children}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss toast"
          className={cn(
            'flex items-center justify-center',
            'h-skeed-spacing-5 w-skeed-spacing-5',
            'rounded-skeed-radius-1',
            'opacity-70 hover:opacity-100',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
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
    </div>
  );
});
