import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@skeed/core/cn';

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'active' | 'disabled';
  size?: 'sm' | 'md';
}

const variantClasses: Record<NonNullable<ChipProps['variant']>, string> = {
  default: 'bg-skeed-color-neutral-100 text-skeed-color-neutral-700 hover:bg-skeed-color-neutral-200 border-skeed-color-neutral-300',
  active: 'bg-skeed-color-brand-100 text-skeed-color-brand-700 border-skeed-color-brand-300',
  disabled: 'bg-skeed-color-neutral-50 text-skeed-color-neutral-400 border-skeed-color-neutral-200 cursor-not-allowed',
};

const sizeClasses: Record<NonNullable<ChipProps['size']>, string> = {
  sm: 'px-skeed-spacing-2 py-skeed-spacing-0 text-xs',
  md: 'px-skeed-spacing-3 py-skeed-spacing-1 text-sm',
};

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  { className, variant = 'default', size = 'md', disabled, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled || variant === 'disabled'}
      className={cn(
        'inline-flex items-center justify-center',
        'rounded-skeed-radius-9999 border',
        'font-medium font-skeed-body',
        'transition-colors duration-skeed-motion-duration-fast ease-skeed-motion-easing-default',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500',
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});
