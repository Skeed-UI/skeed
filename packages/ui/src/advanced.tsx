import { useId } from 'react';
import type * as React from 'react';

type WithClassName = {
  className?: string;
};

type ActionItem = {
  label: React.ReactNode;
  href?: string;
  onClick?: () => void;
  current?: boolean;
  disabled?: boolean;
};

type NavItem = {
  label: React.ReactNode;
  href: string;
  current?: boolean;
};

type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

function toneClasses(tone: Tone): string {
  const tones: Record<Tone, string> = {
    neutral: 'border-skeed-border bg-white text-skeed-fg',
    brand: 'border-skeed-color-brand-200 bg-skeed-color-brand-50 text-skeed-color-brand-900',
    success:
      'border-skeed-color-success-200 bg-skeed-color-success-50 text-skeed-color-success-900',
    warning:
      'border-skeed-color-warning-200 bg-skeed-color-warning-50 text-skeed-color-warning-900',
    danger: 'border-skeed-color-danger-200 bg-skeed-color-danger-50 text-skeed-color-danger-900',
  };
  return tones[tone];
}

function actionElement(
  action: ActionItem,
  className: string,
  options: { role?: string } = {},
): React.ReactElement {
  const disabledAnchorProps = action.disabled
    ? { 'aria-disabled': true, tabIndex: -1 }
    : { 'aria-disabled': undefined, tabIndex: undefined };

  if (action.href) {
    return (
      <a
        {...disabledAnchorProps}
        aria-current={action.current ? 'page' : undefined}
        className={className}
        href={action.href}
        key={String(action.label)}
        role={options.role}
      >
        {action.label}
      </a>
    );
  }

  return (
    <button
      className={className}
      disabled={action.disabled}
      key={String(action.label)}
      onClick={action.onClick}
      role={options.role}
      type="button"
    >
      {action.label}
    </button>
  );
}

