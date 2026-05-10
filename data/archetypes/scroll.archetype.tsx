import { cn } from '@skeed/core/cn';
import { type HTMLAttributes, type ReactNode, forwardRef } from 'react';

type ScrollTone = 'parchment' | 'ceremony' | 'clean' | 'night';

export interface ScrollProps extends HTMLAttributes<HTMLElement> {
  eyebrow?: string;
  title?: string;
  footer?: ReactNode;
  tone?: ScrollTone;
  reveal?: boolean;
}

const toneClasses: Record<ScrollTone, string> = {
  parchment:
    'bg-skeed-color-warning-50 text-skeed-color-neutral-900 border-skeed-color-warning-200',
  ceremony:
    'bg-skeed-color-brand-50 text-skeed-color-neutral-900 border-skeed-color-brand-200',
  clean: 'bg-skeed-color-neutral-50 text-skeed-color-neutral-900 border-skeed-color-neutral-200',
  night: 'bg-skeed-color-neutral-900 text-skeed-color-neutral-50 border-skeed-color-brand-500',
};

export const Scroll = forwardRef<HTMLElement, ScrollProps>(function Scroll(
  { eyebrow, title, footer, tone = 'parchment', reveal = true, className, children, ...rest },
  ref,
) {
  return (
    <article
      ref={ref}
      className={cn(
        'relative overflow-hidden border shadow-skeed-shadow-1',
        'rounded-skeed-radius-1 px-skeed-spacing-6 py-skeed-spacing-5',
        'font-skeed-body transition-all duration-skeed-motion-duration-normal ease-skeed-motion-easing-default',
        reveal && 'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2',
        toneClasses[tone],
        className,
      )}
      {...rest}
    >
      <span
        aria-hidden="true"
        className="absolute left-skeed-spacing-4 right-skeed-spacing-4 top-0 h-skeed-spacing-2 rounded-skeed-radius-9999 bg-skeed-color-neutral-50 opacity-60 shadow-skeed-shadow-1"
      />
      <span
        aria-hidden="true"
        className="absolute bottom-0 left-skeed-spacing-4 right-skeed-spacing-4 h-skeed-spacing-2 rounded-skeed-radius-9999 bg-skeed-color-neutral-50 opacity-60 shadow-skeed-shadow-1"
      />
      <div className="relative z-10 flex flex-col gap-skeed-spacing-3">
        {(eyebrow || title) && (
          <header className="flex flex-col gap-skeed-spacing-1 border-b border-current border-opacity-10 pb-skeed-spacing-3">
            {eyebrow && (
              <p className="font-skeed-body text-xs font-semibold uppercase tracking-wide opacity-70">
                {eyebrow}
              </p>
            )}
            {title && <h3 className="font-skeed-display text-lg font-semibold">{title}</h3>}
          </header>
        )}
        <div className="text-sm leading-skeed-density-cozy-lh opacity-90">{children}</div>
        {footer && (
          <footer className="border-t border-current border-opacity-10 pt-skeed-spacing-3 text-sm opacity-80">
            {footer}
          </footer>
        )}
      </div>
    </article>
  );
});
