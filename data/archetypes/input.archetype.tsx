import { cn } from '@skeed/core/cn';
import { type InputHTMLAttributes, forwardRef, useEffect, useId, useState } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  success?: string;
  loading?: boolean;
  maxLength?: number;
  showCharacterCount?: boolean;
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

const ERROR_INPUT_CLASSES =
  'border-skeed-color-danger-500 focus-visible:ring-skeed-color-danger-500 focus-visible:border-skeed-color-danger-500';
const SUCCESS_INPUT_CLASSES =
  'border-skeed-color-success-500 focus-visible:ring-skeed-color-success-500 focus-visible:border-skeed-color-success-500';
const LOADING_INPUT_CLASSES = 'bg-skeed-color-neutral-100 cursor-wait';

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    hint,
    error,
    success,
    loading,
    maxLength,
    showCharacterCount,
    leadingIcon,
    trailingIcon,
    fullWidth = false,
    className,
    id: idProp,
    value,
    defaultValue,
    onChange,
    ...rest
  },
  ref,
) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const successId = `${id}-success`;

  // Track character count for controlled and uncontrolled inputs
  const [charCount, setCharCount] = useState(() => {
    const initialValue = value ?? defaultValue ?? '';
    return String(initialValue).length;
  });

  // Sync charCount when controlled value changes externally
  useEffect(() => {
    if (value !== undefined) {
      setCharCount(String(value).length);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCharCount(e.target.value.length);
    onChange?.(e);
  };

  return (
    <div
      className={cn(
        'flex flex-col gap-skeed-spacing-1',
        fullWidth ? 'w-full' : 'w-auto',
        className,
      )}
    >
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
          aria-describedby={error ? errorId : success ? successId : hint ? hintId : undefined}
          aria-invalid={!!error}
          aria-busy={loading}
          disabled={rest.disabled || loading}
          maxLength={maxLength}
          value={value}
          defaultValue={value === undefined ? defaultValue : undefined}
          onChange={handleChange}
          className={cn(
            BASE_INPUT_CLASSES,
            error && ERROR_INPUT_CLASSES,
            success && !error && SUCCESS_INPUT_CLASSES,
            loading && LOADING_INPUT_CLASSES,
            !!leadingIcon && 'pl-skeed-spacing-9',
            !!trailingIcon && 'pr-skeed-spacing-9',
          )}
          {...rest}
        />
        {trailingIcon && (
          <span className="pointer-events-none absolute right-skeed-spacing-3 flex items-center text-skeed-color-neutral-400">
            {trailingIcon}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between gap-skeed-spacing-2">
        {error ? (
          <p
            id={errorId}
            role="alert"
            className="text-sm font-skeed-body text-skeed-color-danger-600 animate-in fade-in slide-in-from-top-1"
          >
            {error}
          </p>
        ) : success ? (
          <p
            id={successId}
            className="text-sm font-skeed-body text-skeed-color-success-600 animate-in fade-in slide-in-from-top-1"
          >
            {success}
          </p>
        ) : hint ? (
          <p id={hintId} className="text-sm font-skeed-body text-skeed-color-neutral-500">
            {hint}
          </p>
        ) : (
          <div />
        )}
        {showCharacterCount && maxLength && (
          <span
            className={cn(
              'text-xs font-skeed-body tabular-nums',
              charCount > maxLength * 0.9
                ? 'text-skeed-color-danger-500'
                : 'text-skeed-color-neutral-400',
            )}
          >
            {charCount}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
});
