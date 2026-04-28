import { Eye, EyeOff, Spinner } from '@skeed/asset-icon';
import { cn } from '@skeed/core/cn';
import { type HTMLAttributes, useId, useState } from 'react';

export interface OAuthProvider {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
}

export interface LoginFormProps extends Omit<HTMLAttributes<HTMLElement>, 'onSubmit'> {
  onSubmit: (data: { email: string; password: string }) => void | Promise<void>;
  loading?: boolean;
  error?: string;
  title?: string;
  subtitle?: string;
  forgotPasswordHref?: string;
  signUpHref?: string;
  oauthProviders?: OAuthProvider[];
}

const INPUT_BASE =
  'w-full bg-skeed-color-neutral-50 text-skeed-color-neutral-900 ' +
  'border border-skeed-color-neutral-300 rounded-skeed-radius-2 ' +
  'px-skeed-density-cozy-padx py-skeed-density-cozy-pady ' +
  'font-skeed-body placeholder:text-skeed-color-neutral-400 ' +
  'transition-colors duration-skeed-motion-duration-fast ease-skeed-motion-easing-default ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500 ' +
  'focus-visible:border-skeed-color-brand-500 ' +
  'disabled:pointer-events-none disabled:opacity-50';

export function LoginForm({
  onSubmit,
  loading = false,
  error,
  title = 'Sign in',
  subtitle,
  forgotPasswordHref,
  signUpHref,
  oauthProviders,
  className,
  ...rest
}: LoginFormProps) {
  const formId = useId();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLoading = loading || isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsSubmitting(true);
    try {
      await onSubmit({ email, password });
    } finally {
      setIsSubmitting(false);
    }
  };

  const emailId = `${formId}-email`;
  const passwordId = `${formId}-password`;
  const errorId = `${formId}-error`;

  return (
    <section
      aria-labelledby={`${formId}-title`}
      className={cn(
        'flex flex-col gap-skeed-spacing-6 w-full max-w-sm ' +
          'bg-skeed-color-neutral-50 rounded-skeed-radius-7 ' +
          'p-skeed-spacing-8 shadow-skeed-shadow-1',
        className,
      )}
      {...rest}
    >
      {/* Header */}
      <div className="flex flex-col gap-skeed-spacing-2">
        <h1
          id={`${formId}-title`}
          className="text-2xl font-semibold font-skeed-body text-skeed-color-neutral-900"
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm font-skeed-body text-skeed-color-neutral-500">{subtitle}</p>
        )}
      </div>

      {/* Server error */}
      {error && (
        <div
          id={errorId}
          role="alert"
          aria-live="assertive"
          className={
            'rounded-skeed-radius-2 border border-skeed-color-danger-500 ' +
            'bg-skeed-color-danger-50 px-skeed-spacing-4 py-skeed-spacing-3 ' +
            'text-sm font-skeed-body text-skeed-color-danger-600'
          }
        >
          {error}
        </div>
      )}

      {/* OAuth providers */}
      {oauthProviders && oauthProviders.length > 0 && (
        <>
          <div className="flex flex-col gap-skeed-spacing-3">
            {oauthProviders.map((provider) => (
              <button
                key={provider.id}
                type="button"
                onClick={provider.onClick}
                disabled={isLoading}
                className={
                  'flex w-full items-center justify-center gap-skeed-spacing-2 ' +
                  'rounded-skeed-radius-2 border border-skeed-color-neutral-300 ' +
                  'bg-skeed-color-neutral-50 px-skeed-density-cozy-padx py-skeed-density-cozy-pady ' +
                  'font-skeed-body font-medium text-skeed-color-neutral-900 ' +
                  'transition-colors duration-skeed-motion-duration-fast ease-skeed-motion-easing-default ' +
                  'hover:bg-skeed-color-neutral-100 ' +
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500 ' +
                  'disabled:pointer-events-none disabled:opacity-50'
                }
              >
                {provider.icon && <span className="flex items-center">{provider.icon}</span>}
                {provider.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-skeed-spacing-3" aria-hidden="true">
            <div className="h-px flex-1 bg-skeed-color-neutral-200" />
            <span className="text-xs font-skeed-body text-skeed-color-neutral-400">or</span>
            <div className="h-px flex-1 bg-skeed-color-neutral-200" />
          </div>
        </>
      )}

      {/* Credentials form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-skeed-spacing-4" noValidate>
        {/* Email */}
        <div className="flex flex-col gap-skeed-spacing-1">
          <label
            htmlFor={emailId}
            className="text-sm font-medium font-skeed-body text-skeed-color-neutral-900"
          >
            Email
          </label>
          <input
            id={emailId}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
            disabled={isLoading}
            className={INPUT_BASE}
          />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-skeed-spacing-1">
          <div className="flex items-center justify-between">
            <label
              htmlFor={passwordId}
              className="text-sm font-medium font-skeed-body text-skeed-color-neutral-900"
            >
              Password
            </label>
            {forgotPasswordHref && (
              <a
                href={forgotPasswordHref}
                className={
                  'text-sm font-skeed-body text-skeed-color-brand-500 hover:text-skeed-color-brand-600 ' +
                  'underline-offset-4 hover:underline ' +
                  'transition-colors duration-skeed-motion-duration-fast ease-skeed-motion-easing-default ' +
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500 rounded-skeed-radius-2'
                }
              >
                Forgot password?
              </a>
            )}
          </div>
          <div className="relative flex items-center">
            <input
              id={passwordId}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              disabled={isLoading}
              className={cn(INPUT_BASE, 'pr-skeed-spacing-10')}
            />
            <button
              type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((v) => !v)}
              className={
                'absolute right-skeed-spacing-3 flex items-center text-skeed-color-neutral-400 ' +
                'hover:text-skeed-color-neutral-900 ' +
                'transition-colors duration-skeed-motion-duration-fast ease-skeed-motion-easing-default ' +
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500 rounded-skeed-radius-2'
              }
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className={
            'flex w-full items-center justify-center gap-skeed-spacing-2 ' +
            'rounded-skeed-radius-2 bg-skeed-color-brand-500 ' +
            'px-skeed-density-cozy-padx py-skeed-density-cozy-pady ' +
            'font-skeed-body font-semibold text-skeed-color-neutral-50 ' +
            'transition-colors duration-skeed-motion-duration-fast ease-skeed-motion-easing-default ' +
            'hover:bg-skeed-color-brand-600 ' +
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500 ' +
            'disabled:pointer-events-none disabled:opacity-50'
          }
        >
          {isLoading && <Spinner size={16} className="animate-spin" />}
          {isLoading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      {/* Sign up link */}
      {signUpHref && (
        <p className="text-center text-sm font-skeed-body text-skeed-color-neutral-500">
          Don&apos;t have an account?{' '}
          <a
            href={signUpHref}
            className={
              'font-medium text-skeed-color-brand-500 hover:text-skeed-color-brand-600 ' +
              'underline-offset-4 hover:underline ' +
              'transition-colors duration-skeed-motion-duration-fast ease-skeed-motion-easing-default ' +
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500 rounded-skeed-radius-2'
            }
          >
            Sign up
          </a>
        </p>
      )}
    </section>
  );
}
