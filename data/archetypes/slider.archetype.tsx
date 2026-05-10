import { cn } from '@skeed/core/cn';
import { type InputHTMLAttributes, forwardRef } from 'react';

export interface SliderProps extends InputHTMLAttributes<HTMLInputElement> {
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  onValueChange?: (value: number) => void;
  label?: string;
  showValue?: boolean;
  valueFormatter?: (value: number) => string;
  variant?: 'clean' | 'glow' | 'meter' | 'steps';
  tone?: 'brand' | 'success' | 'warning' | 'danger';
}

const fillToneClasses = {
  brand: 'bg-skeed-color-brand-500',
  success: 'bg-skeed-color-success-500',
  warning: 'bg-skeed-color-warning-500',
  danger: 'bg-skeed-color-danger-500',
};

const thumbToneClasses = {
  brand: 'border-skeed-color-brand-500',
  success: 'border-skeed-color-success-500',
  warning: 'border-skeed-color-warning-500',
  danger: 'border-skeed-color-danger-500',
};

export const Slider = forwardRef<HTMLInputElement, SliderProps>(function Slider(
  {
    className,
    min = 0,
    max = 100,
    step = 1,
    value,
    onValueChange,
    label,
    showValue = true,
    valueFormatter,
    variant = 'clean',
    tone = 'brand',
    id,
    ...rest
  },
  ref,
) {
  const current = value ?? min;
  const percentage = Math.min(100, Math.max(0, ((current - min) / (max - min)) * 100));
  const formattedValue = valueFormatter ? valueFormatter(current) : String(current);
  const showStops = variant === 'steps' && max > min;

  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="mb-skeed-spacing-2 flex items-center justify-between gap-skeed-spacing-3">
          {label && (
            <label
              htmlFor={id}
              className="font-skeed-body text-sm font-medium text-skeed-color-neutral-900"
            >
              {label}
            </label>
          )}
          {showValue && (
            <output
              htmlFor={id}
              className="font-skeed-body text-sm font-semibold text-skeed-color-neutral-700"
              aria-live="polite"
            >
              {formattedValue}
            </output>
          )}
        </div>
      )}

      <div
        className={cn(
          'relative h-skeed-spacing-4 w-full rounded-skeed-radius-9999',
          variant === 'glow' && 'shadow-skeed-shadow-1',
        )}
      >
        <div className="absolute inset-x-0 top-1/2 h-skeed-spacing-2 -translate-y-1/2 rounded-skeed-radius-9999 bg-skeed-color-neutral-200" />
        <div
          className={cn(
            'absolute left-0 top-1/2 h-skeed-spacing-2 -translate-y-1/2 rounded-skeed-radius-9999',
            'transition-all duration-skeed-motion-duration-fast ease-skeed-motion-easing-default',
            fillToneClasses[tone],
            variant === 'glow' && 'shadow-skeed-shadow-2',
          )}
          style={{ width: `${percentage}%` }}
        />
        {variant === 'meter' && (
          <div className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-between">
            <span className="h-skeed-spacing-2 w-skeed-spacing-1 rounded-skeed-radius-9999 bg-skeed-color-neutral-50" />
            <span className="h-skeed-spacing-2 w-skeed-spacing-1 rounded-skeed-radius-9999 bg-skeed-color-neutral-50" />
            <span className="h-skeed-spacing-2 w-skeed-spacing-1 rounded-skeed-radius-9999 bg-skeed-color-neutral-50" />
            <span className="h-skeed-spacing-2 w-skeed-spacing-1 rounded-skeed-radius-9999 bg-skeed-color-neutral-50" />
          </div>
        )}
        {showStops && (
          <div className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-between">
            {Array.from({ length: Math.min(9, Math.floor((max - min) / step) + 1) }).map(
              (_, index) => (
                <span
                  key={index}
                  className="h-skeed-spacing-1 w-skeed-spacing-1 rounded-skeed-radius-9999 bg-skeed-color-neutral-50"
                />
              ),
            )}
          </div>
        )}
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute top-1/2 h-skeed-spacing-4 w-skeed-spacing-4 -translate-x-1/2 -translate-y-1/2 rounded-skeed-radius-9999 border-2 bg-skeed-color-neutral-50 shadow-skeed-shadow-1',
            'transition-all duration-skeed-motion-duration-fast ease-skeed-motion-easing-default',
            thumbToneClasses[tone],
          )}
          style={{ left: `${percentage}%` }}
        />
        <input
          ref={ref}
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-valuetext={formattedValue}
          onChange={(e) => onValueChange?.(Number(e.target.value))}
          className={cn(
            'absolute inset-0 h-full w-full cursor-pointer opacity-0',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500 focus-visible:ring-offset-2',
          )}
          {...rest}
        />
      </div>
      <div className="flex justify-between mt-skeed-spacing-1">
        <span className="text-xs font-skeed-body text-skeed-color-neutral-500">{min}</span>
        <span className="text-xs font-skeed-body text-skeed-color-neutral-700 font-medium">
          {formattedValue}
        </span>
        <span className="text-xs font-skeed-body text-skeed-color-neutral-500">{max}</span>
      </div>
    </div>
  );
});
