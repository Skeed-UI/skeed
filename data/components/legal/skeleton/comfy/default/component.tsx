import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@skeed/core/cn';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string;
  height?: string;
  lines?: number;
  animated?: boolean;
}

const variantClasses: Record<NonNullable<SkeletonProps['variant']>, string> = {
  text: 'rounded-skeed-radius-1',
  circular: 'rounded-skeed-radius-9999',
  rectangular: 'rounded-skeed-radius-0',
  rounded: 'rounded-skeed-radius-2',
};

/** Default heights per variant when none provided (using spacing tokens) */
const defaultHeights: Record<NonNullable<SkeletonProps['variant']>, string> = {
  text: 'var(--skeed-spacing-4)',
  circular: 'var(--skeed-spacing-6)',
  rectangular: 'var(--skeed-spacing-9)',
  rounded: 'var(--skeed-spacing-9)',
};

/** Width fractions for multi-line text skeleton lines (using style prop) */
const lineWidths = ['100%', '85%', '70%'];

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  function Skeleton(
    {
      className,
      variant = 'text',
      width,
      height,
      lines = 1,
      animated = true,
      style,
      ...rest
    },
    ref,
  ) {
    const baseClass = cn(
      'bg-skeed-color-neutral-200',
      animated && 'animate-pulse',
      variantClasses[variant],
    );

    // Text variant with multiple lines
    if (variant === 'text' && lines > 1) {
      return (
        <div
          ref={ref}
          className={cn('flex flex-col gap-skeed-spacing-2', className)}
          role="presentation"
          aria-hidden="true"
          style={width ? { width, ...style } : style}
          {...rest}
        >
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className={baseClass}
              style={{
                height: height ?? defaultHeights.text,
                width: i === lines - 1 && lines > 1 ? lineWidths[2] : i % 2 === 1 ? lineWidths[1] : lineWidths[0],
              }}
            />
          ))}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(baseClass, className)}
        role="presentation"
        aria-hidden="true"
        style={{
          width: width,
          height: height ?? defaultHeights[variant],
          ...style,
        }}
        {...rest}
      />
    );
  },
);
