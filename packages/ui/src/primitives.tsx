import { useId } from 'react';
import type * as React from 'react';

type Intent = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';
type Size = 'sm' | 'md' | 'lg';

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

function safeDomId(value: string): string {
  return value.replace(/[^A-Za-z0-9_-]/g, '-');
}

const intentDotClasses: Record<Intent, string> = {
  neutral: 'bg-skeed-color-neutral-400',
  brand: 'bg-skeed-brand',
  success: 'bg-skeed-success',
  warning: 'bg-skeed-color-warning-500',
  danger: 'bg-skeed-danger',
};

const badgeClasses: Record<Intent, string> = {
  neutral: 'border-skeed-border bg-skeed-color-neutral-100 text-skeed-muted',
  brand: 'border-skeed-color-brand-200 bg-skeed-color-brand-50 text-skeed-color-brand-700',
  success: 'border-skeed-color-success-200 bg-skeed-color-success-50 text-skeed-color-success-700',
  warning: 'border-skeed-color-warning-200 bg-skeed-color-warning-50 text-skeed-color-warning-800',
  danger: 'border-skeed-color-danger-200 bg-skeed-color-danger-50 text-skeed-color-danger-700',
};

const alertClasses: Record<Intent, string> = {
  neutral: 'border-skeed-border bg-white text-skeed-fg',
  brand: 'border-skeed-color-brand-200 bg-skeed-color-brand-50 text-skeed-color-brand-900',
  success: 'skeed-state-success',
  warning: 'border-skeed-color-warning-200 bg-skeed-color-warning-50 text-skeed-color-warning-900',
  danger: 'skeed-state-error',
};

type SkeedButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const buttonVariantClasses: Record<SkeedButtonVariant, string> = {
  primary:
    'skeed-sheen bg-skeed-brand text-white shadow-sm hover:bg-skeed-color-brand-600 hover:shadow-[var(--skeed-cta-shadow-hover)]',
  secondary:
    'skeed-sheen-soft border border-skeed-border bg-white text-skeed-fg shadow-sm hover:border-skeed-color-brand-300 hover:bg-skeed-color-neutral-50 hover:shadow-[0_10px_22px_rgba(15,23,42,.08)]',
  ghost: 'skeed-sheen-soft bg-transparent text-skeed-fg hover:bg-skeed-color-neutral-100',
  danger:
    'skeed-sheen bg-skeed-danger text-white shadow-sm hover:bg-skeed-color-danger-600 hover:shadow-[0_12px_26px_rgba(220,38,38,.18)]',
};

const buttonSizeClasses: Record<Size, string> = {
  sm: 'h-8 gap-1.5 px-3 text-xs',
  md: 'h-10 gap-2 px-4 text-sm',
  lg: 'h-12 gap-2.5 px-5 text-base',
};

type ButtonSharedProps = {
  children: React.ReactNode;
  className?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  size?: Size;
  variant?: SkeedButtonVariant;
};

type SkeedButtonAsButtonProps = ButtonSharedProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'> & {
    href?: never;
  };

type SkeedButtonAsAnchorProps = ButtonSharedProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'children' | 'className'> & {
    href: string;
  };

export type SkeedButtonProps = SkeedButtonAsButtonProps | SkeedButtonAsAnchorProps;

function isAnchorButtonProps(props: SkeedButtonProps): props is SkeedButtonAsAnchorProps {
  return typeof props.href === 'string';
}

