import { Check, Minus } from '@skeed/asset-icon';
import { cn } from '@skeed/core/cn';
import { type InputHTMLAttributes, forwardRef, useEffect, useId, useRef } from 'react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  description?: string;
  error?: string;
  indeterminate?: boolean;
}

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
              'transition-all duration-skeed-motion-duration-fast ease-skeed-motion-easing-default ' +
              'checked:bg-skeed-color-brand-500 checked:border-skeed-color-brand-500 ' +
              'indeterminate:bg-skeed-color-brand-500 indeterminate:border-skeed-color-brand-500 ' +
              'checked:scale-105 indeterminate:scale-105 ' +
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
            'transition-all duration-skeed-motion-duration-fast',
            'scale-75 peer-checked:scale-100 peer-indeterminate:scale-100',
          )}
        >
          {indeterminate ? <Minus size={12} /> : <Check size={12} />}
        </span>
      </div>
      <div className={cn('flex flex-col gap-skeed-spacing-1', !hasSubLabel && 'self-center')}>
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
        {description && !error && (
          <p id={descriptionId} className="text-sm font-skeed-body text-skeed-color-neutral-500">
            {description}
          </p>
        )}
        {error && (
          <p
            id={errorId}
            role="alert"
            className="text-sm font-skeed-body text-skeed-color-danger-600 animate-in fade-in slide-in-from-top-1"
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
});
