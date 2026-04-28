import { cn } from '@skeed/core/cn';
import { type HTMLAttributes, forwardRef } from 'react';

export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  selected?: boolean;
}

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(function TableRow(
  { className, selected, children, ...rest },
  ref: React.ForwardedRef<HTMLTableRowElement>,
) {
  return (
    <tr
      ref={ref}
      className={cn(
        'border-b border-skeed-color-neutral-200',
        'hover:bg-skeed-color-neutral-50',
        selected && 'bg-skeed-color-brand-50 hover:bg-skeed-color-brand-50',
        className,
      )}
      {...rest}
    >
      {children}
    </tr>
  );
});
