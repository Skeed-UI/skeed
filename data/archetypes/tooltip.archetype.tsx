import { cn } from '@skeed/core/cn';
import { type HTMLAttributes, forwardRef } from 'react';

export interface TooltipProps extends HTMLAttributes<HTMLDivElement> {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  /** Show tooltip on focus (keyboard accessibility) */
  showOnFocus?: boolean;
}

const positionClasses: Record<NonNullable<TooltipProps['position']>, string> = {
  top: 'bottom-full mb-skeed-spacing-1',
  bottom: 'top-full mt-skeed-spacing-1',
  left: 'right-full mr-skeed-spacing-1',
  right: 'left-full ml-skeed-spacing-1',
};

const arrowPositionClasses: Record<NonNullable<TooltipProps['position']>, string> = {
  top: 'left-1/2 -translate-x-1/2 top-full border-t-skeed-color-neutral-800',
  bottom: 'left-1/2 -translate-x-1/2 bottom-full border-b-skeed-color-neutral-800 rotate-180',
  left: 'top-1/2 -translate-y-1/2 left-full border-l-skeed-color-neutral-800 -rotate-90',
  right: 'top-1/2 -translate-y-1/2 right-full border-r-skeed-color-neutral-800 rotate-90',
};

export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(function Tooltip(
  { className, content, position = 'top', delay = 150, showOnFocus = true, children, ...rest },
  ref,
) {
  const triggerClasses = showOnFocus ? 'group group-focus-within:has-[role="tooltip"]' : '';

  return (
    <div ref={ref} className={cn('relative inline-block group', triggerClasses)} {...rest}>
      {children}
      <div
        role="tooltip"
        className={cn(
          'absolute z-50 px-skeed-spacing-2 py-skeed-spacing-1',
          'bg-skeed-color-neutral-800 text-white',
          'text-xs font-skeed-body rounded-skeed-radius-1',
          'opacity-0 invisible',
          'transition-all duration-skeed-motion-duration-fast',
          // Show on hover and focus (if enabled)
          'group-hover:opacity-100 group-hover:visible group-hover:delay-150',
          showOnFocus && 'group-focus-within:opacity-100 group-focus-within:visible',
          positionClasses[position],
          className,
        )}
      >
        {content}
        {/* Arrow indicator */}
        <span
          className={cn(
            'absolute w-0 h-0',
            'border-4 border-transparent',
            arrowPositionClasses[position],
          )}
          aria-hidden="true"
        />
      </div>
    </div>
  );
});
