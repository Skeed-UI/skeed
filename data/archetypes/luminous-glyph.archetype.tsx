import { Star } from '@skeed/asset-icon';
import { cn } from '@skeed/core/cn';
import { type CSSProperties, type HTMLAttributes, forwardRef } from 'react';

type LuminousShape = 'diamond' | 'star' | 'light-bulb';
type LuminousTone = 'brand' | 'warm' | 'success' | 'danger';

export interface LuminousGlyphProps extends HTMLAttributes<HTMLSpanElement> {
  shape?: LuminousShape;
  tone?: LuminousTone;
  intensity?: 'soft' | 'medium' | 'strong';
  animated?: boolean;
  label?: string;
}

const toneClasses: Record<LuminousTone, string> = {
  brand: 'bg-skeed-color-brand-500 text-skeed-color-brand-500',
  warm: 'bg-skeed-color-warning-500 text-skeed-color-warning-500',
  success: 'bg-skeed-color-success-500 text-skeed-color-success-500',
  danger: 'bg-skeed-color-danger-500 text-skeed-color-danger-500',
};

const glowScale: Record<NonNullable<LuminousGlyphProps['intensity']>, string> = {
  soft: '0.35',
  medium: '0.6',
  strong: '0.9',
};

export const LuminousGlyph = forwardRef<HTMLSpanElement, LuminousGlyphProps>(
  function LuminousGlyph(
    {
      shape = 'diamond',
      tone = 'brand',
      intensity = 'medium',
      animated = true,
      label,
      className,
      style,
      ...rest
    },
    ref,
  ) {
    const customStyle = {
      '--skeed-glyph-glow': glowScale[intensity],
      boxShadow: '0 0 calc(var(--skeed-spacing-8) * var(--skeed-glyph-glow)) currentColor',
      ...style,
    } as CSSProperties;

    return (
      <span
        ref={ref}
        role={label ? 'img' : undefined}
        aria-label={label}
        aria-hidden={label ? undefined : true}
        style={customStyle}
        className={cn(
          'relative inline-flex h-skeed-spacing-8 w-skeed-spacing-8 items-center justify-center rounded-skeed-radius-9999',
          'before:absolute before:inset-0 before:rounded-skeed-radius-9999 before:bg-current before:opacity-40 before:blur-xl',
          'after:absolute after:inset-0 after:m-skeed-spacing-2 after:rounded-skeed-radius-9999 after:bg-skeed-color-neutral-50 after:opacity-30',
          animated && 'motion-safe:animate-pulse',
          toneClasses[tone],
          className,
        )}
        {...rest}
      >
        <span
          aria-hidden="true"
          className={cn(
            'relative z-10 inline-flex h-skeed-spacing-5 w-skeed-spacing-5 items-center justify-center shadow-skeed-shadow-1',
            shape === 'diamond' && 'rotate-45 rounded-skeed-radius-1 bg-current',
            shape === 'star' && 'text-current',
            shape === 'light-bulb' &&
              'w-skeed-spacing-4 rounded-skeed-radius-9999 bg-current',
          )}
        >
          {shape === 'star' && <Star size={20} />}
          {shape === 'light-bulb' && (
            <span className="absolute bottom-0 h-skeed-spacing-2 w-skeed-spacing-3 translate-y-1/2 rounded-skeed-radius-1 bg-skeed-color-neutral-900" />
          )}
        </span>
      </span>
    );
  },
);
