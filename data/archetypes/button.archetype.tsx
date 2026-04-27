import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@skeed/core/cn';
import { Spinner } from '@skeed/asset-icon';

type Intent = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  intent?: Intent;
  size?: Size;
  loading?: boolean;
}

const INTENT_CLASSES: Record<Intent, string> = {
  primary:
    'bg-skeed-color-brand-500 text-skeed-color-neutral-50 hover:bg-skeed-color-brand-600',
  secondary:
    'bg-skeed-color-neutral-100 text-skeed-color-neutral-900 hover:bg-skeed-color-neutral-200',
  ghost:
    'bg-transparent text-skeed-color-neutral-900 hover:bg-skeed-color-neutral-100',
  danger:
    'bg-skeed-color-danger-500 text-skeed-color-neutral-50 hover:bg-skeed-color-danger-600',
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'px-skeed-spacing-2 py-skeed-spacing-1 rounded-skeed-radius-2 text-sm',
  md: 'px-skeed-density-cozy-padx py-skeed-density-cozy-pady rounded-skeed-radius-2',
  lg: 'px-skeed-spacing-4 py-skeed-spacing-3 rounded-skeed-radius-7 text-lg',
};

const BASE_CLASSES =
  'inline-flex items-center justify-center font-skeed-body font-semibold ' +
  'transition-colors duration-skeed-motion-duration-fast ease-skeed-motion-easing-default ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500 ' +
  'disabled:pointer-events-none disabled:opacity-50';

const LOADING_SIZE: Record<Size, 12 | 16 | 20> = {
  sm: 12,
  md: 16,
  lg: 20,
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { intent = 'primary', size = 'md', loading = false, className, type, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type ?? 'button'}
      disabled={disabled || loading}
      aria-busy={loading}
      className={cn(
        BASE_CLASSES,
        INTENT_CLASSES[intent],
        SIZE_CLASSES[size],
        loading && 'opacity-70 cursor-not-allowed',
        className,
      )}
      {...rest}
    >
      {loading ? (
        <>
          <Spinner size={LOADING_SIZE[size]} className="mr-2" />
          {children}
        </>
      ) : (
        children
      )}
    </button>
  );
});
