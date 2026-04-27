import { type InputHTMLAttributes, forwardRef, useId, useRef, useEffect } from 'react';
import { cn } from '@skeed/core/cn';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  description?: string;
  error?: string;
  indeterminate?: boolean;
}

const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const MinusIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  {
    label,
    description,
    error,
    indeterminate = false,
    className,
    id: idProp,
    checked,
    disabled,
    ...rest
  },
  ref,
) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  const internalRef = useRef<HTMLInputElement>(null);

  // Merge refs
  const setRef = (node: HTMLInputElement | null) => {
    (internalRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
  };

  useEffect(() => {
    if (internalRef.current) {
      internalRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  const hasSubLabel = description || error;
  const describedBy = error ? errorId : description ? descriptionId : undefined;

  return (
    <div className={cn('flex items-start gap-skeed-spacing-3', className)}>
      <div className="relative mt-skeed-spacing-1 shrink-0">
        <input
          ref={setRef}
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          aria-describedby={describedBy}
          aria-invalid={!!error}
          className={cn(
            'peer appearance-none h-4 w-4 rounded-skeed-radius-2 border border-skeed-color-neutral-300 ' +
            'bg-skeed-color-neutral-50 cursor-pointer ' +
            'transition-colors duration-skeed-motion-duration-fast ease-skeed-motion-easing-default ' +
            'checked:bg-skeed-color-brand-500 checked:border-skeed-color-brand-500 ' +
            'indeterminate:bg-skeed-color-brand-500 indeterminate:border-skeed-color-brand-500 ' +
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500 focus-visible:ring-offset-2 ' +
            'disabled:pointer-events-none disabled:opacity-50',
            error && 'border-skeed-color-danger-500 focus-visible:ring-skeed-color-danger-500',
          )}
          {...rest}
        />
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-0 flex items-center justify-center text-skeed-color-neutral-50',
            'opacity-0 peer-checked:opacity-100 peer-indeterminate:opacity-100',
          )}
        >
          {indeterminate ? <MinusIcon /> : <CheckIcon />}
        </span>
      </div>
      <div className={cn('flex flex-col gap-skeed-spacing-1', !hasSubLabel && 'self-center')}>
        <label
          htmlFor={id}
          className={cn(
            'text-sm font-medium font-skeed-body leading-none',
            disabled ? 'text-skeed-color-neutral-400 cursor-not-allowed' : 'text-skeed-color-neutral-900 cursor-pointer',
          )}
        >
          {label}
        </label>
        {description && !error && (
          <p id={descriptionId} className="text-sm font-skeed-body text-skeed-color-neutral-500">
            {description}
          </p>
        )}
        {error && (
          <p id={errorId} role="alert" className="text-sm font-skeed-body text-skeed-color-danger-600">
            {error}
          </p>
        )}
      </div>
    </div>
  );
});
