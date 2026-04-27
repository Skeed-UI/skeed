import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@skeed/core/cn';

type Align = 'left' | 'center' | 'right';

export interface HeroProps extends HTMLAttributes<HTMLElement> {
  headline: string;
  subtext?: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
  align?: Align;
}

const ALIGN_CLASSES: Record<Align, string> = {
  left: 'items-start text-left',
  center: 'items-center text-center',
  right: 'items-end text-right',
};

const BASE_CLASSES =
  'relative w-full bg-skeed-color-neutral-50 ' +
  'py-skeed-spacing-10 px-skeed-spacing-6 overflow-hidden';

const CONTENT_CLASSES =
  'relative z-10 flex flex-col gap-skeed-density-cozy-gap mx-auto max-w-screen-lg';

const HEADLINE_CLASSES =
  'font-skeed-display font-bold text-skeed-color-neutral-900 ' +
  'transition-colors duration-skeed-motion-duration-normal ease-skeed-motion-easing-default';

const SUBTEXT_CLASSES =
  'font-skeed-body text-skeed-color-neutral-600 ' +
  'max-w-prose transition-opacity duration-skeed-motion-duration-normal ease-skeed-motion-easing-default';

const CTA_CLASSES =
  'inline-flex items-center justify-center ' +
  'bg-skeed-color-brand-500 text-skeed-color-neutral-50 ' +
  'font-skeed-body font-semibold ' +
  'px-skeed-spacing-6 py-skeed-spacing-3 rounded-skeed-radius-2 ' +
  'hover:bg-skeed-color-brand-600 ' +
  'transition-colors duration-skeed-motion-duration-fast ease-skeed-motion-easing-default ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500 ' +
  'disabled:pointer-events-none disabled:opacity-50 ' +
  'shadow-skeed-shadow-1';

const ILLUSTRATION_CLASSES =
  'mt-skeed-spacing-8 w-full rounded-skeed-radius-3 ' +
  'bg-skeed-color-neutral-100 ' +
  'min-h-skeed-spacing-10';

export const Hero = forwardRef<HTMLElement, HeroProps>(function Hero(
  {
    headline,
    subtext,
    ctaLabel,
    onCtaClick,
    align = 'center',
    className,
    ...rest
  },
  ref,
) {
  return (
    <section ref={ref} className={cn(BASE_CLASSES, className)} {...rest}>
      <div className={cn(CONTENT_CLASSES, ALIGN_CLASSES[align])}>
        <h1 className={HEADLINE_CLASSES}>{headline}</h1>

        {subtext && (
          <p className={SUBTEXT_CLASSES}>{subtext}</p>
        )}

        {ctaLabel && (
          <button type="button" className={CTA_CLASSES} onClick={onCtaClick}>
            {ctaLabel}
          </button>
        )}

        {/* Asset slot: hero_illustration */}
        <div
          className={ILLUSTRATION_CLASSES}
          role="img"
          aria-label="Hero illustration"
        />
      </div>
    </section>
  );
});