export function SkeedButton(props: SkeedButtonProps): React.ReactElement {
  if (isAnchorButtonProps(props)) {
    const {
      children,
      className,
      href,
      leadingIcon,
      size = 'md',
      trailingIcon,
      variant = 'primary',
      ...anchorProps
    } = props;
    const classes = cx(
      'skeed-press-soft inline-flex shrink-0 items-center justify-center rounded-skeed font-semibold transition focus-visible:skeed-focus-ring',
      buttonSizeClasses[size],
      buttonVariantClasses[variant],
      className,
    );
    return (
      <a {...anchorProps} className={classes} href={href}>
        {leadingIcon ? (
          <span className="inline-flex h-4 w-4 items-center justify-center">{leadingIcon}</span>
        ) : null}
        <span>{children}</span>
        {trailingIcon ? (
          <span className="inline-flex h-4 w-4 items-center justify-center">{trailingIcon}</span>
        ) : null}
      </a>
    );
  }

  const {
    children,
    className,
    leadingIcon,
    size = 'md',
    trailingIcon,
    type = 'button',
    variant = 'primary',
    ...buttonProps
  } = props;
  const classes = cx(
    'skeed-press-soft inline-flex shrink-0 items-center justify-center rounded-skeed font-semibold transition focus-visible:skeed-focus-ring disabled:pointer-events-none disabled:opacity-50',
    buttonSizeClasses[size],
    buttonVariantClasses[variant],
    className,
  );
  return (
    <button {...buttonProps} className={classes} type={type}>
      {leadingIcon ? (
        <span className="inline-flex h-4 w-4 items-center justify-center">{leadingIcon}</span>
      ) : null}
      <span>{children}</span>
      {trailingIcon ? (
        <span className="inline-flex h-4 w-4 items-center justify-center">{trailingIcon}</span>
      ) : null}
    </button>
  );
}

export type SkeedIconButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> & {
  label: string;
  icon: React.ReactNode;
  size?: Size;
  variant?: SkeedButtonVariant;
};

export function SkeedIconButton({
  className,
  icon,
  label,
  size = 'md',
  type = 'button',
  variant = 'secondary',
  ...props
}: SkeedIconButtonProps): React.ReactElement {
  const sizeClass = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-12 w-12' : 'h-10 w-10';
  return (
    <button
      {...props}
      aria-label={label}
      className={cx(
        'skeed-press-soft inline-flex shrink-0 items-center justify-center rounded-skeed transition focus-visible:skeed-focus-ring disabled:pointer-events-none disabled:opacity-50',
        sizeClass,
        buttonVariantClasses[variant],
        className,
      )}
      title={props.title ?? label}
      type={type}
    >
      <span aria-hidden="true" className="inline-flex h-5 w-5 items-center justify-center">
        {icon}
      </span>
    </button>
  );
}

export type SkeedBadgeProps = {
  children: React.ReactNode;
  className?: string;
  intent?: Intent;
  withDot?: boolean;
};

export function SkeedBadge({
  children,
  className,
  intent = 'neutral',
  withDot = false,
}: SkeedBadgeProps): React.ReactElement {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold leading-none',
        badgeClasses[intent],
        className,
      )}
    >
      {withDot ? (
        <span
          aria-hidden="true"
          className={cx('h-1.5 w-1.5 rounded-full', intentDotClasses[intent])}
        />
      ) : null}
      {children}
    </span>
  );
}

export type SkeedAlertProps = {
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  intent?: Intent;
  title?: React.ReactNode;
};

