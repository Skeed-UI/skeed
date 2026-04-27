import { type HTMLAttributes, forwardRef, useEffect, useCallback, useRef } from 'react';
import { cn } from '@skeed/core/cn';

export interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  onClose?: () => void;
  title?: string;
}

export const Modal = forwardRef<HTMLDivElement, ModalProps>(function Modal(
  { className, open = false, onClose, title, children, ...rest },
  forwardedRef,
) {
  const internalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  // Handle escape key
  const handleEscape = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && onClose) {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (open) {
      // Store current focus
      previousActiveElement.current = document.activeElement;
      // Add escape listener
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      // Focus the modal content after render
      setTimeout(() => {
        const modalEl = internalRef.current;
        if (modalEl) {
          const focusableEl = modalEl.querySelector<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          (focusableEl || modalEl).focus();
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
                  className="transition-transform duration-skeed-motion-duration-fast hover:rotate-90"
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
