'use client';

import { useId } from 'react';
import type * as React from 'react';

type FieldTone = 'default' | 'error';
type FieldSize = 'sm' | 'md' | 'lg';

type FieldMeta = {
  id?: string | undefined;
  label?: React.ReactNode | undefined;
  helpText?: React.ReactNode | undefined;
  error?: React.ReactNode | undefined;
  required?: boolean | undefined;
};

type ChoiceOption = {
  value: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
};

type ChoiceCardOption = ChoiceOption & {
  eyebrow?: React.ReactNode;
  icon?: React.ReactNode;
  meta?: React.ReactNode;
};

type ActionLink = {
  label: React.ReactNode;
  href: string;
};

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

function fieldIds(id: string, helpText?: React.ReactNode, error?: React.ReactNode) {
  const helpId = helpText ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(' ') || undefined;

  return { describedBy, errorId, helpId };
}

function safeDomId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '-');
}

function inputSize(size: FieldSize): string {
  if (size === 'sm') {
    return 'min-h-10 px-3 py-2 text-sm';
  }

  if (size === 'lg') {
    return 'min-h-14 px-4 py-3 text-base';
  }

  return 'min-h-12 px-3.5 py-2.5 text-sm';
}

function controlClass(tone: FieldTone, size: FieldSize, className?: string): string {
  return cx(
    'w-full rounded-skeed border bg-white text-skeed-fg shadow-sm transition placeholder:text-skeed-muted/70 disabled:cursor-not-allowed disabled:bg-skeed-bg disabled:text-skeed-muted',
    'focus-visible:skeed-focus-ring',
    inputSize(size),
    tone === 'error' ? 'border-red-500' : 'border-skeed-border focus:border-skeed-brand',
    className,
  );
}

function primaryButtonClass(className?: string): string {
  return cx(
    'skeed-press-soft inline-flex min-h-11 items-center justify-center rounded-skeed bg-skeed-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition focus-visible:skeed-focus-ring disabled:cursor-not-allowed disabled:opacity-60',
    className,
  );
}

