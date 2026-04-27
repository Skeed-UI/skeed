import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@skeed/core/cn';
import { X } from '@skeed/asset-icon';

export interface ToastProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error';
  onClose?: () => void;
  /** Auto-dismiss duration in milliseconds. Set to 0 to disable. */
  duration?: number;
  /** Pause auto-dismiss on hover */
  pauseOnHover?: boolean;
}

const variantClasses: Record<NonNullable<ToastProps['variant']>, string> = {
  info: 'bg-skeed-color-neutral-800 text-white',
  success: 'bg-skeed-color-success-500 text-white',
  warning: 'bg-skeed-color-warning-500 text-skeed-color-neutral-900',
  error: 'bg-skeed-color-danger-500 text-white',
};

export const Toast = forwardRef<HTMLDivElement, ToastProps>(function Toast(
  { className, variant = 'info', onClose, duration = 5000, pauseOnHover = true, children, ...rest },
  ref,
) {
  const [isPaused, setIsPaused] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    // Wait for exit animation before calling onClose
    setTimeout(() => onClose?.(), 200);
  }, [onClose]);

  // Auto-dismiss timer
  useEffect(() => {
    if (duration === 0 || isPaused) return;

    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, isPaused, handleClose]);

  return (
    <div
      ref={ref}
      role="alert"
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
      className={cn(
        'flex items-center gap-skeed-spacing-3',
        'px-skeed-spacing-4 py-skeed-spacing-3',
        'rounded-skeed-radius-2 shadow-skeed-shadow-2',
        'text-sm font-skeed-body',
        'animate-in slide-in-from-right-full duration-skeed-motion-duration-normal',
        isExiting && 'animate-out slide-out-to-right-full duration-skeed-motion-duration-fast',
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
          <X size={14} />
        </button>
      )}
    </div>
  );
});
