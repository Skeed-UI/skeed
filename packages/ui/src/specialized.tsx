import { useId } from 'react';
import type * as React from 'react';

type WithClassName = {
  className?: string;
};

type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

function safeDomId(value: string): string {
  return value.replace(/[^A-Za-z0-9_-]/g, '-');
}

export type SkeedAccordionItem = {
  id: string;
  title: React.ReactNode;
  body: React.ReactNode;
  defaultOpen?: boolean;
};

export type SkeedAccordionProps = WithClassName & {
  items: SkeedAccordionItem[];
  allowMultiple?: boolean;
};

export function SkeedAccordion({
  allowMultiple = true,
  className,
  items,
}: SkeedAccordionProps): React.ReactElement {
  const accordionId = safeDomId(useId());
  return (
    <div
      className={cx(
        'divide-y divide-skeed-border rounded-skeed border border-skeed-border bg-white',
        className,
      )}
    >
      {items.map((item, index) => (
        <details
          key={item.id}
          name={allowMultiple ? undefined : `${accordionId}-accordion`}
          open={item.defaultOpen ?? index === 0}
        >
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-skeed-fg marker:text-skeed-brand hover:bg-skeed-color-neutral-50 focus-visible:skeed-focus-ring">
            {item.title}
          </summary>
          <div className="px-4 pb-4 text-sm leading-6 text-skeed-muted">{item.body}</div>
        </details>
      ))}
    </div>
  );
}

export type SkeedComment = {
  id: string;
  author: string;
  body: React.ReactNode;
  time?: string;
  badge?: React.ReactNode;
  replies?: SkeedComment[];
};

export type SkeedCommentsThreadProps = WithClassName & {
  comments: SkeedComment[];
  title?: React.ReactNode;
};

export function SkeedCommentsThread({
  className,
  comments,
  title,
}: SkeedCommentsThreadProps): React.ReactElement {
  return (
    <section className={cx('rounded-skeed border border-skeed-border bg-white p-5', className)}>
      {title ? <h2 className="mb-4 text-base font-bold text-skeed-fg">{title}</h2> : null}
      <div className="grid gap-4">
        {comments.map((comment) => (
          <CommentNode comment={comment} key={comment.id} />
        ))}
      </div>
    </section>
  );
}

function CommentNode({ comment }: { comment: SkeedComment }): React.ReactElement {
  return (
    <article className="rounded-skeed bg-skeed-bg p-3">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-skeed-color-brand-50 text-xs font-bold text-skeed-brand">
          {comment.author.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-semibold text-skeed-fg">{comment.author}</p>
          {comment.time ? <time className="text-xs text-skeed-muted">{comment.time}</time> : null}
        </div>
        {comment.badge ? <div className="ml-auto">{comment.badge}</div> : null}
      </div>
      <div className="mt-3 text-sm leading-6 text-skeed-muted">{comment.body}</div>
      {comment.replies?.length ? (
        <div className="mt-3 grid gap-3 border-l border-skeed-border pl-3">
          {comment.replies.map((reply) => (
            <CommentNode comment={reply} key={reply.id} />
          ))}
        </div>
      ) : null}
    </article>
  );
}

export type SkeedErrorStateProps = WithClassName & {
  title?: React.ReactNode;
  body?: React.ReactNode;
  action?: React.ReactNode;
  code?: React.ReactNode;
};

export function SkeedErrorState({
  action,
  body = 'Something went wrong. Review the details and try again.',
  className,
  code,
  title = 'Unable to continue',
}: SkeedErrorStateProps): React.ReactElement {
  return (
    <section
      className={cx(
        'rounded-skeed border border-skeed-color-danger-200 bg-skeed-color-danger-50 p-6 text-skeed-color-danger-900',
        className,
      )}
      role="alert"
    >
      {code ? <p className="mb-2 text-xs font-bold uppercase opacity-70">{code}</p> : null}
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 opacity-85">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </section>
  );
}

export type SkeedLoadingStateProps = WithClassName & {
  label?: React.ReactNode;
  rows?: number;
};

export function SkeedLoadingState({
  className,
  label = 'Loading',
  rows = 3,
}: SkeedLoadingStateProps): React.ReactElement {
  return (
    <section
      aria-busy="true"
      aria-live="polite"
      className={cx('rounded-skeed border border-skeed-border bg-white p-5', className)}
    >
      <div className="mb-4 flex items-center gap-3 text-sm font-semibold text-skeed-muted">
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-skeed-border border-t-skeed-brand motion-reduce:animate-none" />
        {label}
      </div>
      <div className="grid gap-3">
        {Array.from({ length: rows }, (_, index) => `loading-row-${index + 1}`).map((id) => (
          <div
            className="h-4 animate-pulse rounded bg-skeed-color-neutral-100 motion-reduce:animate-none"
            key={id}
          />
        ))}
      </div>
    </section>
  );
}

export type SkeedCalendarDayProps = WithClassName & {
  label: React.ReactNode;
  date: React.ReactNode;
  detail?: React.ReactNode;
  selected?: boolean;
  muted?: boolean;
};

export function SkeedCalendarDay({
  className,
  date,
  detail,
  label,
  muted = false,
  selected = false,
}: SkeedCalendarDayProps): React.ReactElement {
  return (
    <article
      className={cx(
        'skeed-press-soft rounded-skeed border p-3 text-center transition',
        selected
          ? 'border-skeed-brand bg-skeed-brand text-white'
          : 'border-skeed-border bg-white text-skeed-fg hover:border-skeed-color-brand-200',
        muted && !selected && 'opacity-55',
        className,
      )}
    >
      <p className="text-xs font-semibold uppercase opacity-75">{label}</p>
      <p className="mt-1 text-2xl font-bold">{date}</p>
      {detail ? <p className="mt-1 text-xs opacity-75">{detail}</p> : null}
    </article>
  );
}

export function SkeedSeparator({
  className,
  label,
}: WithClassName & { label?: React.ReactNode }): React.ReactElement {
  return (
    <div
      className={cx(
        'flex items-center gap-3 text-xs font-semibold uppercase text-skeed-muted',
        className,
      )}
    >
      <span className="h-px flex-1 bg-skeed-border" />
      {label ? <span>{label}</span> : null}
      <span className="h-px flex-1 bg-skeed-border" />
    </div>
  );
}

export function SkeedChip({
  children,
  className,
  selected = false,
}: WithClassName & { children: React.ReactNode; selected?: boolean }): React.ReactElement {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold',
        selected
          ? 'border-skeed-brand bg-skeed-color-brand-50 text-skeed-color-brand-700'
          : 'border-skeed-border bg-white text-skeed-muted',
        className,
      )}
    >
      {children}
    </span>
  );
}

