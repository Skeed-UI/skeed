import { type HTMLAttributes, forwardRef, useEffect, useRef } from 'react';
import { cn } from '@skeed/core/cn';

type DrawerSide = 'left' | 'right' | 'bottom';
type DrawerSize = 'sm' | 'md' | 'lg';

export interface DrawerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  open: boolean;
  onClose: () => void;
  title?: string;
  side?: DrawerSide;
  size?: DrawerSize;
  children: React.ReactNode;
}

const BACKDROP_CLASSES =
  'fixed inset-0 z-40 bg-skeed-color-neutral-900/50 ' +
  'transition-opacity duration-skeed-motion-duration-normal ease-skeed-motion-easing-default';

const PANEL_BASE_CLASSES =
  'fixed z-50 bg-skeed-color-neutral-50 shadow-skeed-shadow-1 ' +
  'flex flex-col ' +
  'transition-transform duration-skeed-motion-duration-normal ease-skeed-motion-easing-default';

const SIDE_POSITION_CLASSES: Record<DrawerSide, string> = {
  right: 'top-0 right-0 h-full',
  left: 'top-0 left-0 h-full',
  bottom: 'bottom-0 left-0 right-0 w-full',
};

const SIDE_OPEN_TRANSLATE: Record<DrawerSide, string> = {
  right: 'translate-x-0',
  left: 'translate-x-0',
  bottom: 'translate-y-0',
};

const SIDE_CLOSED_TRANSLATE: Record<DrawerSide, string> = {
  right: 'translate-x-full',
  left: '-translate-x-full',
  bottom: 'translate-y-full',
};

const HORIZONTAL_SIZE_CLASSES: Record<DrawerSize, string> = {
  sm: 'w-skeed-spacing-8',
  md: 'w-skeed-spacing-10',
  lg: 'w-full max-w-screen-sm',
};

const BOTTOM_SIZE_CLASSES: Record<DrawerSize, string> = {
  sm: 'max-h-skeed-spacing-8',
  md: 'max-h-skeed-spacing-10',
  lg: 'max-h-screen-sm',
};

const HEADER_CLASSES =
  'flex items-center justify-between flex-shrink-0 ' +
  'px-skeed-spacing-6 py-skeed-spacing-4 ' +
  'border-b border-skeed-color-neutral-200';

const TITLE_CLASSES =
  'font-skeed-display font-semibold text-skeed-color-neutral-900';

const CLOSE_BUTTON_CLASSES =
  'flex items-center justify-center ' +
  'w-skeed-spacing-4 h-skeed-spacing-4 rounded-skeed-radius-1 ' +
  'text-skeed-color-neutral-500 hover:text-skeed-color-neutral-900 ' +
  'hover:bg-skeed-color-neutral-100 ' +
  'transition-colors duration-skeed-motion-duration-fast ease-skeed-motion-easing-default ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500 ' +
  'flex-shrink-0';

const BODY_CLASSES =
  'flex-1 overflow-y-auto px-skeed-spacing-6 py-skeed-spacing-4';

export const Drawer = forwardRef<HTMLDivElement, DrawerProps>(function Drawer(
  {
    open,
    onClose,
    title,
    side = 'right',
    size = 'md',
    children,
    className,
    ...rest
  },
  forwardedRef,
) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const internalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  // Store focus before opening, restore focus on close
  useEffect(() => {
    if (open) {
      previousActiveElement.current = document.activeElement;
      // Focus the close button when drawer opens
      setTimeout(() => closeButtonRef.current?.focus(), 0);
    }
    return () => {
      if (!open && previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    };
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Prevent body scroll when open — Note: focus trapping should be
  // implemented with a dedicated focus-trap library in consuming apps.
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const isHorizontal = side === 'left' || side === 'right';
  const sizeClass = isHorizontal
    ? HORIZONTAL_SIZE_CLASSES[size]
    : BOTTOM_SIZE_CLASSES[size];

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          BACKDROP_CLASSES,
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Panel */}
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
        aria-modal="true"
        aria-label={title ?? 'Drawer'}
        className={cn(
          PANEL_BASE_CLASSES,
          SIDE_POSITION_CLASSES[side],
          sizeClass,
          open ? SIDE_OPEN_TRANSLATE[side] : SIDE_CLOSED_TRANSLATE[side],
          className,
        )}
        {...rest}
      >
        <div className={HEADER_CLASSES}>
          {title && <h2 className={TITLE_CLASSES}>{title}</h2>}
          <button
            ref={closeButtonRef}
            type="button"
            className={CLOSE_BUTTON_CLASSES}
            aria-label="Close"
            onClick={onClose}
          >
            {/* Close icon — consuming app provides SVG or icon component */}
            <svg
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
              className="w-full h-full"
            >
              <path
                d="M4 4l8 8M12 4l-8 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className={BODY_CLASSES}>{children}</div>
      </div>
    </>
  );
});