export function SkeedAlert({
  actions,
  children,
  className,
  icon,
  intent = 'neutral',
  title,
}: SkeedAlertProps): React.ReactElement {
  const role = intent === 'danger' || intent === 'warning' ? 'alert' : 'status';
  return (
    <section
      className={cx(
        'skeed-enter-fade rounded-skeed border p-4 shadow-sm',
        alertClasses[intent],
        className,
      )}
      role={role}
    >
      <div className="flex gap-3">
        {icon ? (
          <div className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center">
            {icon}
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          {title ? <h2 className="text-sm font-semibold leading-6">{title}</h2> : null}
          <div className={cx('text-sm leading-6', title ? 'mt-1' : undefined)}>{children}</div>
          {actions ? <div className="mt-3 flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      </div>
    </section>
  );
}

export type SkeedProgressBarProps = {
  className?: string;
  label?: React.ReactNode;
  max?: number;
  showValue?: boolean;
  value: number;
};

export function SkeedProgressBar({
  className,
  label,
  max = 100,
  showValue = true,
  value,
}: SkeedProgressBarProps): React.ReactElement {
  const effectiveMax = Math.max(max, 0);
  const boundedValue = Math.min(Math.max(value, 0), effectiveMax);
  const percent = effectiveMax > 0 ? Math.round((boundedValue / effectiveMax) * 100) : 0;
  return (
    <div className={className}>
      {label || showValue ? (
        <div className="mb-2 flex items-center justify-between gap-3 text-sm">
          {label ? <span className="font-medium text-skeed-fg">{label}</span> : <span />}
          {showValue ? <span className="text-skeed-muted">{percent}%</span> : null}
        </div>
      ) : null}
      <div
        aria-label={typeof label === 'string' ? label : undefined}
        aria-valuemax={effectiveMax}
        aria-valuemin={0}
        aria-valuenow={boundedValue}
        className="h-2 overflow-hidden rounded-full bg-skeed-color-neutral-100"
        role="progressbar"
        tabIndex={0}
      >
        <div
          className="h-full rounded-full bg-skeed-brand transition-all duration-skeed-base ease-skeed"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export type SkeedStep = {
  description?: React.ReactNode;
  id: string;
  label: React.ReactNode;
  status?: 'complete' | 'current' | 'upcoming';
};

export type SkeedStepperProps = {
  className?: string;
  steps: SkeedStep[];
};

export function SkeedStepper({ className, steps }: SkeedStepperProps): React.ReactElement {
  return (
    <ol className={cx('grid gap-3 sm:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]', className)}>
      {steps.map((step, index) => {
        const status = step.status ?? 'upcoming';
        const isComplete = status === 'complete';
        const isCurrent = status === 'current';
        return (
          <li
            aria-current={isCurrent ? 'step' : undefined}
            className={cx(
              'rounded-skeed border bg-white p-3',
              isCurrent ? 'border-skeed-color-brand-300 shadow-sm' : 'border-skeed-border',
            )}
            key={step.id}
          >
            <div className="flex items-start gap-3">
              <span
                className={cx(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                  isComplete || isCurrent
                    ? 'bg-skeed-brand text-white'
                    : 'bg-skeed-color-neutral-100 text-skeed-muted',
                )}
              >
                {isComplete ? 'Done' : index + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-skeed-fg">{step.label}</span>
                {step.description ? (
                  <span className="mt-1 block text-sm leading-5 text-skeed-muted">
                    {step.description}
                  </span>
                ) : null}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export type SkeedTabItem = {
  content?: React.ReactNode;
  disabled?: boolean;
  label: React.ReactNode;
  value: string;
};

export type SkeedTabsProps = {
  activeValue: string;
  className?: string;
  items: SkeedTabItem[];
  onValueChange?: (value: string) => void;
};

export function SkeedTabs({
  activeValue,
  className,
  items,
  onValueChange,
}: SkeedTabsProps): React.ReactElement {
  const instanceId = safeDomId(useId());
  const activeItem = items.find((item) => item.value === activeValue);
  return (
    <div className={className}>
      <div
        aria-label="Tabs"
        className="flex gap-1 overflow-x-auto rounded-skeed bg-skeed-color-neutral-100 p-1"
        role="tablist"
      >
        {items.map((item) => {
          const isActive = item.value === activeValue;
          const itemId = safeDomId(item.value);
          const tabId = `${instanceId}-tab-${itemId}`;
          const panelId = `${instanceId}-tabpanel-${itemId}`;
          return (
            <button
              aria-controls={panelId}
              aria-selected={isActive}
              className={cx(
                'skeed-press-soft whitespace-nowrap rounded-skeed px-3 py-2 text-sm font-semibold transition-colors focus-visible:skeed-focus-ring disabled:pointer-events-none disabled:opacity-50',
                isActive
                  ? 'bg-white text-skeed-fg shadow-sm'
                  : 'text-skeed-muted hover:text-skeed-fg',
              )}
              disabled={item.disabled}
              id={tabId}
              key={item.value}
              onClick={onValueChange ? () => onValueChange(item.value) : undefined}
              role="tab"
              type="button"
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {activeItem?.content ? (
        <div
          aria-labelledby={`${instanceId}-tab-${safeDomId(activeItem.value)}`}
          className="skeed-enter-fade mt-4 text-sm leading-6 text-skeed-fg"
          id={`${instanceId}-tabpanel-${safeDomId(activeItem.value)}`}
          role="tabpanel"
        >
          {activeItem.content}
        </div>
      ) : null}
    </div>
  );
}

export type SkeedBreadcrumbItem = {
  href?: string;
  label: React.ReactNode;
};

export type SkeedBreadcrumbsProps = {
  className?: string;
  items: SkeedBreadcrumbItem[];
  label?: string;
};

export function SkeedBreadcrumbs({
  className,
  items,
  label = 'Breadcrumb',
}: SkeedBreadcrumbsProps): React.ReactElement {
  return (
    <nav aria-label={label} className={className}>
      <ol className="flex flex-wrap items-center gap-2 text-sm text-skeed-muted">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li className="flex items-center gap-2" key={`${index}-${String(item.label)}`}>
              {item.href && !isLast ? (
                <a
                  className="rounded-sm font-medium text-skeed-muted hover:text-skeed-fg focus-visible:skeed-focus-ring"
                  href={item.href}
                >
                  {item.label}
                </a>
              ) : (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className={cx(isLast ? 'font-semibold text-skeed-fg' : undefined)}
                >
                  {item.label}
                </span>
              )}
              {!isLast ? (
                <span aria-hidden="true" className="text-skeed-color-neutral-300">
                  /
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export type SkeedAvatar = {
  alt: string;
  fallback?: string;
  id: string;
  src?: string;
};

export type SkeedAvatarStackProps = {
  avatars: SkeedAvatar[];
  className?: string;
  limit?: number;
  size?: Size;
};

export function SkeedAvatarStack({
  avatars,
  className,
  limit = 4,
  size = 'md',
}: SkeedAvatarStackProps): React.ReactElement {
  const visibleAvatars = avatars.slice(0, limit);
  const hiddenCount = Math.max(avatars.length - visibleAvatars.length, 0);
  const sizeClass =
    size === 'sm' ? 'h-8 w-8 text-xs' : size === 'lg' ? 'h-12 w-12 text-sm' : 'h-10 w-10 text-sm';
  return (
    <div className={cx('flex -space-x-2', className)}>
      {visibleAvatars.map((avatar) => (
        <div
          className={cx(
            'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-skeed-color-neutral-100 font-semibold text-skeed-muted shadow-sm',
            sizeClass,
          )}
          key={avatar.id}
          title={avatar.alt}
        >
          {avatar.src ? (
            <img alt={avatar.alt} className="h-full w-full object-cover" src={avatar.src} />
          ) : (
            <span>{avatar.fallback ?? avatar.alt.slice(0, 2).toUpperCase()}</span>
          )}
        </div>
      ))}
      {hiddenCount > 0 ? (
        <div
          aria-label={`${hiddenCount} more`}
          className={cx(
            'inline-flex shrink-0 items-center justify-center rounded-full border-2 border-white bg-skeed-fg font-semibold text-white shadow-sm',
            sizeClass,
          )}
        >
          +{hiddenCount}
        </div>
      ) : null}
    </div>
  );
}

export type SkeedEmptyStateProps = {
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  title: React.ReactNode;
};

export function SkeedEmptyState({
  action,
  children,
  className,
  icon,
  title,
}: SkeedEmptyStateProps): React.ReactElement {
  return (
    <section
      className={cx(
        'rounded-skeed border border-dashed border-skeed-border bg-white px-6 py-10 text-center',
        className,
      )}
    >
      {icon ? (
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-skeed-color-brand-50 text-skeed-brand">
          {icon}
        </div>
      ) : null}
      <h2 className="text-base font-semibold text-skeed-fg">{title}</h2>
      {children ? (
        <div className="mx-auto mt-2 max-w-md text-sm leading-6 text-skeed-muted">{children}</div>
      ) : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </section>
  );
}

export type SkeedSkeletonProps = {
  className?: string;
  lines?: number;
};

export function SkeedSkeleton({ className, lines = 1 }: SkeedSkeletonProps): React.ReactElement {
  if (lines <= 1) {
    return (
      <div
        aria-hidden="true"
        className={cx(
          'h-4 rounded-skeed bg-skeed-color-neutral-100 animate-skeed-soft-pulse',
          className,
        )}
      />
    );
  }

  return (
    <div aria-hidden="true" className={cx('grid gap-2', className)}>
      {Array.from({ length: lines }, (_, index) => `skeed-skeleton-line-${index + 1}`).map(
        (rowId) => (
          <div
            className={cx(
              'h-4 rounded-skeed bg-skeed-color-neutral-100 animate-skeed-soft-pulse',
              rowId.endsWith(`-${lines}`) ? 'w-2/3' : 'w-full',
            )}
            key={rowId}
          />
        ),
      )}
    </div>
  );
}

export type SkeedTimelineItem = {
  description?: React.ReactNode;
  id: string;
  meta?: React.ReactNode;
  title: React.ReactNode;
};

export type SkeedTimelineProps = {
  className?: string;
  items: SkeedTimelineItem[];
};

export function SkeedTimeline({ className, items }: SkeedTimelineProps): React.ReactElement {
  return (
    <ol className={cx('space-y-4', className)}>
      {items.map((item, index) => (
        <li className="relative pl-7" key={item.id}>
          {index < items.length - 1 ? (
            <span
              aria-hidden="true"
              className="absolute left-2.5 top-5 h-full w-px bg-skeed-border"
            />
          ) : null}
          <span
            aria-hidden="true"
            className="absolute left-0 top-1.5 h-5 w-5 rounded-full border-4 border-white bg-skeed-brand shadow-sm"
          />
          <div className="rounded-skeed border border-skeed-border bg-white p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold text-skeed-fg">{item.title}</h3>
              {item.meta ? (
                <p className="text-xs font-medium text-skeed-muted">{item.meta}</p>
              ) : null}
            </div>
            {item.description ? (
              <div className="mt-2 text-sm leading-6 text-skeed-muted">{item.description}</div>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

export type SkeedToast = {
  action?: React.ReactNode;
  description?: React.ReactNode;
  id: string;
  intent?: Intent;
  title: React.ReactNode;
};

export type SkeedToastStackProps = {
  className?: string;
  label?: string;
  toasts: SkeedToast[];
};

export function SkeedToastStack({
  className,
  label = 'Notifications',
  toasts,
}: SkeedToastStackProps): React.ReactElement {
  return (
    <section aria-label={label} aria-live="polite" className={cx('grid gap-3', className)}>
      {toasts.map((toast) => {
        const intent = toast.intent ?? 'neutral';
        return (
          <article
            className={cx(
              'skeed-enter-slide-up rounded-skeed border bg-white p-4 shadow-sm',
              alertClasses[intent],
            )}
            key={toast.id}
          >
            <div className="flex gap-3">
              <span
                aria-hidden="true"
                className={cx('mt-2 h-2 w-2 shrink-0 rounded-full', intentDotClasses[intent])}
              />
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold">{toast.title}</h2>
                {toast.description ? (
                  <div className="mt-1 text-sm leading-6 opacity-80">{toast.description}</div>
                ) : null}
                {toast.action ? <div className="mt-3">{toast.action}</div> : null}
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}

export type SkeedDisclosureItem = {
  content: React.ReactNode;
  defaultOpen?: boolean;
  id: string;
  title: React.ReactNode;
};

export type SkeedDisclosureListProps = {
  className?: string;
  items: SkeedDisclosureItem[];
};

export function SkeedDisclosureList({
  className,
  items,
}: SkeedDisclosureListProps): React.ReactElement {
  return (
    <div
      className={cx(
        'divide-y divide-skeed-border rounded-skeed border border-skeed-border bg-white',
        className,
      )}
    >
      {items.map((item) => (
        <details className="group" key={item.id} open={item.defaultOpen}>
          <summary className="skeed-press-soft flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-sm font-semibold text-skeed-fg focus-visible:skeed-focus-ring">
            <span>{item.title}</span>
            <span
              aria-hidden="true"
              className="text-skeed-muted transition-transform duration-skeed-base ease-skeed group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <div className="px-4 pb-4 text-sm leading-6 text-skeed-muted">{item.content}</div>
        </details>
      ))}
    </div>
  );
}
