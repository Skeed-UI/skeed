import { cn } from '@skeed/core/cn';
import { type TextareaHTMLAttributes, forwardRef, useId, useState } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  fullWidth?: boolean;
  characterCount?: boolean;
}

const BASE_TEXTAREA_CLASSES =
  'w-full bg-skeed-color-neutral-50 text-skeed-color-neutral-900 ' +
  'border border-skeed-color-neutral-300 rounded-skeed-radius-2 ' +
  'px-skeed-density-cozy-padx py-skeed-density-cozy-pady ' +
  'font-skeed-body placeholder:text-skeed-color-neutral-400 ' +
  'transition-colors duration-skeed-motion-duration-fast ease-skeed-motion-easing-default ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500 ' +
  'focus-visible:border-skeed-color-brand-500 ' +
  'disabled:pointer-events-none disabled:opacity-50 ' +
  'read-only:bg-skeed-color-neutral-100';

const ERROR_TEXTAREA_CLASSES =
  'border-skeed-color-danger-500 focus-visible:ring-skeed-color-danger-500 focus-visible:border-skeed-color-danger-500';

const RESIZE_CLASSES: Record<NonNullable<TextareaProps['resize']>, string> = {
  none: 'resize-none',
  vertical: 'resize-y',
  horizontal: 'resize-x',
  both: 'resize',
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    label,
    hint,
    error,
    resize = 'vertical',
    fullWidth = false,
    characterCount = false,
    className,
    id: idProp,
    value,
    defaultValue,
    onChange,
    maxLength,
    ...rest
  },
  ref,
) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  const [internalLength, setInternalLength] = useState<number>(() => {
    if (value !== undefined) return String(value).length;
    if (defaultValue !== undefined) return String(defaultValue).length;
    return 0;
  });

  const isControlled = value !== undefined;
  const currentLength = isControlled ? String(value).length : internalLength;
  const showCharacterCount = characterCount && maxLength !== undefined;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!isControlled) {
      setInternalLength(e.target.value.length);
    }
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
      <textarea
        ref={ref}
        id={id}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        aria-invalid={!!error}
        value={value}
        defaultValue={defaultValue}
        maxLength={maxLength}
        onChange={handleChange}
        className={cn(
          BASE_TEXTAREA_CLASSES,
          RESIZE_CLASSES[resize],
          error && ERROR_TEXTAREA_CLASSES,
        )}
        {...rest}
      />
      <div className="flex items-start justify-between gap-skeed-spacing-2">
        <div>
          {error ? (
            <p
              id={errorId}
              role="alert"
              className="text-sm font-skeed-body text-skeed-color-danger-600"
            >
              {error}
            </p>
          ) : hint ? (
            <p id={hintId} className="text-sm font-skeed-body text-skeed-color-neutral-500">
              {hint}
            </p>
          ) : null}
        </div>
        {showCharacterCount && (
          <p
            className={cn(
              'ml-auto shrink-0 text-sm font-skeed-body tabular-nums',
              currentLength >= (maxLength ?? 0)
                ? 'text-skeed-color-danger-600'
                : 'text-skeed-color-neutral-400',
            )}
            aria-live="polite"
          >
            {currentLength}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
});
