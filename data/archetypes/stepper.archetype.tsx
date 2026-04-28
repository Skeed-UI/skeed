import { Check } from '@skeed/asset-icon';
import { cn } from '@skeed/core/cn';
import { type HTMLAttributes, forwardRef } from 'react';

export interface StepperStep {
  id: string;
  label: string;
  description?: string;
  status?: 'complete' | 'current' | 'pending' | 'error';
}

export interface StepperProps extends HTMLAttributes<HTMLDivElement> {
  steps: StepperStep[];
  currentStep?: number;
}

export const Stepper = forwardRef<HTMLDivElement, StepperProps>(function Stepper(
  { className, steps, currentStep = 0, ...rest },
  ref,
) {
  return (
    <nav ref={ref} aria-label="Progress" className={cn('w-full', className)} {...rest}>
      <ol className={cn('flex items-center', 'gap-skeed-spacing-2')} role="list">
        {steps.map((step, index) => {
          const isComplete = index < currentStep;
          const isCurrent = index === currentStep;
          const isError = step.status === 'error';

          return (
            <li key={step.id} className="flex items-center gap-skeed-spacing-2">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex items-center justify-center',
                    'h-skeed-spacing-8 w-skeed-spacing-8',
                    'rounded-skeed-radius-9999',
                    'text-sm font-medium font-skeed-body',
                    isError
                      ? 'bg-skeed-color-danger-100 text-skeed-color-danger-600 border border-skeed-color-danger-300'
                      : isComplete
                        ? 'bg-skeed-color-success-100 text-skeed-color-success-600'
                        : isCurrent
                          ? 'bg-skeed-color-brand-100 text-skeed-color-brand-600 border-2 border-skeed-color-brand-500'
                          : 'bg-skeed-color-neutral-100 text-skeed-color-neutral-500 border border-skeed-color-neutral-300',
                  )}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isComplete ? <Check size={16} /> : index + 1}
                </div>
                <span
                  className={cn(
                    'mt-skeed-spacing-1 text-xs font-skeed-body',
                    isCurrent
                      ? 'text-skeed-color-brand-600 font-medium'
                      : 'text-skeed-color-neutral-500',
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'w-skeed-spacing-12 h-skeed-spacing-0',
                    index < currentStep
                      ? 'bg-skeed-color-success-400'
                      : 'bg-skeed-color-neutral-300',
                  )}
                  style={{ height: '2px' }}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
});
