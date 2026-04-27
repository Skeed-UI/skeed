import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@skeed/core/cn';

export interface KbdProps extends HTMLAttributes<HTMLElement> {}

export const Kbd = forwardRef<HTMLElement, KbdProps>(function Kbd(
  { className, children, ...rest },
  ref,
) {
  return (
    <kbd
      ref={ref as any}
      className={cn(
        'inline-flex items-center justify-center',
        'px-skeed-spacing-2 py-skeed-spacing-0',
        'rounded-skeed-radius-1',
        'bg-skeed-color-neutral-100 border border-skeed-color-neutral-300',
        'text-xs font-skeed-mono font-medium text-skeed-color-neutral-700',
        'shadow-skeed-shadow-1',
        className,
      )}
      {...rest}
    >
      {children}
    </kbd>
  );
});
