import { cn } from '@skeed/core/cn';
import { type HTMLAttributes, forwardRef, useCallback, useEffect, useRef } from 'react';

export interface DialogProps extends HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  onClose?: () => void;
  title?: string;
  description?: string;
}

export const Dialog = forwardRef<HTMLDivElement, DialogProps>(function Dialog(
  { className, open = false, onClose, title, description, children, ...rest },
  forwardedRef,
) {
  const internalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  // Handle escape key
  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onClose) {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      previousActiveElement.current = document.activeElement;
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when dialog is open
      document.body.style.overflow = 'hidden';
      // Focus the dialog content after render
      setTimeout(() => {
        const dialogEl = internalRef.current;
        if (dialogEl) {
          const focusableEl = dialogEl.querySelector<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          );
          (focusableEl || dialogEl).focus();
        }
      }, 0);
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
      // Restore focus on close
      if (previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    };
  }, [open, handleEscape]);

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
        ref={(node) => {
          internalRef.current = node;
          if (typeof forwardedRef === 'function') {
            forwardedRef(node);
          } else if (forwardedRef) {
            forwardedRef.current = node;
          }
        }}
        tabIndex={-1}
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
          <h2
            id="dialog-title"
            className="text-lg font-semibold font-skeed-body text-skeed-color-neutral-900 mb-skeed-spacing-1"
            tabIndex={-1}
          >
            {title}
          </h2>
        )}
        {description && (
          <p
            id="dialog-description"
            className="text-sm font-skeed-body text-skeed-color-neutral-600 mb-skeed-spacing-4"
          >
            {description}
          </p>
        )}
        {children}
      </div>
    </div>
  );
});
