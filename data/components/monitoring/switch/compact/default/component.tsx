import { type HTMLAttributes, useId } from 'react';
import { cn } from '@skeed/core/cn';

export interface SwitchProps extends Omit<HTMLAttributes<HTMLButtonElement>, 'onChange' | 'onClick'> {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

const TRACK_SIZE_CLASSES = {
  sm: 'h-4 w-8',
  md: 'h-6 w-11',
};

const THUMB_SIZE_CLASSES = {
  sm: 'h-3 w-3',
  md: 'h-5 w-5',
};

const THUMB_TRANSLATE_CLASSES = {
  sm: 'translate-x-4',
  md: 'translate-x-5',
};

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
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
          'relative inline-flex shrink-0 cursor-pointer items-center rounded-skeed-radius-9999 border-2 border-transparent ',
          'transition-colors duration-skeed-motion-duration-fast ease-skeed-motion-easing-default ',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500 focus-visible:ring-offset-2 ',
          'disabled:pointer-events-none disabled:opacity-50 ',
          checked ? 'bg-skeed-color-brand-500' : 'bg-skeed-color-neutral-300',
          TRACK_SIZE_CLASSES[size],
        )}
        {...rest}
      >
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none inline-block rounded-skeed-radius-9999 bg-skeed-color-neutral-50 shadow-skeed-shadow-1 ',
            'transition-transform duration-skeed-motion-duration-fast ease-skeed-motion-easing-default ',
            checked ? THUMB_TRANSLATE_CLASSES[size] : 'translate-x-0',
            THUMB_SIZE_CLASSES[size],
          )}
        />
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
            <span id={descriptionId} className="text-sm font-skeed-body text-skeed-color-neutral-500">
              {description}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
