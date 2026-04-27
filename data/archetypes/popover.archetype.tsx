import { type HTMLAttributes, forwardRef, useEffect, useCallback, useRef } from 'react';
import { cn } from '@skeed/core/cn';

export interface PopoverProps extends HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  onClose?: () => void;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

export const Popover = forwardRef<HTMLDivElement, PopoverProps>(function Popover(
  { className, open = false, onClose, placement = 'bottom', children, ...rest },
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

  // Handle click outside
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (internalRef.current && !internalRef.current.contains(event.target as Node)) {
      onClose?.();
    }
  }, [onClose]);

  useEffect(() => {
    if (open) {
      previousActiveElement.current = document.activeElement;
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
      // Focus the popover after render
      setTimeout(() => internalRef.current?.focus(), 0);
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      if (!open && previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    };
  }, [open, handleEscape, handleClickOutside]);

  if (!open) return null;

  return (
    <div
      ref={(node) => {
        internalRef.current = node;
        if (typeof forwardedRef === 'function') {
          forwardedRef(node);
        } else if (forwardedRef) {
          forwardedRef.current = node;
        }
      }}
      role="dialog"
      tabIndex={-1}
      className={cn(
        'absolute z-50',
        'bg-skeed-color-neutral-50 border border-skeed-color-neutral-200',
        'rounded-skeed-radius-2 shadow-skeed-shadow-2',
        'p-skeed-spacing-4',
        'animate-in fade-in zoom-in-95 duration-skeed-motion-duration-fast',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
});
