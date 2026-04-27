import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@skeed/core/cn';

export interface PopoverProps extends HTMLAttributes<HTMLDivElement> {
  open?: boolean;
}

export const Popover = forwardRef<HTMLDivElement, PopoverProps>(function Popover(
  { className, open = false, children, ...rest },
  ref,
) {
  if (!open) return null;

  return (
    <div
      ref={ref}
      role="dialog"
      className={cn(
        'absolute z-50',
        'bg-skeed-color-neutral-50 border border-skeed-color-neutral-200',
        'rounded-skeed-radius-2 shadow-skeed-shadow-2',
        'p-skeed-spacing-4',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
});
