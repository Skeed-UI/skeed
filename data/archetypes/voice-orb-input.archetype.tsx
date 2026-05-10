import { cn } from '@skeed/core/cn';
import { type HTMLAttributes, forwardRef } from 'react';

type VoiceState = 'idle' | 'listening' | 'thinking' | 'error';

export interface VoiceOrbInputProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSubmit'> {
  value?: string;
  placeholder?: string;
  state?: VoiceState;
  disabled?: boolean;
  onValueChange?: (value: string) => void;
  onOrbClick?: () => void;
  onSubmit?: () => void;
}

const stateClasses: Record<VoiceState, string> = {
  idle: 'bg-skeed-color-brand-500',
  listening: 'bg-skeed-color-success-500 animate-pulse',
  thinking: 'bg-skeed-color-brand-600 animate-pulse',
  error: 'bg-skeed-color-danger-500',
};

const stateLabels: Record<VoiceState, string> = {
  idle: 'Start voice input',
  listening: 'Listening',
  thinking: 'Processing voice input',
  error: 'Voice input error',
};

export const VoiceOrbInput = forwardRef<HTMLDivElement, VoiceOrbInputProps>(
  function VoiceOrbInput(
    {
      value,
      placeholder = 'Ask or speak...',
      state = 'idle',
      disabled = false,
      onValueChange,
      onOrbClick,
      onSubmit,
      className,
      ...rest
    },
    ref,
  ) {
    return (
      <div
        ref={ref}
        className={cn(
          'group flex w-full items-center gap-skeed-spacing-3 rounded-skeed-radius-9999 border border-skeed-color-neutral-200 bg-skeed-color-neutral-50',
          'px-skeed-spacing-3 py-skeed-spacing-2 shadow-skeed-shadow-1',
          'transition-all duration-skeed-motion-duration-fast ease-skeed-motion-easing-default',
          'focus-within:border-skeed-color-brand-500 focus-within:shadow-skeed-shadow-2',
          disabled && 'opacity-50',
          className,
        )}
        {...rest}
      >
        <button
          type="button"
          aria-label={stateLabels[state]}
          aria-pressed={state === 'listening'}
          disabled={disabled}
          onClick={onOrbClick}
          className={cn(
            'relative inline-flex h-skeed-spacing-10 w-skeed-spacing-10 shrink-0 items-center justify-center rounded-skeed-radius-9999',
            'text-skeed-color-neutral-50 shadow-skeed-shadow-2',
            'transition-transform duration-skeed-motion-duration-fast ease-skeed-motion-easing-default',
            'hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500 focus-visible:ring-offset-2',
            stateClasses[state],
          )}
        >
          <span
            aria-hidden="true"
            className="absolute inset-0 m-skeed-spacing-1 rounded-skeed-radius-9999 border border-skeed-color-neutral-50 opacity-40"
          />
          <span
            aria-hidden="true"
            className="h-skeed-spacing-4 w-skeed-spacing-2 rounded-skeed-radius-9999 bg-skeed-color-neutral-50"
          />
        </button>
        <input
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(event) => onValueChange?.(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') onSubmit?.();
          }}
          className="min-w-0 flex-1 bg-transparent font-skeed-body text-sm text-skeed-color-neutral-900 placeholder:text-skeed-color-neutral-500 focus:outline-none"
        />
        <div className="flex items-end gap-skeed-spacing-1" aria-hidden="true">
          <span className="h-skeed-spacing-2 w-skeed-spacing-1 rounded-skeed-radius-9999 bg-skeed-color-brand-300 group-focus-within:h-skeed-spacing-4" />
          <span className="h-skeed-spacing-4 w-skeed-spacing-1 rounded-skeed-radius-9999 bg-skeed-color-brand-500 group-focus-within:h-skeed-spacing-6" />
          <span className="h-skeed-spacing-3 w-skeed-spacing-1 rounded-skeed-radius-9999 bg-skeed-color-brand-300 group-focus-within:h-skeed-spacing-5" />
        </div>
      </div>
    );
  },
);
