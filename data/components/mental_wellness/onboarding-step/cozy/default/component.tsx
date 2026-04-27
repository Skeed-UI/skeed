import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@skeed/core/cn';

export interface OnboardingStepProps extends HTMLAttributes<HTMLDivElement> {
  stepNumber: number;
  totalSteps: number;
  title: string;
  description?: string;
  isActive?: boolean;
  isCompleted?: boolean;
}

export const OnboardingStep = forwardRef<HTMLDivElement, OnboardingStepProps>(function OnboardingStep(
  { className, stepNumber, totalSteps, title, description, isActive, isCompleted, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'flex gap-skeed-spacing-4',
        'p-skeed-spacing-4',
        'rounded-skeed-radius-2',
        isActive && 'bg-skeed-color-brand-50 border border-skeed-color-brand-200',
        className,
      )}
      {...rest}
    >
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'flex items-center justify-center',
            'h-skeed-spacing-8 w-skeed-spacing-8',
            'rounded-skeed-radius-9999',
            'text-sm font-semibold font-skeed-body',
            isCompleted
              ? 'bg-skeed-color-success-500 text-white'
              : isActive
                ? 'bg-skeed-color-brand-500 text-white'
                : 'bg-skeed-color-neutral-200 text-skeed-color-neutral-500',
          )}
        >
          {isCompleted ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            stepNumber
          )}
        </div>
        {stepNumber < totalSteps && (
          <div className="w-skeed-spacing-0 h-full bg-skeed-color-neutral-200 mt-skeed-spacing-2" style={{ width: '2px' }} />
        )}
      </div>
      <div className="flex-1 pb-skeed-spacing-4">
        <h3 className={cn(
          'text-base font-semibold font-skeed-body',
          isActive ? 'text-skeed-color-brand-700' : 'text-skeed-color-neutral-900',
        )}>
          {title}
        </h3>
        {description && (
          <p className="text-sm font-skeed-body text-skeed-color-neutral-600 mt-skeed-spacing-1">
            {description}
          </p>
        )}
        {isActive && children && (
          <div className="mt-skeed-spacing-4">{children}</div>
        )}
      </div>
    </div>
  );
});
