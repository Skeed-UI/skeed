import { Check, Eye, EyeOff, Spinner } from '@skeed/asset-icon';
import { cn } from '@skeed/core/cn';
import { type HTMLAttributes, useId, useState } from 'react';

type FieldKey = 'name' | 'email' | 'password' | 'confirm-password';

export interface SignupFormProps extends Omit<HTMLAttributes<HTMLElement>, 'onSubmit'> {
  onSubmit: (data: { name: string; email: string; password: string }) => void | Promise<void>;
  loading?: boolean;
  error?: string;
  title?: string;
  subtitle?: string;
  loginHref?: string;
  fields?: FieldKey[];
  termsHref?: string;
  privacyHref?: string;
}

const DEFAULT_FIELDS: FieldKey[] = ['name', 'email', 'password', 'confirm-password'];

const INPUT_BASE =
  'w-full bg-skeed-color-neutral-50 text-skeed-color-neutral-900 ' +
  'border border-skeed-color-neutral-300 rounded-skeed-radius-2 ' +
  'px-skeed-density-cozy-padx py-skeed-density-cozy-pady ' +
  'font-skeed-body placeholder:text-skeed-color-neutral-400 ' +
  'transition-colors duration-skeed-motion-duration-fast ease-skeed-motion-easing-default ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500 ' +
  'focus-visible:border-skeed-color-brand-500 ' +
  'disabled:pointer-events-none disabled:opacity-50';

const ERROR_INPUT =
  'border-skeed-color-danger-500 focus-visible:ring-skeed-color-danger-500 focus-visible:border-skeed-color-danger-500';

const TOGGLE_BTN =
  'absolute right-skeed-spacing-3 flex items-center text-skeed-color-neutral-400 ' +
  'hover:text-skeed-color-neutral-900 ' +
  'transition-colors duration-skeed-motion-duration-fast ease-skeed-motion-easing-default ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500 rounded-skeed-radius-2';

type PasswordStrength = 'weak' | 'fair' | 'strong';

function getPasswordStrength(pw: string): PasswordStrength {
  if (pw.length === 0) return 'weak';
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 2) return 'weak';
  if (score <= 3) return 'fair';
  return 'strong';
}

const STRENGTH_LABEL: Record<PasswordStrength, string> = {
  weak: 'Weak',
  fair: 'Fair',
  strong: 'Strong',
};

const STRENGTH_TEXT_CLASSES: Record<PasswordStrength, string> = {
  weak: 'text-skeed-color-danger-600',
  fair: 'text-skeed-color-warning-600',
  strong: 'text-skeed-color-success-600',
};

const STRENGTH_BAR_CLASSES: Record<PasswordStrength, string> = {
  weak: 'bg-skeed-color-danger-500 w-1/3',
  fair: 'bg-skeed-color-warning-500 w-2/3',
  strong: 'bg-skeed-color-success-500 w-full',
};

