import { CheckCircle, Spinner } from '@skeed/asset-icon';
import { cn } from '@skeed/core/cn';
import { type HTMLAttributes, useId, useState } from 'react';

export interface ContactFormProps extends Omit<HTMLAttributes<HTMLElement>, 'onSubmit'> {
  onSubmit: (data: {
    name: string;
    email: string;
    subject?: string;
    message: string;
  }) => void | Promise<void>;
  loading?: boolean;
  success?: boolean;
  error?: string;
  title?: string;
  subtitle?: string;
  includeSubject?: boolean;
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

const ERROR_INPUT =
  'border-skeed-color-danger-500 focus-visible:ring-skeed-color-danger-500 focus-visible:border-skeed-color-danger-500';

type FieldKey = 'name' | 'email' | 'subject' | 'message';

export function ContactForm({
  onSubmit,
  loading = false,
  success = false,
  error,
  title = 'Contact us',
  subtitle,
  includeSubject = true,
  className,
  ...rest
}: ContactFormProps) {
  const formId = useId();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});

  const isLoading = loading || isSubmitting;

  const nameId = `${formId}-name`;
  const emailId = `${formId}-email`;
  const subjectId = `${formId}-subject`;
  const messageId = `${formId}-message`;
  const statusId = `${formId}-status`;

  const validate = (): boolean => {
    const errors: Partial<Record<FieldKey, string>> = {};
    if (!name.trim()) errors['name'] = 'Name is required.';
    if (!email.trim()) errors['email'] = 'Email is required.';
    if (!message.trim()) errors['message'] = 'Message is required.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await onSubmit({ name, email, subject: includeSubject ? subject : undefined, message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      aria-labelledby={`${formId}-title`}
      className={cn(
        'flex flex-col gap-skeed-spacing-6 w-full max-w-lg ' +
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

      {/* Live status region — politely announces both error and success */}
      <div id={statusId} aria-live="polite" aria-atomic="true" className="sr-only">
        {success && 'Your message has been sent successfully.'}
        {error && !success && `Error: ${error}`}
      </div>

      {/* Success state */}
      {success ? (
        <div
          role="status"
          className="flex flex-col items-center gap-skeed-spacing-4 py-skeed-spacing-8 text-center"
        >
          <span className="text-skeed-color-success-500">
            <CheckCircle size={48} />
          </span>
          <div className="flex flex-col gap-skeed-spacing-2">
            <p className="text-lg font-semibold font-skeed-body text-skeed-color-neutral-900">
              Message sent!
            </p>
            <p className="text-sm font-skeed-body text-skeed-color-neutral-500">
              Thank you for reaching out. We&apos;ll get back to you shortly.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Server error banner */}
          {error && (
            <div
              role="alert"
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
            {/* Name + Email row */}
            <div className="grid grid-cols-1 gap-skeed-spacing-4 sm:grid-cols-2">
              {/* Name */}
              <div className="flex flex-col gap-skeed-spacing-1">
                <label
                  htmlFor={nameId}
                  className="text-sm font-medium font-skeed-body text-skeed-color-neutral-900"
                >
                  Name
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
            </div>

            {/* Subject */}
            {includeSubject && (
              <div className="flex flex-col gap-skeed-spacing-1">
                <label
                  htmlFor={subjectId}
                  className="text-sm font-medium font-skeed-body text-skeed-color-neutral-900"
                >
                  Subject{' '}
                  <span className="font-normal text-skeed-color-neutral-400">(optional)</span>
                </label>
                <input
                  id={subjectId}
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="How can we help?"
                  disabled={isLoading}
                  className={INPUT_BASE}
                />
              </div>
            )}

            {/* Message */}
            <div className="flex flex-col gap-skeed-spacing-1">
              <label
                htmlFor={messageId}
                className="text-sm font-medium font-skeed-body text-skeed-color-neutral-900"
              >
                Message
              </label>
              <textarea
                id={messageId}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us more…"
                rows={5}
                disabled={isLoading}
                aria-invalid={!!fieldErrors['message']}
                aria-describedby={fieldErrors['message'] ? `${messageId}-error` : undefined}
                className={cn(INPUT_BASE, 'resize-y', fieldErrors['message'] && ERROR_INPUT)}
              />
              {fieldErrors['message'] && (
                <p
                  id={`${messageId}-error`}
                  role="alert"
                  className="text-sm font-skeed-body text-skeed-color-danger-600"
                >
                  {fieldErrors['message']}
                </p>
              )}
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
              {isLoading ? 'Sending…' : 'Send message'}
            </button>
          </form>
        </>
      )}
    </section>
  );
}
