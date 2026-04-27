import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@skeed/core/cn';

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  initials?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  shape?: 'circle' | 'square';
  status?: 'online' | 'offline' | 'busy' | 'away';
}

const sizeClasses: Record<NonNullable<AvatarProps['size']>, string> = {
  xs: 'h-skeed-spacing-6 w-skeed-spacing-6 text-xs',
  sm: 'h-skeed-spacing-8 w-skeed-spacing-8 text-sm',
  md: 'h-skeed-spacing-10 w-skeed-spacing-10 text-base',
  lg: 'h-skeed-spacing-14 w-skeed-spacing-14 text-lg',
  xl: 'h-skeed-spacing-18 w-skeed-spacing-18 text-xl',
};

const statusDotSizeClasses: Record<NonNullable<AvatarProps['size']>, string> = {
  xs: 'h-skeed-spacing-2 w-skeed-spacing-2',
  sm: 'h-skeed-spacing-2 w-skeed-spacing-2',
  md: 'h-skeed-spacing-3 w-skeed-spacing-3',
  lg: 'h-skeed-spacing-3 w-skeed-spacing-3',
  xl: 'h-skeed-spacing-4 w-skeed-spacing-4',
};

const statusColorClasses: Record<NonNullable<AvatarProps['status']>, string> = {
  online: 'bg-skeed-color-success-500',
  offline: 'bg-skeed-color-neutral-400',
  busy: 'bg-skeed-color-danger-500',
  away: 'bg-skeed-color-warning-500',
};

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(function Avatar(
  {
    className,
    src,
    alt = '',
    initials,
    size = 'md',
    shape = 'circle',
    status,
    ...rest
  },
  ref,
) {
  const shapeClass = shape === 'circle' ? 'rounded-skeed-radius-9999' : 'rounded-skeed-radius-2';

  return (
    <div
      ref={ref}
      role="img"
      aria-label={!src && initials ? initials : alt}
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden',
        'bg-skeed-color-brand-100 text-skeed-color-brand-700 font-skeed-body font-medium',
        sizeClasses[size],
        shapeClass,
        className,
      )}
      {...rest}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
        />
      ) : (
        <span aria-hidden="true" className="select-none uppercase leading-none">
          {initials ? initials.slice(0, 2) : '?'}
        </span>
      )}

      {status && (
        <span
          aria-label={status}
          className={cn(
            'absolute bottom-0 right-0 block rounded-skeed-radius-9999 ring-2 ring-skeed-color-neutral-50',
            statusColorClasses[status],
            statusDotSizeClasses[size],
          )}
        />
      )}
    </div>
  );
});
