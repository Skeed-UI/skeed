import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@skeed/core/cn';

export interface TooltipProps extends HTMLAttributes<HTMLDivElement> {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(function Tooltip(
  { className, content, position = 'top', children, ...rest },
  ref,
) {
  return (
    <div ref={ref} className="relative inline-block group" {...rest}>
      {children}
      <div
        role="tooltip"
        className={cn(
          'absolute z-50 px-skeed-spacing-2 py-skeed-spacing-1',
          'bg-skeed-color-neutral-800 text-white',
          'text-xs font-skeed-body rounded-skeed-radius-1',
          'opacity-0 invisible group-hover:opacity-100 group-hover:visible',
          'transition-opacity duration-skeed-motion-duration-fast',
          position === 'top' && 'bottom-full mb-skeed-spacing-1',
          position === 'bottom' && 'top-full mt-skeed-spacing-1',
          position === 'left' && 'right-full mr-skeed-spacing-1',
          position === 'right' && 'left-full ml-skeed-spacing-1',
          className,
        )}
      >
        {content}
      </div>
    </div>
  );
});
