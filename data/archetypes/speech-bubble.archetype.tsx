import { cn } from '@skeed/core/cn';
import { type HTMLAttributes, type ReactNode, forwardRef } from 'react';

type BubbleTone = 'neutral' | 'brand' | 'success' | 'warning' | 'cloud';
type BubbleTail = 'left' | 'right' | 'top' | 'none';

export interface SpeechBubbleProps extends HTMLAttributes<HTMLDivElement> {
  speaker?: string;
  meta?: string;
  avatar?: ReactNode;
  tone?: BubbleTone;
  tail?: BubbleTail;
}

const toneClasses: Record<BubbleTone, string> = {
  neutral: 'bg-skeed-color-neutral-50 text-skeed-color-neutral-900 border-skeed-color-neutral-200',
  brand: 'bg-skeed-color-brand-50 text-skeed-color-neutral-900 border-skeed-color-brand-200',
  success:
    'bg-skeed-color-success-50 text-skeed-color-neutral-900 border-skeed-color-success-200',
  warning:
    'bg-skeed-color-warning-50 text-skeed-color-neutral-900 border-skeed-color-warning-200',
  cloud: 'bg-skeed-color-neutral-50 text-skeed-color-neutral-900 border-skeed-color-neutral-100',
};

const tailClasses: Record<BubbleTail, string> = {
  left: 'after:left-skeed-spacing-5 after:top-full after:-translate-y-skeed-spacing-1',
  right: 'after:right-skeed-spacing-5 after:top-full after:-translate-y-skeed-spacing-1',
  top: 'after:left-skeed-spacing-5 after:bottom-full after:translate-y-skeed-spacing-1',
  none: 'after:hidden',
};

export const SpeechBubble = forwardRef<HTMLDivElement, SpeechBubbleProps>(function SpeechBubble(
  {
    speaker,
    meta,
    avatar,
    tone = 'neutral',
    tail = 'left',
    className,
    children,
    ...rest
  },
  ref,
) {
  return (
    <div ref={ref} className={cn('flex items-start gap-skeed-spacing-3', className)} {...rest}>
      {avatar && (
        <div className="mt-skeed-spacing-1 inline-flex h-skeed-spacing-8 w-skeed-spacing-8 shrink-0 items-center justify-center rounded-skeed-radius-9999 bg-skeed-color-neutral-100">
          {avatar}
        </div>
      )}
      <div
        className={cn(
          'relative min-w-0 rounded-skeed-radius-4 border px-skeed-spacing-4 py-skeed-spacing-3 shadow-skeed-shadow-1',
          'after:absolute after:h-skeed-spacing-3 after:w-skeed-spacing-3 after:rotate-45 after:border-b after:border-r after:bg-inherit after:border-inherit',
          'transition-all duration-skeed-motion-duration-fast ease-skeed-motion-easing-default',
          tone === 'cloud' && 'rounded-skeed-radius-7',
          toneClasses[tone],
          tailClasses[tail],
        )}
      >
        {(speaker || meta) && (
          <div className="mb-skeed-spacing-2 flex items-center justify-between gap-skeed-spacing-3">
            {speaker && (
              <p className="truncate font-skeed-body text-sm font-semibold text-skeed-color-neutral-900">
                {speaker}
              </p>
            )}
            {meta && (
              <p className="shrink-0 font-skeed-body text-xs text-skeed-color-neutral-500">{meta}</p>
            )}
          </div>
        )}
        <div className="font-skeed-body text-sm text-skeed-color-neutral-700">{children}</div>
      </div>
    </div>
  );
});
