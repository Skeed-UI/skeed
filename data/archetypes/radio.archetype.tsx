import { cn } from '@skeed/core/cn';
import { type InputHTMLAttributes, forwardRef, useId } from 'react';

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  description?: string;
}

export interface RadioGroupOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  options: RadioGroupOption[];
  value?: string;
  onChange?: (value: string) => void;
  name: string;
  label?: string;
  error?: string;
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { label, description, className, id: idProp, disabled, ...rest },
  ref,
) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const descriptionId = `${id}-description`;

  return (
    <div className={cn('flex items-start gap-skeed-spacing-3', className)}>
      <div className="relative mt-skeed-spacing-1 shrink-0">
        <input
          ref={ref}
          id={id}
          type="radio"
          disabled={disabled}
          aria-describedby={description ? descriptionId : undefined}
          className={cn(
            'peer appearance-none h-4 w-4 rounded-skeed-radius-9999 border border-skeed-color-neutral-300 ' +
              'bg-skeed-color-neutral-50 cursor-pointer ' +
              'transition-colors duration-skeed-motion-duration-fast ease-skeed-motion-easing-default ' +
              'checked:border-skeed-color-brand-500 ' +
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500 focus-visible:ring-offset-2 ' +
              'disabled:pointer-events-none disabled:opacity-50',
          )}
          {...rest}
        />
        {/* Inner circle indicator shown when checked */}
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-0 flex items-center justify-center',
            'opacity-0 peer-checked:opacity-100',
          )}
        >
          <span className="h-2 w-2 rounded-skeed-radius-9999 bg-skeed-color-brand-500" />
        </span>
      </div>
      <div className={cn('flex flex-col gap-skeed-spacing-1', !description && 'self-center')}>
        <label
          htmlFor={id}
          className={cn(
            'text-sm font-medium font-skeed-body leading-none',
            disabled
              ? 'text-skeed-color-neutral-400 cursor-not-allowed'
              : 'text-skeed-color-neutral-900 cursor-pointer',
          )}
        >
          {label}
        </label>
        {description && (
          <p id={descriptionId} className="text-sm font-skeed-body text-skeed-color-neutral-500">
            {description}
          </p>
        )}
      </div>
    </div>
  );
});

export function RadioGroup({
  options,
  value,
  onChange,
  name,
  label,
  error,
  orientation = 'vertical',
  className,
}: RadioGroupProps) {
  const groupId = useId();
  const errorId = `${groupId}-error`;

  return (
    <fieldset
      className={cn('border-0 p-0 m-0', className)}
      aria-describedby={error ? errorId : undefined}
    >
      {label && (
        <legend className="mb-skeed-spacing-3 text-sm font-semibold font-skeed-body text-skeed-color-neutral-900">
          {label}
        </legend>
      )}
      <div
        className={cn(
          'flex gap-skeed-spacing-3',
          orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap',
        )}
      >
        {options.map((option) => (
          <Radio
            key={option.value}
            id={`${groupId}-${option.value}`}
            name={name}
            value={option.value}
            label={option.label}
            description={option.description}
            disabled={option.disabled}
            checked={value !== undefined ? value === option.value : undefined}
            onChange={onChange ? () => onChange(option.value) : undefined}
          />
        ))}
      </div>
      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-skeed-spacing-2 text-sm font-skeed-body text-skeed-color-danger-600"
        >
          {error}
        </p>
      )}
    </fieldset>
  );
}
