import { cn } from '@skeed/core/cn';
import { type InputHTMLAttributes, forwardRef } from 'react';

export interface SliderProps extends InputHTMLAttributes<HTMLInputElement> {
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  onValueChange?: (value: number) => void;
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(function Slider(
  { className, min = 0, max = 100, step = 1, value, onValueChange, ...rest },
  ref,
) {
  const percentage = (((value ?? min) - min) / (max - min)) * 100;

  return (
    <div className={cn('w-full', className)}>
      <div className="relative h-skeed-spacing-2 w-full">
        <div className="absolute inset-0 rounded-skeed-radius-9999 bg-skeed-color-neutral-200" />
        <div
          className="absolute inset-y-0 left-0 rounded-skeed-radius-9999 bg-skeed-color-brand-500"
          style={{ width: `${percentage}%` }}
        />
        <input
          ref={ref}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onValueChange?.(Number(e.target.value))}
          className={cn(
            'absolute inset-0 w-full h-full opacity-0 cursor-pointer',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500 focus-visible:ring-offset-2',
          )}
          {...rest}
        />
      </div>
      <div className="flex justify-between mt-skeed-spacing-1">
        <span className="text-xs font-skeed-body text-skeed-color-neutral-500">{min}</span>
        <span className="text-xs font-skeed-body text-skeed-color-neutral-700 font-medium">
          {value ?? min}
        </span>
        <span className="text-xs font-skeed-body text-skeed-color-neutral-500">{max}</span>
      </div>
    </div>
  );
});
