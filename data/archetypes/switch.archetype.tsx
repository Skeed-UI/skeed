import { cn } from '@skeed/core/cn';
import { type HTMLAttributes, type ReactNode, useId } from 'react';

export interface SwitchProps
  extends Omit<HTMLAttributes<HTMLButtonElement>, 'onChange' | 'onClick'> {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'calm' | 'glow' | 'split' | 'signal';
  thumbIcon?: ReactNode;
}

const TRACK_SIZE_CLASSES = {
  sm: 'h-5 w-9',
  md: 'h-6 w-11',
  lg: 'h-8 w-14',
};

const THUMB_SIZE_CLASSES = {
  sm: 'h-3 w-3',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

const THUMB_TRANSLATE_CLASSES = {
  sm: 'translate-x-4',
  md: 'translate-x-5',
  lg: 'translate-x-6',
};

const VARIANT_CLASSES = {
  calm: {
    trackOn: 'bg-skeed-color-brand-500',
    trackOff: 'bg-skeed-color-neutral-300',
    thumb: 'bg-skeed-color-neutral-50 shadow-skeed-shadow-1',
  },
  glow: {
    trackOn: 'bg-skeed-color-brand-500 shadow-skeed-shadow-2',
    trackOff: 'bg-skeed-color-neutral-200',
    thumb: 'bg-skeed-color-neutral-50 shadow-skeed-shadow-2',
  },
  split: {
    trackOn: 'bg-skeed-color-success-500',
    trackOff: 'bg-skeed-color-danger-500',
    thumb: 'bg-skeed-color-neutral-50 shadow-skeed-shadow-1',
  },
  signal: {
    trackOn: 'bg-skeed-color-brand-600',
    trackOff: 'bg-skeed-color-neutral-900',
    thumb: 'bg-skeed-color-warning-500 shadow-skeed-shadow-2',
  },
};

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
  variant = 'calm',
  thumbIcon,
  className,
  id: idProp,
  ...rest
}: SwitchProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const labelId = `${id}-label`;
  const descriptionId = `${id}-description`;

  const ariaDescribedBy = description ? descriptionId : undefined;
  const ariaLabelledBy = label ? labelId : undefined;
  const tone = VARIANT_CLASSES[variant];

  return (
    <div className={cn('flex items-start gap-skeed-spacing-3', className)}>
      <button
        id={id}
        role="switch"
        type="button"
        aria-checked={checked}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'group relative inline-flex shrink-0 cursor-pointer items-center rounded-skeed-radius-9999 border-2 border-transparent overflow-hidden',
          'transition-all duration-skeed-motion-duration-fast ease-skeed-motion-easing-default',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500 focus-visible:ring-offset-2 ',
          'disabled:pointer-events-none disabled:opacity-50 ',
          checked ? tone.trackOn : tone.trackOff,
          TRACK_SIZE_CLASSES[size],
        )}
        {...rest}
      >
        <span
          aria-hidden="true"
          className={cn(
            'absolute inset-y-0 left-0 rounded-skeed-radius-9999 bg-skeed-color-neutral-50 opacity-0',
            'transition-all duration-skeed-motion-duration-normal ease-skeed-motion-easing-default',
            checked && variant !== 'calm' && 'w-full opacity-10',
          )}
        />
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none inline-flex items-center justify-center rounded-skeed-radius-9999',
            'transition-transform duration-skeed-motion-duration-fast ease-skeed-motion-easing-default',
            'group-active:scale-95',
            tone.thumb,
            checked ? THUMB_TRANSLATE_CLASSES[size] : 'translate-x-0',
            THUMB_SIZE_CLASSES[size],
          )}
        >
          {thumbIcon && <span className="text-skeed-color-neutral-900">{thumbIcon}</span>}
        </span>
      </button>
      {(label || description) && (
        <div className={cn('flex flex-col gap-skeed-spacing-1', !description && 'self-center')}>
          {label && (
            <span
              id={labelId}
              className={cn(
                'text-sm font-medium font-skeed-body leading-none',
                disabled ? 'text-skeed-color-neutral-400' : 'text-skeed-color-neutral-900',
              )}
            >
              {label}
            </span>
          )}
          {description && (
            <span
              id={descriptionId}
              className="text-sm font-skeed-body text-skeed-color-neutral-500"
            >
              {description}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
