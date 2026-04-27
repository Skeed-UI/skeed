import { type SelectHTMLAttributes, forwardRef, useId } from 'react';
import { cn } from '@skeed/core/cn';
import { ChevronDown } from '@skeed/asset-icon';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  success?: string;
  loading?: boolean;
  options: SelectOption[];
  placeholder?: string;
  fullWidth?: boolean;
}

const BASE_SELECT_CLASSES =
  'w-full appearance-none bg-skeed-color-neutral-50 text-skeed-color-neutral-900 ' +
  'border border-skeed-color-neutral-300 rounded-skeed-radius-2 ' +
  'px-skeed-density-cozy-padx py-skeed-density-cozy-pady pr-skeed-spacing-9 ' +
  'font-skeed-body ' +
  'transition-colors duration-skeed-motion-duration-fast ease-skeed-motion-easing-default ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500 ' +
  'focus-visible:border-skeed-color-brand-500 ' +
  'disabled:pointer-events-none disabled:opacity-50 ' +
  'cursor-pointer';

const ERROR_SELECT_CLASSES =
  'border-skeed-color-danger-500 focus-visible:ring-skeed-color-danger-500 focus-visible:border-skeed-color-danger-500';
const SUCCESS_SELECT_CLASSES =
  'border-skeed-color-success-500 focus-visible:ring-skeed-color-success-500 focus-visible:border-skeed-color-success-500';
const LOADING_SELECT_CLASSES = 'bg-skeed-color-neutral-100 cursor-wait';

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    label,
    hint,
    error,
    success,
    loading,
    options,
    placeholder,
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
  const successId = `${id}-success`;

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
        <select
          ref={ref}
          id={id}
          aria-describedby={error ? errorId : success ? successId : hint ? hintId : undefined}
          aria-invalid={!!error}
          aria-busy={loading}
          disabled={rest.disabled || loading}
          className={cn(
            BASE_SELECT_CLASSES,
            error && ERROR_SELECT_CLASSES,
            success && !error && SUCCESS_SELECT_CLASSES,
            loading && LOADING_SELECT_CLASSES,
          )}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-skeed-spacing-3 flex items-center text-skeed-color-neutral-400">
          <ChevronDown size={16} />
        </span>
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-sm font-skeed-body text-skeed-color-danger-600 animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      ) : success ? (
        <p id={successId} className="text-sm font-skeed-body text-skeed-color-success-600 animate-in fade-in slide-in-from-top-1">
          {success}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-sm font-skeed-body text-skeed-color-neutral-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