export type SkeedTableRowProps = WithClassName & {
  cells: Array<React.ReactNode | { id: string; content: React.ReactNode }>;
  selected?: boolean;
};

export function SkeedTableRow({
  cells,
  className,
  selected = false,
}: SkeedTableRowProps): React.ReactElement {
  return (
    <tr className={cx(selected && 'bg-skeed-color-brand-50', className)}>
      {cells.map((cell) => (
        <td
          className="border-b border-skeed-border px-4 py-3 text-sm text-skeed-fg"
          key={cellKey(cell)}
        >
          {cellContent(cell)}
        </td>
      ))}
    </tr>
  );
}

function cellKey(cell: React.ReactNode | { id: string; content: React.ReactNode }): string {
  if (typeof cell === 'object' && cell !== null && 'id' in cell) {
    return cell.id;
  }
  if (typeof cell === 'string' || typeof cell === 'number') {
    return `cell-${cell}`;
  }
  return `cell-${String(cell)}`;
}

function cellContent(
  cell: React.ReactNode | { id: string; content: React.ReactNode },
): React.ReactNode {
  if (typeof cell === 'object' && cell !== null && 'content' in cell) {
    return cell.content;
  }
  return cell;
}

export type SkeedMenuBarProps = WithClassName & {
  groups: Array<{
    id: string;
    label: React.ReactNode;
    items: Array<{ id: string; label: React.ReactNode; shortcut?: React.ReactNode }>;
  }>;
};

export function SkeedMenuBar({ className, groups }: SkeedMenuBarProps): React.ReactElement {
  return (
    <nav
      aria-label="Menu"
      className={cx(
        'flex flex-wrap gap-1 rounded-skeed border border-skeed-border bg-white p-1',
        className,
      )}
    >
      {groups.map((group) => (
        <details className="relative" key={group.id}>
          <summary className="cursor-pointer rounded-skeed px-3 py-2 text-sm font-semibold text-skeed-fg marker:content-none hover:bg-skeed-color-neutral-100 focus-visible:skeed-focus-ring">
            {group.label}
          </summary>
          <div className="absolute left-0 top-full z-20 mt-1 w-56 rounded-skeed border border-skeed-border bg-white p-1 shadow-lg">
            {group.items.map((item) => (
              <div
                className="flex items-center justify-between gap-3 rounded px-3 py-2 text-sm text-skeed-fg hover:bg-skeed-color-neutral-100"
                key={item.id}
              >
                <span>{item.label}</span>
                {item.shortcut ? (
                  <kbd className="text-xs text-skeed-muted">{item.shortcut}</kbd>
                ) : null}
              </div>
            ))}
          </div>
        </details>
      ))}
    </nav>
  );
}

export type SkeedScrollAreaProps = WithClassName & {
  children: React.ReactNode;
  maxHeight?: string;
};

