import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@skeed/core/cn';

export interface DropdownProps extends HTMLAttributes<HTMLDivElement> {
  open?: boolean;
}

export const Dropdown = forwardRef<HTMLDivElement, DropdownProps>(function Dropdown(
  { className, open = false, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn('relative inline-block', className)}
      {...rest}
    >
      {children}
      {open && (
        <div
          className={cn(
            'absolute z-50 mt-skeed-spacing-1',
            'min-w-skeed-spacing-32',
            'bg-skeed-color-neutral-50 border border-skeed-color-neutral-200',
            'rounded-skeed-radius-2 shadow-skeed-shadow-2',
            'py-skeed-spacing-1',
          )}
        >
          <div role="listbox" className="flex flex-col">
            {/* Dropdown items should be passed as children */}
          </div>
        </div>
      )}
    </div>
  );
});