export function SignupForm({
  onSubmit,
  loading = false,
  error,
  title = 'Create account',
  subtitle,
  loginHref,
  fields = DEFAULT_FIELDS,
  termsHref,
  privacyHref,
  className,
  ...rest
}: SignupFormProps) {
  const formId = useId();

  // Field visibility
  const hasName = fields.includes('name');
  const hasEmail = fields.includes('email');
  const hasPw = fields.includes('password');
  const hasConfirmPw = fields.includes('confirm-password');
  const requireTerms = !!(termsHref || privacyHref);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [revealPw, setRevealPw] = useState(false);
  const [revealConfirmPw, setRevealConfirmPw] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey | 'terms', string>>>({});

  const isLoading = loading || isSubmitting;
  const pwStrength = getPasswordStrength(pw);

  const nameId = `${formId}-name`;
  const emailId = `${formId}-email`;
  const pwId = `${formId}-password`;
  const confirmPwId = `${formId}-confirm-password`;
  const termsId = `${formId}-terms`;

  const validate = (): boolean => {
    const errors: Partial<Record<FieldKey | 'terms', string>> = {};
    if (hasName && !name.trim()) errors['name'] = 'Name is required.';
    if (hasEmail && !email.trim()) errors['email'] = 'Email is required.';
    if (hasPw && pw.length < 8) errors['password'] = 'Password must be at least 8 characters.';
    if (hasConfirmPw && pw !== confirmPw) errors['confirm-password'] = 'Passwords do not match.';
    if (requireTerms && !termsAccepted) errors['terms'] = 'You must accept the terms to continue.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await onSubmit({ name, email, password: pw });
    } finally {
      setIsSubmitting(false);
    }
  };

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

      <form onSubmit={handleSubmit} className="flex flex-col gap-skeed-spacing-4" noValidate>
        {/* Name */}
        {hasName && (
          <div className="flex flex-col gap-skeed-spacing-1">
            <label
              htmlFor={nameId}
              className="text-sm font-medium font-skeed-body text-skeed-color-neutral-900"
            >
              Full name
            </label>
            <input
              id={nameId}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Smith"
              autoComplete="name"
              disabled={isLoading}
              aria-invalid={!!fieldErrors['name']}
              aria-describedby={fieldErrors['name'] ? `${nameId}-error` : undefined}
              className={cn(INPUT_BASE, fieldErrors['name'] && ERROR_INPUT)}
            />
            {fieldErrors['name'] && (
              <p
                id={`${nameId}-error`}
                role="alert"
                className="text-sm font-skeed-body text-skeed-color-danger-600"
              >
                {fieldErrors['name']}
              </p>
            )}
          </div>
        )}

        {/* Email */}
        {hasEmail && (
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
              disabled={isLoading}
              aria-invalid={!!fieldErrors['email']}
              aria-describedby={fieldErrors['email'] ? `${emailId}-error` : undefined}
              className={cn(INPUT_BASE, fieldErrors['email'] && ERROR_INPUT)}
            />
            {fieldErrors['email'] && (
              <p
                id={`${emailId}-error`}
                role="alert"
                className="text-sm font-skeed-body text-skeed-color-danger-600"
              >
                {fieldErrors['email']}
              </p>
            )}
          </div>
        )}

        {/* Password */}
        {hasPw && (
          <div className="flex flex-col gap-skeed-spacing-1">
            <label
              htmlFor={pwId}
              className="text-sm font-medium font-skeed-body text-skeed-color-neutral-900"
            >
              Password
            </label>
            <div className="relative flex items-center">
              <input
                id={pwId}
                type={revealPw ? 'text' : 'password'}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                disabled={isLoading}
                aria-invalid={!!fieldErrors['password']}
                aria-describedby={
                  [
                    fieldErrors['password'] ? `${pwId}-error` : '',
                    pw.length > 0 ? `${pwId}-strength` : '',
                  ]
                    .filter(Boolean)
                    .join(' ') || undefined
                }
                className={cn(
                  INPUT_BASE,
                  'pr-skeed-spacing-10',
                  fieldErrors['password'] && ERROR_INPUT,
                )}
              />
              <button
                type="button"
                aria-label={revealPw ? 'Hide password' : 'Show password'}
                aria-pressed={revealPw}
                onClick={() => setRevealPw((v) => !v)}
                className={TOGGLE_BTN}
              >
                {revealPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {pw.length > 0 && (
              <div
                id={`${pwId}-strength`}
                className="flex flex-col gap-skeed-spacing-1"
                aria-live="polite"
              >
                <div className="h-1 w-full rounded-skeed-radius-9999 bg-skeed-color-neutral-200 overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-skeed-radius-9999 transition-all duration-skeed-motion-duration-fast ease-skeed-motion-easing-default',
                      STRENGTH_BAR_CLASSES[pwStrength],
                    )}
                  />
                </div>
                <p className={cn('text-xs font-skeed-body', STRENGTH_TEXT_CLASSES[pwStrength])}>
                  {STRENGTH_LABEL[pwStrength]} password
                </p>
              </div>
            )}
            {fieldErrors['password'] && (
              <p
                id={`${pwId}-error`}
                role="alert"
                className="text-sm font-skeed-body text-skeed-color-danger-600"
              >
                {fieldErrors['password']}
              </p>
            )}
          </div>
        )}

        {/* Confirm Password */}
        {hasConfirmPw && (
          <div className="flex flex-col gap-skeed-spacing-1">
            <label
              htmlFor={confirmPwId}
              className="text-sm font-medium font-skeed-body text-skeed-color-neutral-900"
            >
              Confirm password
            </label>
            <div className="relative flex items-center">
              <input
                id={confirmPwId}
                type={revealConfirmPw ? 'text' : 'password'}
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                placeholder="Re-enter password"
                autoComplete="new-password"
                disabled={isLoading}
                aria-invalid={!!fieldErrors['confirm-password']}
                aria-describedby={
                  fieldErrors['confirm-password'] ? `${confirmPwId}-error` : undefined
                }
                className={cn(
                  INPUT_BASE,
                  'pr-skeed-spacing-10',
                  fieldErrors['confirm-password'] && ERROR_INPUT,
                )}
              />
              <button
                type="button"
                aria-label={revealConfirmPw ? 'Hide confirm password' : 'Show confirm password'}
                aria-pressed={revealConfirmPw}
                onClick={() => setRevealConfirmPw((v) => !v)}
                className={TOGGLE_BTN}
              >
                {revealConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {fieldErrors['confirm-password'] && (
              <p
                id={`${confirmPwId}-error`}
                role="alert"
                className="text-sm font-skeed-body text-skeed-color-danger-600"
              >
                {fieldErrors['confirm-password']}
              </p>
            )}
          </div>
        )}

        {/* Terms & privacy consent */}
        {requireTerms && (
          <div className="flex flex-col gap-skeed-spacing-1">
            <div className="flex items-start gap-skeed-spacing-3">
              <div className="relative mt-skeed-spacing-1 shrink-0">
                <input
                  id={termsId}
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  disabled={isLoading}
                  aria-invalid={!!fieldErrors['terms']}
                  aria-describedby={fieldErrors['terms'] ? `${termsId}-error` : undefined}
                  className={cn(
                    'peer appearance-none h-4 w-4 rounded-skeed-radius-2 border border-skeed-color-neutral-300 ' +
                      'bg-skeed-color-neutral-50 cursor-pointer ' +
                      'transition-colors duration-skeed-motion-duration-fast ease-skeed-motion-easing-default ' +
                      'checked:bg-skeed-color-brand-500 checked:border-skeed-color-brand-500 ' +
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500 focus-visible:ring-offset-2 ' +
                      'disabled:pointer-events-none disabled:opacity-50',
                    fieldErrors['terms'] && 'border-skeed-color-danger-500',
                  )}
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 flex items-center justify-center text-skeed-color-neutral-50 opacity-0 peer-checked:opacity-100"
                >
                  <Check size={12} />
                </span>
              </div>
              <label
                htmlFor={termsId}
                className="text-sm font-skeed-body text-skeed-color-neutral-700 cursor-pointer leading-snug"
              >
                I agree to the{' '}
                {termsHref && (
                  <a
                    href={termsHref}
                    className="text-skeed-color-brand-500 hover:text-skeed-color-brand-600 underline-offset-4 hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Terms of Service
                  </a>
                )}
                {termsHref && privacyHref && ' and '}
                {privacyHref && (
                  <a
                    href={privacyHref}
                    className="text-skeed-color-brand-500 hover:text-skeed-color-brand-600 underline-offset-4 hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Privacy Policy
                  </a>
                )}
              </label>
            </div>
            {fieldErrors['terms'] && (
              <p
                id={`${termsId}-error`}
                role="alert"
                className="text-sm font-skeed-body text-skeed-color-danger-600"
              >
                {fieldErrors['terms']}
              </p>
            )}
          </div>
        )}

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
          {isLoading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      {/* Login link */}
      {loginHref && (
        <p className="text-center text-sm font-skeed-body text-skeed-color-neutral-500">
          Already have an account?{' '}
          <a
            href={loginHref}
            className={
              'font-medium text-skeed-color-brand-500 hover:text-skeed-color-brand-600 ' +
              'underline-offset-4 hover:underline ' +
              'transition-colors duration-skeed-motion-duration-fast ease-skeed-motion-easing-default ' +
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500 rounded-skeed-radius-2'
            }
          >
            Sign in
          </a>
        </p>
      )}
    </section>
  );
}