export function SkeedScrollArea({
  children,
  className,
  maxHeight = '24rem',
}: SkeedScrollAreaProps): React.ReactElement {
  return (
    <div
      className={cx(
        'overflow-auto rounded-skeed border border-skeed-border bg-white p-4 [scrollbar-gutter:stable]',
        className,
      )}
      style={{ maxHeight }}
    >
      {children}
    </div>
  );
}

export type SkeedScrollTimelineItem = {
  id: string;
  title: React.ReactNode;
  body?: React.ReactNode;
  meta?: React.ReactNode;
};

export type SkeedScrollTimelineProps = WithClassName & {
  items: SkeedScrollTimelineItem[];
};

export function SkeedScrollTimeline({
  className,
  items,
}: SkeedScrollTimelineProps): React.ReactElement {
  return (
    <ol className={cx('relative grid gap-5 border-l border-skeed-border pl-5', className)}>
      {items.map((item) => (
        <li className="relative" key={item.id}>
          <span className="-left-[1.62rem] absolute top-1 h-3 w-3 rounded-full border-2 border-white bg-skeed-brand" />
          {item.meta ? (
            <p className="text-xs font-semibold uppercase text-skeed-brand">{item.meta}</p>
          ) : null}
          <h3 className="text-base font-bold text-skeed-fg">{item.title}</h3>
          {item.body ? (
            <p className="mt-1 text-sm leading-6 text-skeed-muted">{item.body}</p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

export type SkeedScrollAccordionProps = WithClassName & {
  sections: SkeedAccordionItem[];
};

export function SkeedScrollAccordion({
  className,
  sections,
}: SkeedScrollAccordionProps): React.ReactElement {
  return (
    <div className={cx('grid gap-4 md:grid-cols-[16rem_1fr]', className)}>
      <nav aria-label="Sections" className="grid content-start gap-2">
        {sections.map((section) => (
          <a
            className="rounded-skeed border border-skeed-border bg-white px-3 py-2 text-sm font-semibold text-skeed-muted hover:text-skeed-fg focus-visible:skeed-focus-ring"
            href={`#${section.id}`}
            key={section.id}
          >
            {section.title}
          </a>
        ))}
      </nav>
      <div className="grid gap-4">
        {sections.map((section) => (
          <section
            className="rounded-skeed border border-skeed-border bg-white p-5"
            id={section.id}
            key={section.id}
          >
            <h3 className="text-lg font-bold text-skeed-fg">{section.title}</h3>
            <div className="mt-2 text-sm leading-6 text-skeed-muted">{section.body}</div>
          </section>
        ))}
      </div>
    </div>
  );
}

export type SkeedLuminousGlyphProps = WithClassName & {
  label?: string;
  tone?: Tone;
};

export function SkeedLuminousGlyph({
  className,
  label = 'Status signal',
  tone = 'brand',
}: SkeedLuminousGlyphProps): React.ReactElement {
  const glow =
    tone === 'success'
      ? 'bg-skeed-success'
      : tone === 'warning'
        ? 'bg-skeed-color-warning-500'
        : tone === 'danger'
          ? 'bg-skeed-danger'
          : 'bg-skeed-brand';
  return (
    <span
      aria-label={label}
      className={cx('relative inline-flex h-10 w-10 items-center justify-center', className)}
      role="img"
    >
      <span className={cx('absolute h-10 w-10 rounded-full opacity-20 blur-md', glow)} />
      <span className={cx('relative h-5 w-5 rounded-full shadow-sm', glow)} />
    </span>
  );
}

export type SkeedFormDisclosureProps = WithClassName & {
  title: React.ReactNode;
  children: React.ReactNode;
  summary?: React.ReactNode;
};

export function SkeedFormDisclosure({
  children,
  className,
  summary,
  title,
}: SkeedFormDisclosureProps): React.ReactElement {
  return (
    <details className={cx('rounded-skeed border border-skeed-border bg-white p-4', className)}>
      <summary className="cursor-pointer text-sm font-semibold text-skeed-fg marker:text-skeed-brand focus-visible:skeed-focus-ring">
        {title}
      </summary>
      {summary ? <p className="mt-2 text-sm text-skeed-muted">{summary}</p> : null}
      <div className="mt-4">{children}</div>
    </details>
  );
}

export type SkeedLoadingOverlayProps = WithClassName & {
  label?: React.ReactNode;
};

export function SkeedLoadingOverlay({
  className,
  label = 'Preparing your interface',
}: SkeedLoadingOverlayProps): React.ReactElement {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className={cx(
        'absolute inset-0 z-10 grid place-items-center rounded-skeed bg-white/80 p-6 backdrop-blur-sm',
        className,
      )}
    >
      <div className="rounded-skeed border border-skeed-border bg-white px-4 py-3 text-sm font-semibold text-skeed-fg shadow-sm">
        <span className="mr-2 inline-block h-3 w-3 animate-pulse rounded-full bg-skeed-brand motion-reduce:animate-none" />
        {label}
      </div>
    </div>
  );
}
