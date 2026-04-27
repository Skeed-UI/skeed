import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@skeed/core/cn';

export interface DialogProps extends HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  onClose?: () => void;
  title?: string;
  description?: string;
}

export const Dialog = forwardRef<HTMLDivElement, DialogProps>(function Dialog(
  { className, open = false, onClose, title, description, children, ...rest },
  ref,
) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'dialog-title' : undefined}
      aria-describedby={description ? 'dialog-description' : undefined}
    >
      <div
        className="absolute inset-0 bg-skeed-color-neutral-900/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={ref}
        className={cn(
          'relative z-10',
          'w-full max-w-md',
          'bg-skeed-color-neutral-50',
          'rounded-skeed-radius-2 shadow-skeed-shadow-3',
          'm-skeed-spacing-4 p-skeed-spacing-6',
          className,
        )}
        {...rest}
      >
        {title && (
          <h2 id="dialog-title" className="text-lg font-semibold font-skeed-body text-skeed-color-neutral-900 mb-skeed-spacing-1">
            {title}
          </h2>
        )}
        {description && (
          <p id="dialog-description" className="text-sm font-skeed-body text-skeed-color-neutral-600 mb-skeed-spacing-4">
            {description}
          </p>
        )}
        {children}
      </div>
    </div>
  );
});
