import { type InputHTMLAttributes, forwardRef, useId } from 'react';
import { cn } from '@skeed/core/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const BASE_INPUT_CLASSES =
  'w-full bg-skeed-color-neutral-50 text-skeed-color-neutral-900 ' +
  'border border-skeed-color-neutral-300 rounded-skeed-radius-2 ' +
  'px-skeed-density-cozy-padx py-skeed-density-cozy-pady ' +
  'font-skeed-body placeholder:text-skeed-color-neutral-400 ' +
  'transition-colors duration-skeed-motion-duration-fast ease-skeed-motion-easing-default ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500 ' +
  'focus-visible:border-skeed-color-brand-500 ' +
  'disabled:pointer-events-none disabled:opacity-50 ' +
  'read-only:bg-skeed-color-neutral-100';

const ERROR_INPUT_CLASSES = 'border-skeed-color-danger-500 focus-visible:ring-skeed-color-danger-500 focus-visible:border-skeed-color-danger-500';

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    hint,
    error,
    leadingIcon,
    trailingIcon,
    fullWidth = false,
    className,
    id: idProp,
    ...rest
  },
  ref,
) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  return (
    <div className={cn('flex flex-col gap-skeed-spacing-1', fullWidth ? 'w-full' : 'w-auto', className)}>
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium font-skeed-body text-skeed-color-neutral-900"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leadingIcon && (
          <span className="pointer-events-none absolute left-skeed-spacing-3 flex items-center text-skeed-color-neutral-400">
            {leadingIcon}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          aria-invalid={!!error}
          className={cn(
            BASE_INPUT_CLASSES,
            error && ERROR_INPUT_CLASSES,
            leadingIcon && 'pl-skeed-spacing-9',
            trailingIcon && 'pr-skeed-spacing-9',
          )}
          {...rest}
        />
        {trailingIcon && (
          <span className="pointer-events-none absolute right-skeed-spacing-3 flex items-center text-skeed-color-neutral-400">
            {trailingIcon}
          </span>
        )}
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-sm font-skeed-body text-skeed-color-danger-600">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-sm font-skeed-body text-skeed-color-neutral-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
