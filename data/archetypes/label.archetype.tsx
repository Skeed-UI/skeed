import { cn } from '@skeed/core/cn';
import { type LabelHTMLAttributes, forwardRef } from 'react';

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(function Label(
  { className, required, children, ...rest },
  ref,
) {
  return (
    <label
      ref={ref}
      className={cn(
        'text-sm font-medium font-skeed-body text-skeed-color-neutral-900',
        'block mb-skeed-spacing-1',
        required &&
          'after:content-["\u002a"] after:ml-skeed-spacing-0 after:text-skeed-color-danger-500',
        className,
      )}
      {...rest}
    >
      {children}
    </label>
  );
});
