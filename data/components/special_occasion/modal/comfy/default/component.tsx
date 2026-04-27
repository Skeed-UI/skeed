import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@skeed/core/cn';

export interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  onClose?: () => void;
  title?: string;
}

export const Modal = forwardRef<HTMLDivElement, ModalProps>(function Modal(
  { className, open = false, onClose, title, children, ...rest },
  ref,
) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
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
          'w-full max-w-lg',
          'bg-skeed-color-neutral-50',
          'rounded-skeed-radius-2 shadow-skeed-shadow-3',
          'm-skeed-spacing-4',
          className,
        )}
        {...rest}
      >
        {title && (
          <div className="flex items-center justify-between px-skeed-spacing-6 py-skeed-spacing-4 border-b border-skeed-color-neutral-200">
            <h2 className="text-lg font-semibold font-skeed-body text-skeed-color-neutral-900">
              {title}
            </h2>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className={cn(
                  'flex items-center justify-center',
                  'h-skeed-spacing-8 w-skeed-spacing-8',
                  'rounded-skeed-radius-1',
                  'text-skeed-color-neutral-500 hover:bg-skeed-color-neutral-100',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500',
                )}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
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
        )}
        <div className="px-skeed-spacing-6 py-skeed-spacing-4">{children}</div>
      </div>
    </div>
  );
});