function commandElement(
  command: ActionItem & { shortcut?: string; description?: React.ReactNode },
): React.ReactElement {
  const content = (
    <>
      <span className="min-w-0">
        <span className="block font-semibold text-skeed-fg">{command.label}</span>
        {command.description ? (
          <span className="block text-xs text-skeed-muted">{command.description}</span>
        ) : null}
      </span>
      {command.shortcut ? (
        <kbd className="shrink-0 rounded border border-skeed-border bg-skeed-bg px-1.5 py-0.5 text-xs text-skeed-muted">
          {command.shortcut}
        </kbd>
      ) : null}
    </>
  );
  const className = cx(
    'flex w-full items-center justify-between gap-3 rounded-skeed px-3 py-2 text-left text-sm transition focus-visible:skeed-focus-ring',
    command.disabled
      ? 'pointer-events-none opacity-50'
      : 'text-skeed-fg hover:bg-skeed-color-neutral-100',
  );

  if (command.href) {
    return (
      <a
        aria-disabled={command.disabled ? true : undefined}
        className={className}
        href={command.href}
        tabIndex={command.disabled ? -1 : undefined}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      className={className}
      disabled={command.disabled}
      onClick={command.onClick}
      type="button"
    >
      {content}
    </button>
  );
}

export type SkeedHeaderProps = WithClassName & {
  brand: React.ReactNode;
  nav?: NavItem[];
  actions?: React.ReactNode;
};

export function SkeedHeader({
  actions,
  brand,
  className,
  nav = [],
}: SkeedHeaderProps): React.ReactElement {
  return (
    <header className={cx('border-b border-skeed-border bg-white/95 px-6 py-4', className)}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
        <div className="min-w-0 text-base font-bold text-skeed-fg">{brand}</div>
        {nav.length > 0 ? (
          <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
            {nav.map((item) => (
              <a
                aria-current={item.current ? 'page' : undefined}
                className={cx(
                  'rounded-skeed px-3 py-2 text-sm font-medium text-skeed-muted transition hover:bg-skeed-color-neutral-100 hover:text-skeed-fg focus-visible:skeed-focus-ring',
                  item.current && 'bg-skeed-color-brand-50 text-skeed-color-brand-700',
                )}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </a>
            ))}
          </nav>
        ) : null}
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}

export type SkeedNavbarProps = WithClassName & {
  items: NavItem[];
  ariaLabel?: string;
};

export function SkeedNavbar({
  ariaLabel = 'Section navigation',
  className,
  items,
}: SkeedNavbarProps): React.ReactElement {
  return (
    <nav
      aria-label={ariaLabel}
      className={cx(
        'flex w-full gap-1 overflow-x-auto rounded-skeed border border-skeed-border bg-white p-1',
        className,
      )}
    >
      {items.map((item) => (
        <a
          aria-current={item.current ? 'page' : undefined}
          className={cx(
            'min-h-10 shrink-0 rounded-[calc(var(--skeed-radius)-2px)] px-3 py-2 text-sm font-semibold text-skeed-muted transition hover:bg-skeed-color-neutral-100 focus-visible:skeed-focus-ring',
            item.current && 'bg-skeed-brand text-white hover:bg-skeed-brand',
          )}
          href={item.href}
          key={item.href}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}

export type SkeedSidebarProps = WithClassName & {
  title?: React.ReactNode;
  items: NavItem[];
  footer?: React.ReactNode;
};

export function SkeedSidebar({
  className,
  footer,
  items,
  title,
}: SkeedSidebarProps): React.ReactElement {
  return (
    <aside className={cx('w-full border-skeed-border bg-white p-4 md:w-72 md:border-r', className)}>
      {title ? <div className="mb-4 text-sm font-bold text-skeed-fg">{title}</div> : null}
      <nav aria-label="Sidebar" className="grid gap-1">
        {items.map((item) => (
          <a
            aria-current={item.current ? 'page' : undefined}
            className={cx(
              'rounded-skeed px-3 py-2 text-sm font-medium text-skeed-muted transition hover:bg-skeed-color-neutral-100 hover:text-skeed-fg focus-visible:skeed-focus-ring',
              item.current && 'bg-skeed-color-brand-50 text-skeed-color-brand-700',
            )}
            href={item.href}
            key={item.href}
          >
            {item.label}
          </a>
        ))}
      </nav>
      {footer ? <div className="mt-6 border-t border-skeed-border pt-4">{footer}</div> : null}
    </aside>
  );
}

export type SkeedFooterProps = WithClassName & {
  brand?: React.ReactNode;
  links?: NavItem[];
  meta?: React.ReactNode;
};

export function SkeedFooter({
  brand,
  className,
  links = [],
  meta,
}: SkeedFooterProps): React.ReactElement {
  return (
    <footer className={cx('border-t border-skeed-border bg-white px-6 py-8', className)}>
      <div className="mx-auto flex max-w-7xl flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          {brand ? <div className="font-bold text-skeed-fg">{brand}</div> : null}
          {meta ? <div className="mt-1 text-sm text-skeed-muted">{meta}</div> : null}
        </div>
        {links.length > 0 ? (
          <nav aria-label="Footer" className="flex flex-wrap gap-3">
            {links.map((link) => (
              <a
                className="text-sm font-medium text-skeed-muted transition hover:text-skeed-fg focus-visible:skeed-focus-ring"
                href={link.href}
                key={link.href}
              >
                {link.label}
              </a>
            ))}
          </nav>
        ) : null}
      </div>
    </footer>
  );
}

export type SkeedBannerProps = WithClassName & {
  title: React.ReactNode;
  body?: React.ReactNode;
  action?: React.ReactNode;
  tone?: Tone;
};

export function SkeedBanner({
  action,
  body,
  className,
  title,
  tone = 'brand',
}: SkeedBannerProps): React.ReactElement {
  return (
    <section
      className={cx(
        'rounded-skeed border px-4 py-3 shadow-sm md:flex md:items-center md:justify-between md:gap-6',
        toneClasses(tone),
        className,
      )}
    >
      <div>
        <p className="text-sm font-bold">{title}</p>
        {body ? <p className="mt-1 text-sm opacity-80">{body}</p> : null}
      </div>
      {action ? <div className="mt-3 shrink-0 md:mt-0">{action}</div> : null}
    </section>
  );
}

export type SkeedCalloutProps = WithClassName & {
  title?: React.ReactNode;
  children: React.ReactNode;
  icon?: React.ReactNode;
  tone?: Tone;
};

export function SkeedCallout({
  children,
  className,
  icon,
  title,
  tone = 'neutral',
}: SkeedCalloutProps): React.ReactElement {
  return (
    <aside className={cx('rounded-skeed border p-4', toneClasses(tone), className)}>
      <div className="flex gap-3">
        {icon ? <div className="mt-0.5 text-skeed-brand">{icon}</div> : null}
        <div>
          {title ? <p className="font-semibold">{title}</p> : null}
          <div className={cx('text-sm leading-6', Boolean(title) && 'mt-1')}>{children}</div>
        </div>
      </div>
    </aside>
  );
}

export type SkeedArticleProps = WithClassName & {
  title: React.ReactNode;
  eyebrow?: React.ReactNode;
  byline?: React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
};

export function SkeedArticle({
  actions,
  byline,
  children,
  className,
  eyebrow,
  title,
}: SkeedArticleProps): React.ReactElement {
  return (
    <article className={cx('mx-auto max-w-3xl px-6 py-12 text-skeed-fg', className)}>
      {eyebrow ? (
        <p className="mb-3 text-sm font-semibold uppercase text-skeed-brand">{eyebrow}</p>
      ) : null}
      <h1 className="text-3xl font-bold leading-tight sm:text-4xl">{title}</h1>
      {byline ? <div className="mt-3 text-sm text-skeed-muted">{byline}</div> : null}
      <div className="mt-8 space-y-5 text-base leading-7 text-skeed-muted">{children}</div>
      {actions ? <div className="mt-8 flex flex-wrap gap-3">{actions}</div> : null}
    </article>
  );
}

export type SkeedTestimonialProps = WithClassName & {
  quote: React.ReactNode;
  author: string;
  role?: string;
  avatar?: React.ReactNode;
};

export function SkeedTestimonial({
  author,
  avatar,
  className,
  quote,
  role,
}: SkeedTestimonialProps): React.ReactElement {
  return (
    <figure
      className={cx('rounded-skeed border border-skeed-border bg-white p-6 shadow-sm', className)}
    >
      <blockquote className="text-lg font-medium leading-8 text-skeed-fg">"{quote}"</blockquote>
      <figcaption className="mt-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-skeed-color-brand-50 text-sm font-bold text-skeed-brand">
          {avatar ?? author.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-semibold text-skeed-fg">{author}</p>
          {role ? <p className="text-sm text-skeed-muted">{role}</p> : null}
        </div>
      </figcaption>
    </figure>
  );
}

export type SkeedOnboardingStepProps = WithClassName & {
  step: number;
  total: number;
  title: React.ReactNode;
  body?: React.ReactNode;
  children?: React.ReactNode;
};

export function SkeedOnboardingStep({
  body,
  children,
  className,
  step,
  title,
  total,
}: SkeedOnboardingStepProps): React.ReactElement {
  const progress = Math.max(0, Math.min(100, Math.round((step / Math.max(total, 1)) * 100)));
  return (
    <section
      className={cx('rounded-skeed border border-skeed-border bg-white p-6 shadow-sm', className)}
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-skeed-brand">
          Step {step} of {total}
        </p>
        <div className="h-2 w-28 overflow-hidden rounded-full bg-skeed-color-neutral-100">
          <div className="h-full rounded-full bg-skeed-brand" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-skeed-fg">{title}</h2>
      {body ? <p className="mt-3 text-sm leading-6 text-skeed-muted">{body}</p> : null}
      {children ? <div className="mt-6">{children}</div> : null}
    </section>
  );
}

export type SkeedPaginationProps = WithClassName & {
  pages: Array<{ label: React.ReactNode; href: string; current?: boolean }>;
  previous?: string;
  next?: string;
};

export function SkeedPagination({
  className,
  next,
  pages,
  previous,
}: SkeedPaginationProps): React.ReactElement {
  return (
    <nav aria-label="Pagination" className={cx('flex flex-wrap items-center gap-2', className)}>
      {previous ? (
        <a
          className="rounded-skeed border border-skeed-border px-3 py-2 text-sm font-semibold focus-visible:skeed-focus-ring"
          href={previous}
        >
          Previous
        </a>
      ) : null}
      {pages.map((page) => (
        <a
          aria-current={page.current ? 'page' : undefined}
          className={cx(
            'flex h-10 min-w-10 items-center justify-center rounded-skeed border border-skeed-border px-3 text-sm font-semibold transition focus-visible:skeed-focus-ring',
            page.current
              ? 'bg-skeed-brand text-white'
              : 'bg-white text-skeed-muted hover:text-skeed-fg',
          )}
          href={page.href}
          key={page.href}
        >
          {page.label}
        </a>
      ))}
      {next ? (
        <a
          className="rounded-skeed border border-skeed-border px-3 py-2 text-sm font-semibold focus-visible:skeed-focus-ring"
          href={next}
        >
          Next
        </a>
      ) : null}
    </nav>
  );
}

export type SkeedModalProps = WithClassName & {
  open?: boolean;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  closeLabel?: string;
  onClose?: () => void;
};

export function SkeedModal({
  children,
  className,
  closeLabel = 'Close modal',
  description,
  footer,
  onClose,
  open = true,
  title,
}: SkeedModalProps): React.ReactElement | null {
  const titleId = useId();
  const descriptionId = useId();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4" role="presentation">
      <dialog
        aria-describedby={description ? descriptionId : undefined}
        aria-labelledby={titleId}
        aria-modal="true"
        className={cx(
          'skeed-enter-slide-up relative w-full max-w-lg rounded-skeed bg-white p-6 shadow-xl',
          className,
        )}
        onCancel={(event) => {
          if (!onClose) return;
          event.preventDefault();
          onClose();
        }}
        open
      >
        {onClose ? (
          <button
            aria-label={closeLabel}
            className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-skeed text-skeed-muted transition hover:bg-skeed-color-neutral-100 hover:text-skeed-fg focus-visible:skeed-focus-ring"
            onClick={onClose}
            type="button"
          >
            <span aria-hidden="true">x</span>
          </button>
        ) : null}
        <h2 className="text-xl font-bold text-skeed-fg" id={titleId}>
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-skeed-muted" id={descriptionId}>
            {description}
          </p>
        ) : null}
        {children ? <div className="mt-5">{children}</div> : null}
        {footer ? <div className="mt-6 flex justify-end gap-3">{footer}</div> : null}
      </dialog>
    </div>
  );
}

export type SkeedDrawerProps = WithClassName & {
  open?: boolean;
  side?: 'left' | 'right';
  title: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
};

export function SkeedDrawer({
  children,
  className,
  footer,
  open = true,
  side = 'right',
  title,
}: SkeedDrawerProps): React.ReactElement | null {
  if (!open) return null;
  return (
    <aside
      aria-label={typeof title === 'string' ? title : undefined}
      className={cx(
        'fixed inset-y-0 z-50 flex w-full max-w-md flex-col border-skeed-border bg-white p-5 shadow-xl',
        side === 'left' ? 'left-0 border-r' : 'right-0 border-l',
        className,
      )}
    >
      <h2 className="text-lg font-bold text-skeed-fg">{title}</h2>
      {children ? <div className="mt-5 flex-1 overflow-auto">{children}</div> : null}
      {footer ? <div className="mt-5 border-t border-skeed-border pt-4">{footer}</div> : null}
    </aside>
  );
}

export type SkeedPopoverProps = WithClassName & {
  title?: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
};

export function SkeedPopover({
  align = 'left',
  children,
  className,
  title,
}: SkeedPopoverProps): React.ReactElement {
  return (
    <aside
      className={cx(
        'skeed-enter-fade w-72 rounded-skeed border border-skeed-border bg-white p-4 shadow-lg',
        align === 'right' && 'ml-auto',
        className,
      )}
    >
      {title ? <p className="mb-2 text-sm font-bold text-skeed-fg">{title}</p> : null}
      <div className="text-sm leading-6 text-skeed-muted">{children}</div>
    </aside>
  );
}

export type SkeedTooltipProps = WithClassName & {
  children: React.ReactNode;
};

export function SkeedTooltip({ children, className }: SkeedTooltipProps): React.ReactElement {
  return (
    <span
      className={cx(
        'rounded-skeed bg-skeed-fg px-2 py-1 text-xs font-medium text-white shadow-sm',
        className,
      )}
      role="tooltip"
    >
      {children}
    </span>
  );
}

export type SkeedDropdownMenuProps = WithClassName & {
  label?: React.ReactNode;
  items: ActionItem[];
};

export function SkeedDropdownMenu({
  className,
  items,
  label,
}: SkeedDropdownMenuProps): React.ReactElement {
  const labelId = useId();

  return (
    <div
      aria-labelledby={label ? labelId : undefined}
      className={cx(
        'w-60 rounded-skeed border border-skeed-border bg-white p-1 shadow-lg',
        className,
      )}
      role="menu"
    >
      {label ? (
        <p className="px-3 py-2 text-xs font-semibold uppercase text-skeed-muted" id={labelId}>
          {label}
        </p>
      ) : null}
      {items.map((item) =>
        actionElement(
          item,
          cx(
            'flex w-full items-center rounded-[calc(var(--skeed-radius)-2px)] px-3 py-2 text-left text-sm font-medium transition focus-visible:skeed-focus-ring',
            item.current
              ? 'bg-skeed-color-brand-50 text-skeed-color-brand-700'
              : 'text-skeed-fg hover:bg-skeed-color-neutral-100',
            item.disabled && 'pointer-events-none opacity-50',
          ),
          { role: 'menuitem' },
        ),
      )}
    </div>
  );
}

export type SkeedCommandPaletteProps = WithClassName & {
  title?: React.ReactNode;
  query?: string;
  placeholder?: string;
  commands: Array<ActionItem & { shortcut?: string; description?: React.ReactNode }>;
};

export function SkeedCommandPalette({
  className,
  commands,
  placeholder = 'Search commands...',
  query = '',
  title = 'Command palette',
}: SkeedCommandPaletteProps): React.ReactElement {
  return (
    <section
      className={cx('rounded-skeed border border-skeed-border bg-white p-3 shadow-xl', className)}
    >
      <h2 className="sr-only">{title}</h2>
      <input
        aria-label={typeof title === 'string' ? title : 'Command palette'}
        className="mb-2 w-full rounded-skeed border border-skeed-border bg-skeed-bg px-3 py-2 text-sm outline-none focus-visible:skeed-focus-ring"
        placeholder={placeholder}
        readOnly
        value={query}
      />
      <ul className="grid gap-1">
        {commands.map((command) => (
          <li key={String(command.label)}>{commandElement(command)}</li>
        ))}
      </ul>
    </section>
  );
}

export type SkeedFileUploaderProps = WithClassName & {
  title?: React.ReactNode;
  description?: React.ReactNode;
  accept?: string;
  disabled?: boolean;
  multiple?: boolean;
  name?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
};

export function SkeedFileUploader({
  accept,
  className,
  description = 'Drop files here or choose from your device.',
  disabled,
  multiple = false,
  name,
  onChange,
  title = 'Upload files',
}: SkeedFileUploaderProps): React.ReactElement {
  return (
    <label
      className={cx(
        'skeed-hover-lift flex cursor-pointer flex-col items-center justify-center rounded-skeed border border-dashed border-skeed-border bg-white px-6 py-10 text-center focus-within:skeed-focus-ring',
        disabled && 'cursor-not-allowed opacity-60',
        className,
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-skeed-color-brand-50 text-skeed-brand">
        +
      </span>
      <span className="mt-3 text-sm font-bold text-skeed-fg">{title}</span>
      <span className="mt-1 max-w-sm text-sm leading-6 text-skeed-muted">{description}</span>
      <input
        accept={accept}
        className="sr-only"
        disabled={disabled}
        multiple={multiple}
        name={name}
        onChange={onChange}
        type="file"
      />
    </label>
  );
}

export type SkeedSwitchProps = WithClassName & {
  checked?: boolean;
  defaultChecked?: boolean;
  label: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
  name?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  value?: string;
};

export function SkeedSwitch({
  checked,
  className,
  defaultChecked = false,
  description,
  disabled,
  label,
  name,
  onChange,
  value,
}: SkeedSwitchProps): React.ReactElement {
  const inputProps =
    checked === undefined
      ? { defaultChecked }
      : { checked, readOnly: onChange === undefined ? true : undefined };

  return (
    <label
      className={cx(
        'flex cursor-pointer items-start justify-between gap-4 rounded-skeed border border-skeed-border bg-white p-4',
        disabled && 'cursor-not-allowed opacity-60',
        className,
      )}
    >
      <span>
        <span className="block text-sm font-semibold text-skeed-fg">{label}</span>
        {description ? (
          <span className="mt-1 block text-sm text-skeed-muted">{description}</span>
        ) : null}
      </span>
      <span className="relative mt-0.5 inline-flex">
        <input
          {...inputProps}
          className="peer absolute -inset-3 z-10 cursor-pointer opacity-0 disabled:cursor-not-allowed"
          disabled={disabled}
          name={name}
          onChange={onChange}
          type="checkbox"
          value={value}
        />
        <span className="pointer-events-none h-6 w-11 rounded-full bg-skeed-color-neutral-200 transition peer-checked:bg-skeed-brand peer-focus-visible:skeed-focus-ring" />
        <span className="pointer-events-none absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

export type SkeedSliderProps = WithClassName & {
  label: React.ReactNode;
  value?: number;
  defaultValue?: number;
  disabled?: boolean;
  min?: number;
  max?: number;
  name?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  step?: number;
};

export function SkeedSlider({
  className,
  defaultValue = 50,
  disabled,
  label,
  max = 100,
  min = 0,
  name,
  onChange,
  step,
  value,
}: SkeedSliderProps): React.ReactElement {
  const displayValue = value ?? defaultValue;
  const inputProps =
    value === undefined
      ? { defaultValue }
      : { readOnly: onChange === undefined ? true : undefined, value };

  return (
    <label
      className={cx(
        'grid gap-2 rounded-skeed border border-skeed-border bg-white p-4',
        disabled && 'opacity-60',
        className,
      )}
    >
      <span className="flex justify-between gap-3 text-sm font-semibold text-skeed-fg">
        <span>{label}</span>
        <span>{displayValue}</span>
      </span>
      <input
        {...inputProps}
        className="accent-skeed-brand focus-visible:skeed-focus-ring"
        disabled={disabled}
        max={max}
        min={min}
        name={name}
        onChange={onChange}
        step={step}
        type="range"
      />
    </label>
  );
}

export function SkeedSpinner({ className }: WithClassName): React.ReactElement {
  return (
    <span
      aria-label="Loading"
      className={cx(
        'inline-block h-5 w-5 animate-spin rounded-full border-2 border-skeed-border border-t-skeed-brand motion-reduce:animate-none',
        className,
      )}
      role="status"
    />
  );
}

export function SkeedKbd({
  children,
  className,
}: WithClassName & { children: React.ReactNode }): React.ReactElement {
  return (
    <kbd
      className={cx(
        'rounded border border-skeed-border bg-skeed-bg px-1.5 py-0.5 text-xs font-semibold text-skeed-muted shadow-sm',
        className,
      )}
    >
      {children}
    </kbd>
  );
}

export function SkeedLabel({
  children,
  className,
  htmlFor,
}: WithClassName & { children: React.ReactNode; htmlFor?: string }): React.ReactElement {
  return (
    <label className={cx('text-sm font-semibold text-skeed-fg', className)} htmlFor={htmlFor}>
      {children}
    </label>
  );
}

export function SkeedLink({
  children,
  className,
  href,
}: WithClassName & { children: React.ReactNode; href: string }): React.ReactElement {
  return (
    <a
      className={cx(
        'font-semibold text-skeed-brand underline-offset-4 hover:underline focus-visible:skeed-focus-ring',
        className,
      )}
      href={href}
    >
      {children}
    </a>
  );
}

export type SkeedTagProps = WithClassName & {
  children: React.ReactNode;
  tone?: Tone;
};

export function SkeedTag({
  children,
  className,
  tone = 'neutral',
}: SkeedTagProps): React.ReactElement {
  return (
    <span
      className={cx(
        'inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold',
        toneClasses(tone),
        className,
      )}
    >
      {children}
    </span>
  );
}

export type SkeedSpeechBubbleProps = WithClassName & {
  children: React.ReactNode;
  speaker?: React.ReactNode;
  side?: 'left' | 'right';
};

export function SkeedSpeechBubble({
  children,
  className,
  side = 'left',
  speaker,
}: SkeedSpeechBubbleProps): React.ReactElement {
  return (
    <figure className={cx('max-w-xl', side === 'right' && 'ml-auto text-right', className)}>
      {speaker ? (
        <figcaption className="mb-2 text-xs font-semibold text-skeed-muted">{speaker}</figcaption>
      ) : null}
      <blockquote
        className={cx(
          'rounded-skeed border border-skeed-border bg-white px-4 py-3 text-sm leading-6 text-skeed-fg shadow-sm',
          side === 'left' ? 'rounded-tl-sm' : 'rounded-tr-sm',
        )}
      >
        {children}
      </blockquote>
    </figure>
  );
}

export type SkeedTreeNode = {
  id: string;
  label: React.ReactNode;
  children?: SkeedTreeNode[];
};

export type SkeedTreeProps = WithClassName & {
  nodes: SkeedTreeNode[];
};

export function SkeedTree({ className, nodes }: SkeedTreeProps): React.ReactElement {
  return (
    <div className={cx('rounded-skeed border border-skeed-border bg-white p-3', className)}>
      {nodes.map((node) => (
        <TreeNode key={node.id} node={node} />
      ))}
    </div>
  );
}

function TreeNode({ node }: { node: SkeedTreeNode }): React.ReactElement {
  return (
    <details className="group" open={Boolean(node.children?.length)}>
      <summary className="cursor-pointer rounded-skeed px-2 py-1.5 text-sm font-medium text-skeed-fg marker:text-skeed-muted hover:bg-skeed-color-neutral-100 focus-visible:skeed-focus-ring">
        {node.label}
      </summary>
      {node.children?.length ? (
        <div className="ml-4 border-l border-skeed-border pl-2">
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} />
          ))}
        </div>
      ) : null}
    </details>
  );
}
