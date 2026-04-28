import { cn } from '@skeed/core/cn';
import { type ButtonHTMLAttributes, forwardRef } from 'react';

export interface CalendarDayProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  day: number;
  isToday?: boolean;
  isSelected?: boolean;
  isCurrentMonth?: boolean;
  hasEvents?: boolean;
}

export const CalendarDay = forwardRef<HTMLButtonElement, CalendarDayProps>(function CalendarDay(
  { className, day, isToday, isSelected, isCurrentMonth = true, hasEvents, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        'relative h-skeed-spacing-9 w-full',
        'flex items-center justify-center',
        'text-sm font-skeed-body',
        'rounded-skeed-radius-1',
        'hover:bg-skeed-color-neutral-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500',
        !isCurrentMonth && 'text-skeed-color-neutral-400',
        isCurrentMonth && !isSelected && 'text-skeed-color-neutral-700',
        isToday && !isSelected && 'font-semibold text-skeed-color-brand-600',
        isSelected && 'bg-skeed-color-brand-500 text-white hover:bg-skeed-color-brand-600',
        className,
      )}
      {...rest}
    >
      <span>{day}</span>
      {hasEvents && (
        <span
          className={cn(
            'absolute bottom-skeed-spacing-1',
            'h-skeed-spacing-1 w-skeed-spacing-1',
            'rounded-skeed-radius-9999',
            isSelected ? 'bg-white' : 'bg-skeed-color-brand-500',
          )}
        />
      )}
    </button>
  );
});
