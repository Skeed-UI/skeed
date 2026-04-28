import { cn } from '@skeed/core/cn';
import { type AnchorHTMLAttributes, forwardRef } from 'react';

export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: 'default' | 'muted' | 'primary';
}

const variantClasses: Record<NonNullable<LinkProps['variant']>, string> = {
  default: 'text-skeed-color-brand-600 hover:text-skeed-color-brand-700',
  muted: 'text-skeed-color-neutral-600 hover:text-skeed-color-neutral-700',
  primary: 'text-skeed-color-brand-500 hover:text-skeed-color-brand-600 font-medium',
};

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { className, variant = 'default', ...rest },
  ref,
) {
  return (
    <a
      ref={ref}
      className={cn(
        'inline-flex items-center',
        'underline underline-offset-2',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500 focus-visible:ring-offset-2',
        'transition-colors duration-skeed-motion-duration-fast ease-skeed-motion-easing-default',
        variantClasses[variant],
        className,
      )}
      {...rest}
    />
  );
});
