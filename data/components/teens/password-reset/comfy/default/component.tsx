import { type FormHTMLAttributes, type FormEvent, forwardRef, useState } from 'react';
import { cn } from '@skeed/core/cn';

export interface PasswordResetProps extends FormHTMLAttributes<HTMLFormElement> {
  onSubmit?: (email: string) => void;
  isLoading?: boolean;
  successMessage?: string;
  errorMessage?: string;
}

export const PasswordReset = forwardRef<HTMLFormElement, PasswordResetProps>(function PasswordReset(
  { className, onSubmit, isLoading, successMessage, errorMessage, ...rest },
  ref,
) {
  const [email, setEmail] = useState('');
  const emailId = 'password-reset-email';

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit?.(email);
  };

  return (
    <form
      ref={ref as any}
      onSubmit={handleSubmit}
      className={cn(
        'flex flex-col gap-skeed-spacing-4',
        'p-skeed-spacing-6',
        'bg-skeed-color-neutral-50',
        'rounded-skeed-radius-2 border border-skeed-color-neutral-200',
        className,
      )}
      {...rest}
    >
      <div className="text-center">
        <h2 className="text-lg font-semibold font-skeed-body text-skeed-color-neutral-900">
          Reset your password
        </h2>
        <p className="text-sm font-skeed-body text-skeed-color-neutral-600 mt-skeed-spacing-1">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      <div className="flex flex-col gap-skeed-spacing-1">
        <label htmlFor={emailId} className="text-sm font-medium font-skeed-body text-skeed-color-neutral-900">
          Email address
        </label>
        <input
          id={emailId}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          className={cn(
            'px-skeed-spacing-3 py-skeed-spacing-2',
            'rounded-skeed-radius-1 border border-skeed-color-neutral-300',
            'text-sm font-skeed-body text-skeed-color-neutral-900',
            'placeholder:text-skeed-color-neutral-400',
            'focus:outline-none focus:ring-2 focus:ring-skeed-color-brand-500 focus:border-skeed-color-brand-500',
          )}
        />
      </div>

      {successMessage && (
        <div className="text-sm font-skeed-body text-skeed-color-success-600 bg-skeed-color-success-50 px-skeed-spacing-3 py-skeed-spacing-2 rounded-skeed-radius-1">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="text-sm font-skeed-body text-skeed-color-danger-600 bg-skeed-color-danger-50 px-skeed-spacing-3 py-skeed-spacing-2 rounded-skeed-radius-1">
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || !email}
        className={cn(
          'w-full px-skeed-spacing-4 py-skeed-spacing-2',
          'rounded-skeed-radius-1',
          'bg-skeed-color-brand-500 text-white',
          'text-sm font-medium font-skeed-body',
          'hover:bg-skeed-color-brand-600',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-colors duration-skeed-motion-duration-fast',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500',
        )}
      >
        {isLoading ? 'Sending...' : 'Send reset link'}
      </button>
    </form>
  );
});