export function SkeedField({
  id,
  label,
  helpText,
  error,
  required,
  children,
  className,
}: FieldMeta & {
  children: (field: {
    id: string;
    describedBy?: string | undefined;
    helpId?: string | undefined;
    errorId?: string | undefined;
    invalid: boolean;
  }) => React.ReactNode;
  className?: string | undefined;
}): React.ReactElement {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const { describedBy, errorId, helpId } = fieldIds(fieldId, helpText, error);
  const invalid = Boolean(error);

  return (
    <div className={cx('grid gap-2 text-skeed-fg', className)}>
      {label ? (
        <label className="text-sm font-semibold" htmlFor={fieldId}>
          {label}
          {required ? (
            <span className="ml-1 text-skeed-accent" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      ) : null}
      {children({ describedBy, errorId, helpId, id: fieldId, invalid })}
      {helpText ? (
        <p className="text-sm leading-5 text-skeed-muted" id={helpId}>
          {helpText}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm font-medium leading-5 text-red-600" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export type SkeedTextInputProps = FieldMeta &
  Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id' | 'className' | 'required' | 'size'> & {
    className?: string;
    inputClassName?: string;
    leadingSlot?: React.ReactNode;
    trailingSlot?: React.ReactNode;
    size?: FieldSize;
  };

export function SkeedTextInput({
  id,
  label,
  helpText,
  error,
  required,
  className,
  inputClassName,
  leadingSlot,
  trailingSlot,
  size = 'md',
  type = 'text',
  ...inputProps
}: SkeedTextInputProps): React.ReactElement {
  return (
    <SkeedField
      className={className}
      error={error}
      helpText={helpText}
      id={id}
      label={label}
      required={required}
    >
      {({ describedBy, id: fieldId, invalid }) => (
        <div className="relative">
          {leadingSlot ? (
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-skeed-muted">
              {leadingSlot}
            </div>
          ) : null}
          <input
            {...inputProps}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            className={controlClass(
              invalid ? 'error' : 'default',
              size,
              cx(Boolean(leadingSlot) && 'pl-10', Boolean(trailingSlot) && 'pr-10', inputClassName),
            )}
            id={fieldId}
            required={required}
            type={type}
          />
          {trailingSlot ? (
            <div className="absolute inset-y-0 right-3 flex items-center text-skeed-muted">
              {trailingSlot}
            </div>
          ) : null}
        </div>
      )}
    </SkeedField>
  );
}

export type SkeedTextAreaProps = FieldMeta &
  Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'className' | 'required'> & {
    className?: string;
    textareaClassName?: string;
    resize?: 'none' | 'vertical' | 'both';
  };

export function SkeedTextArea({
  id,
  label,
  helpText,
  error,
  required,
  className,
  textareaClassName,
  resize = 'vertical',
  rows = 4,
  ...textareaProps
}: SkeedTextAreaProps): React.ReactElement {
  const resizeClass = resize === 'none' ? 'resize-none' : resize === 'both' ? 'resize' : 'resize-y';

  return (
    <SkeedField
      className={className}
      error={error}
      helpText={helpText}
      id={id}
      label={label}
      required={required}
    >
      {({ describedBy, id: fieldId, invalid }) => (
        <textarea
          {...textareaProps}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          className={controlClass(
            invalid ? 'error' : 'default',
            'md',
            cx('leading-6', resizeClass, textareaClassName),
          )}
          id={fieldId}
          required={required}
          rows={rows}
        />
      )}
    </SkeedField>
  );
}

export type SkeedSelectProps = FieldMeta &
  Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'className' | 'required' | 'size'> & {
    className?: string;
    selectClassName?: string;
    options: Array<ChoiceOption | { value: string; label: React.ReactNode; disabled?: boolean }>;
    placeholder?: string;
    size?: FieldSize;
  };

export function SkeedSelect({
  id,
  label,
  helpText,
  error,
  required,
  className,
  selectClassName,
  options,
  placeholder,
  size = 'md',
  ...selectProps
}: SkeedSelectProps): React.ReactElement {
  return (
    <SkeedField
      className={className}
      error={error}
      helpText={helpText}
      id={id}
      label={label}
      required={required}
    >
      {({ describedBy, id: fieldId, invalid }) => (
        <select
          {...selectProps}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          className={controlClass(invalid ? 'error' : 'default', size, selectClassName)}
          id={fieldId}
          required={required}
        >
          {placeholder ? (
            <option disabled value="">
              {placeholder}
            </option>
          ) : null}
          {options.map((option) => (
            <option disabled={option.disabled} key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </SkeedField>
  );
}

export function SkeedCheckboxGroup({
  legend,
  helpText,
  error,
  options,
  value,
  onChange,
  name,
  columns = 1,
  className,
}: {
  legend: React.ReactNode;
  helpText?: React.ReactNode;
  error?: React.ReactNode;
  options: ChoiceOption[];
  value: string[];
  onChange: (value: string[]) => void;
  name?: string;
  columns?: 1 | 2 | 3;
  className?: string;
}): React.ReactElement {
  const id = useId();
  const { describedBy, errorId, helpId } = fieldIds(id, helpText, error);
  const gridClass = columns === 3 ? 'md:grid-cols-3' : columns === 2 ? 'md:grid-cols-2' : '';

  return (
    <fieldset
      aria-describedby={describedBy}
      aria-invalid={Boolean(error) || undefined}
      className={cx('grid gap-3 text-skeed-fg', className)}
    >
      <legend className="text-sm font-semibold">{legend}</legend>
      {helpText ? (
        <p className="text-sm leading-5 text-skeed-muted" id={helpId}>
          {helpText}
        </p>
      ) : null}
      <div className={cx('grid gap-2', gridClass)}>
        {options.map((option) => {
          const checked = value.includes(option.value);

          return (
            <label
              className={cx(
                'skeed-hover-lift flex cursor-pointer gap-3 rounded-skeed border bg-white p-3 transition',
                checked ? 'border-skeed-brand bg-skeed-brand/10' : 'border-skeed-border',
                option.disabled && 'cursor-not-allowed opacity-60',
              )}
              key={option.value}
            >
              <input
                checked={checked}
                className="mt-1 h-4 w-4 rounded border-skeed-border text-skeed-brand focus-visible:skeed-focus-ring"
                disabled={option.disabled}
                name={name}
                onChange={(event) => {
                  if (event.currentTarget.checked) {
                    onChange([...value, option.value]);
                    return;
                  }

                  onChange(value.filter((item) => item !== option.value));
                }}
                type="checkbox"
                value={option.value}
              />
              <span className="grid gap-1">
                <span className="text-sm font-medium">{option.label}</span>
                {option.description ? (
                  <span className="text-sm leading-5 text-skeed-muted">{option.description}</span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
      {error ? (
        <p className="text-sm font-medium leading-5 text-red-600" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

export function SkeedRadioGroup({
  legend,
  helpText,
  error,
  options,
  value,
  onChange,
  name,
  columns = 1,
  className,
}: {
  legend: React.ReactNode;
  helpText?: React.ReactNode;
  error?: React.ReactNode;
  options: ChoiceOption[];
  value?: string;
  onChange: (value: string) => void;
  name?: string;
  columns?: 1 | 2 | 3;
  className?: string;
}): React.ReactElement {
  const id = useId();
  const groupName = name ?? id;
  const { describedBy, errorId, helpId } = fieldIds(id, helpText, error);
  const gridClass = columns === 3 ? 'md:grid-cols-3' : columns === 2 ? 'md:grid-cols-2' : '';

  return (
    <fieldset
      aria-describedby={describedBy}
      aria-invalid={Boolean(error) || undefined}
      className={cx('grid gap-3 text-skeed-fg', className)}
    >
      <legend className="text-sm font-semibold">{legend}</legend>
      {helpText ? (
        <p className="text-sm leading-5 text-skeed-muted" id={helpId}>
          {helpText}
        </p>
      ) : null}
      <div className={cx('grid gap-2', gridClass)}>
        {options.map((option) => {
          const checked = value === option.value;

          return (
            <label
              className={cx(
                'skeed-hover-lift flex cursor-pointer gap-3 rounded-skeed border bg-white p-3 transition',
                checked ? 'border-skeed-brand bg-skeed-brand/10' : 'border-skeed-border',
                option.disabled && 'cursor-not-allowed opacity-60',
              )}
              key={option.value}
            >
              <input
                checked={checked}
                className="mt-1 h-4 w-4 border-skeed-border text-skeed-brand focus-visible:skeed-focus-ring"
                disabled={option.disabled}
                name={groupName}
                onChange={() => onChange(option.value)}
                type="radio"
                value={option.value}
              />
              <span className="grid gap-1">
                <span className="text-sm font-medium">{option.label}</span>
                {option.description ? (
                  <span className="text-sm leading-5 text-skeed-muted">{option.description}</span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
      {error ? (
        <p className="text-sm font-medium leading-5 text-red-600" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

export function SkeedChoiceCardGroup({
  legend,
  helpText,
  error,
  options,
  value,
  onChange,
  name,
  className,
}: {
  legend: React.ReactNode;
  helpText?: React.ReactNode;
  error?: React.ReactNode;
  options: ChoiceCardOption[];
  value?: string;
  onChange: (value: string) => void;
  name?: string;
  className?: string;
}): React.ReactElement {
  const id = useId();
  const groupName = name ?? id;
  const { describedBy, errorId, helpId } = fieldIds(id, helpText, error);

  return (
    <fieldset
      aria-describedby={describedBy}
      aria-invalid={Boolean(error) || undefined}
      className={cx('grid gap-3 text-skeed-fg', className)}
    >
      <legend className="text-sm font-semibold">{legend}</legend>
      {helpText ? (
        <p className="text-sm leading-5 text-skeed-muted" id={helpId}>
          {helpText}
        </p>
      ) : null}
      <div className="grid gap-3 md:grid-cols-3">
        {options.map((option) => {
          const checked = value === option.value;
          const optionId = `${id}-${safeDomId(option.value)}`;
          const labelId = `${optionId}-label`;
          const descriptionId = option.description ? `${optionId}-description` : undefined;
          const metaId = option.meta ? `${optionId}-meta` : undefined;
          const optionDescribedBy = [descriptionId, metaId].filter(Boolean).join(' ') || undefined;

          return (
            <label
              className={cx(
                'skeed-hover-lift relative flex min-h-36 cursor-pointer flex-col gap-3 rounded-skeed border bg-white p-4 shadow-sm transition focus-within:skeed-focus-ring',
                checked ? 'border-skeed-brand ring-2 ring-skeed-brand/20' : 'border-skeed-border',
                option.disabled && 'cursor-not-allowed opacity-60',
              )}
              key={option.value}
            >
              <input
                aria-describedby={optionDescribedBy}
                aria-labelledby={labelId}
                checked={checked}
                className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                disabled={option.disabled}
                name={groupName}
                onChange={() => onChange(option.value)}
                type="radio"
                value={option.value}
              />
              <span className="pointer-events-none flex items-start justify-between gap-3">
                <span className="grid gap-1">
                  {option.eyebrow ? (
                    <span className="text-xs font-semibold uppercase tracking-wide text-skeed-accent">
                      {option.eyebrow}
                    </span>
                  ) : null}
                  <span className="text-base font-semibold text-skeed-fg" id={labelId}>
                    {option.label}
                  </span>
                </span>
                {option.icon ? (
                  <span
                    aria-hidden="true"
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-skeed-brand/10 text-skeed-brand"
                  >
                    {option.icon}
                  </span>
                ) : null}
              </span>
              {option.description ? (
                <span
                  className="pointer-events-none text-sm leading-6 text-skeed-muted"
                  id={descriptionId}
                >
                  {option.description}
                </span>
              ) : null}
              {option.meta ? (
                <span className="pointer-events-none mt-auto text-sm font-medium" id={metaId}>
                  {option.meta}
                </span>
              ) : null}
            </label>
          );
        })}
      </div>
      {error ? (
        <p className="text-sm font-medium leading-5 text-red-600" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

export function SkeedSearchBar({
  label = 'Search',
  submitLabel = 'Search',
  className,
  inputClassName,
  actionSlot,
  ...inputProps
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className' | 'type'> & {
  label?: string;
  submitLabel?: React.ReactNode;
  className?: string;
  inputClassName?: string;
  actionSlot?: React.ReactNode;
}): React.ReactElement {
  const id = useId();

  return (
    <form className={cx('flex flex-col gap-2 sm:flex-row', className)}>
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      <input
        {...inputProps}
        className={controlClass('default', 'md', cx('sm:flex-1', inputClassName))}
        id={id}
        type="search"
      />
      <button className={primaryButtonClass()} type="submit">
        {submitLabel}
      </button>
      {actionSlot}
    </form>
  );
}

export function SkeedSignupPanel({
  title = 'Create your account',
  subtitle,
  submitLabel = 'Create account',
  footer,
  children,
  onSubmit,
  className,
}: {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  submitLabel?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  onSubmit?: React.FormEventHandler<HTMLFormElement>;
  className?: string;
}): React.ReactElement {
  return (
    <section
      className={cx('rounded-skeed border border-skeed-border bg-white p-6 shadow-sm', className)}
    >
      <div className="mb-6 grid gap-2">
        <h2 className="text-2xl font-bold text-skeed-fg">{title}</h2>
        {subtitle ? <p className="text-sm leading-6 text-skeed-muted">{subtitle}</p> : null}
      </div>
      <form className="grid gap-4" onSubmit={onSubmit}>
        {children ?? (
          <>
            <SkeedTextInput autoComplete="name" label="Name" name="name" required />
            <SkeedTextInput autoComplete="email" label="Email" name="email" required type="email" />
            <SkeedTextInput
              autoComplete="new-password"
              helpText="Use at least 8 characters."
              label="Password"
              minLength={8}
              name="password"
              required
              type="password"
            />
          </>
        )}
        <button className={primaryButtonClass('w-full')} type="submit">
          {submitLabel}
        </button>
      </form>
      {footer ? <div className="mt-5 text-center text-sm text-skeed-muted">{footer}</div> : null}
    </section>
  );
}

export function SkeedLoginPanel({
  title = 'Welcome back',
  subtitle,
  submitLabel = 'Sign in',
  forgotPassword,
  footer,
  children,
  onSubmit,
  className,
}: {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  submitLabel?: React.ReactNode;
  forgotPassword?: ActionLink;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  onSubmit?: React.FormEventHandler<HTMLFormElement>;
  className?: string;
}): React.ReactElement {
  return (
    <section
      className={cx('rounded-skeed border border-skeed-border bg-white p-6 shadow-sm', className)}
    >
      <div className="mb-6 grid gap-2">
        <h2 className="text-2xl font-bold text-skeed-fg">{title}</h2>
        {subtitle ? <p className="text-sm leading-6 text-skeed-muted">{subtitle}</p> : null}
      </div>
      <form className="grid gap-4" onSubmit={onSubmit}>
        {children ?? (
          <>
            <SkeedTextInput autoComplete="email" label="Email" name="email" required type="email" />
            <SkeedTextInput
              autoComplete="current-password"
              label="Password"
              name="password"
              required
              type="password"
            />
          </>
        )}
        {forgotPassword ? (
          <a
            className="justify-self-end text-sm font-semibold text-skeed-brand focus-visible:skeed-focus-ring"
            href={forgotPassword.href}
          >
            {forgotPassword.label}
          </a>
        ) : null}
        <button className={primaryButtonClass('w-full')} type="submit">
          {submitLabel}
        </button>
      </form>
      {footer ? <div className="mt-5 text-center text-sm text-skeed-muted">{footer}</div> : null}
    </section>
  );
}

export function SkeedContactPanel({
  title = 'Get in touch',
  subtitle,
  submitLabel = 'Send message',
  aside,
  children,
  onSubmit,
  className,
}: {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  submitLabel?: React.ReactNode;
  aside?: React.ReactNode;
  children?: React.ReactNode;
  onSubmit?: React.FormEventHandler<HTMLFormElement>;
  className?: string;
}): React.ReactElement {
  return (
    <section
      className={cx(
        'grid gap-6 rounded-skeed border border-skeed-border bg-white p-6 shadow-sm md:grid-cols-[.8fr_1.2fr]',
        className,
      )}
    >
      <div className="grid content-start gap-3">
        <h2 className="text-2xl font-bold text-skeed-fg">{title}</h2>
        {subtitle ? <p className="text-sm leading-6 text-skeed-muted">{subtitle}</p> : null}
        {aside ? <div className="mt-2 text-sm leading-6 text-skeed-muted">{aside}</div> : null}
      </div>
      <form className="grid gap-4" onSubmit={onSubmit}>
        {children ?? (
          <>
            <SkeedTextInput autoComplete="name" label="Name" name="name" required />
            <SkeedTextInput autoComplete="email" label="Email" name="email" required type="email" />
            <SkeedTextArea label="Message" name="message" required rows={5} />
          </>
        )}
        <button className={primaryButtonClass('justify-self-start')} type="submit">
          {submitLabel}
        </button>
      </form>
    </section>
  );
}

export function SkeedFilterBar({
  label = 'Filters',
  search,
  children,
  actions,
  className,
}: {
  label?: React.ReactNode;
  search?: React.ReactElement;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}): React.ReactElement {
  return (
    <section
      aria-label={typeof label === 'string' ? label : undefined}
      className={cx(
        'flex flex-col gap-3 rounded-skeed border border-skeed-border bg-white p-3 shadow-sm md:flex-row md:items-center',
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-3 md:flex-row md:items-center">
        {search ? <div className="min-w-0 md:w-72">{search}</div> : null}
        {children ? <div className="flex flex-wrap gap-2">{children}</div> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </section>
  );
}
