'use client';

import { useId, useState } from 'react';
import type * as React from 'react';

type Tone = 'neutral' | 'good' | 'warning' | 'danger';
type ChatRole = 'assistant' | 'user' | 'system' | 'tool';

export type SkeedPromptSuggestion = {
  id: string;
  label: string;
  prompt: string;
};

export type SkeedChatAction = {
  id: string;
  label: string;
  onSelect?: () => void;
};

export type SkeedSemanticMatch = {
  id: string;
  title: string;
  excerpt: string;
  score: number;
  source?: string;
  tags?: string[];
};

export type SkeedFitFactor = {
  id: string;
  label: string;
  score: number;
  rationale: string;
};

export type SkeedInstallStep = {
  id: string;
  label: string;
  detail?: string;
  status: 'complete' | 'active' | 'pending';
};

export type SkeedAuditItem = {
  id: string;
  label: string;
  detail: string;
  tone?: Tone;
};

export type SkeedContextSource = {
  id: string;
  name: string;
  kind: string;
  detail?: string;
  confidence?: number;
};

export type SkeedPersonaSignal = {
  id: string;
  label: string;
  value: string;
};

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function scoreStyle(score: number): React.CSSProperties {
  return { width: `${clampPercent(score)}%` };
}

function toneClasses(tone: Tone = 'neutral'): string {
  const tones: Record<Tone, string> = {
    neutral: 'border-skeed-border bg-skeed-bg text-skeed-muted',
    good: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-700',
    danger: 'border-rose-200 bg-rose-50 text-rose-700',
  };

  return tones[tone];
}

export function SkeedPromptComposer({
  value,
  defaultValue = '',
  placeholder = 'Ask Skeed to adapt this interface...',
  suggestions = [],
  submitLabel = 'Send',
  isLoading = false,
  contextLabel = 'Context ready',
  onChange,
  onSubmit,
}: {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  suggestions?: SkeedPromptSuggestion[];
  submitLabel?: string;
  isLoading?: boolean;
  contextLabel?: string;
  onChange?: (value: string) => void;
  onSubmit?: (prompt: string) => void;
}): React.ReactElement {
  const [draft, setDraft] = useState(defaultValue);
  const prompt = value ?? draft;
  const inputId = useId();

  function updatePrompt(nextValue: string): void {
    if (value === undefined) {
      setDraft(nextValue);
    }
    onChange?.(nextValue);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const nextPrompt = prompt.trim();
    if (!nextPrompt || isLoading) {
      return;
    }
    onSubmit?.(nextPrompt);
    if (value === undefined) {
      setDraft('');
    }
  }

  return (
    <form
      className="rounded-skeed border border-skeed-border bg-white p-3 shadow-sm transition focus-within:border-skeed-brand/50 focus-within:shadow-md"
      onSubmit={handleSubmit}
    >
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <label className="text-sm font-semibold text-skeed-fg" htmlFor={inputId}>
          Prompt
        </label>
        <span className="inline-flex items-center gap-2 rounded-full border border-skeed-border bg-skeed-bg px-2.5 py-1 text-xs font-medium text-skeed-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {contextLabel}
        </span>
      </div>
      <textarea
        className="min-h-28 w-full resize-y rounded-skeed border border-skeed-border bg-skeed-bg px-3 py-3 text-sm leading-6 text-skeed-fg outline-none transition placeholder:text-skeed-muted/70 focus:border-skeed-brand focus:bg-white focus-visible:skeed-focus-ring"
        disabled={isLoading}
        id={inputId}
        onChange={(event) => updatePrompt(event.currentTarget.value)}
        placeholder={placeholder}
        value={prompt}
      />
      {suggestions.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <button
              className="skeed-press-soft rounded-full border border-skeed-border bg-white px-3 py-1.5 text-xs font-semibold text-skeed-fg transition hover:border-skeed-brand/40 hover:bg-skeed-bg focus-visible:skeed-focus-ring"
              key={suggestion.id}
              onClick={() => updatePrompt(suggestion.prompt)}
              type="button"
            >
              {suggestion.label}
            </button>
          ))}
        </div>
      ) : null}
      <div className="mt-3 flex justify-end">
        <button
          className="skeed-press-soft inline-flex min-w-24 items-center justify-center rounded-skeed bg-skeed-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-skeed-brand/90 focus-visible:skeed-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!prompt.trim() || isLoading}
          type="submit"
        >
          {isLoading ? 'Thinking...' : submitLabel}
        </button>
      </div>
    </form>
  );
}

export function SkeedChatMessage({
  role,
  author,
  children,
  timestamp,
  actions = [],
}: {
  role: ChatRole;
  author?: string;
  children: React.ReactNode;
  timestamp?: string;
  actions?: SkeedChatAction[];
}): React.ReactElement {
  const isUser = role === 'user';
  const label = author ?? (isUser ? 'You' : role === 'assistant' ? 'Skeed' : role);

  return (
    <article className={cx('flex gap-3', isUser && 'flex-row-reverse')}>
      <div
        className={cx(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold',
          isUser ? 'bg-skeed-brand text-white' : 'bg-skeed-bg text-skeed-brand',
        )}
      >
        {label.slice(0, 1).toUpperCase()}
      </div>
      <div className={cx('max-w-[min(42rem,100%)]', isUser && 'text-right')}>
        <div className="mb-1 flex items-center gap-2 text-xs text-skeed-muted">
          <span className="font-semibold text-skeed-fg">{label}</span>
          {timestamp ? <time>{timestamp}</time> : null}
        </div>
        <div
          className={cx(
            'rounded-skeed border px-4 py-3 text-sm leading-6 shadow-sm',
            isUser
              ? 'border-skeed-brand bg-skeed-brand text-white'
              : 'border-skeed-border bg-white text-skeed-fg',
          )}
        >
          {children}
        </div>
        {actions.length > 0 ? (
          <div className={cx('mt-2 flex flex-wrap gap-2', isUser && 'justify-end')}>
            {actions.map((action) => (
              <button
                className="rounded-full border border-skeed-border bg-white px-3 py-1 text-xs font-semibold text-skeed-fg transition hover:bg-skeed-bg focus-visible:skeed-focus-ring"
                key={action.id}
                onClick={action.onSelect}
                type="button"
              >
                {action.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function SkeedVoiceOrb({
  state = 'idle',
  label = 'Voice input',
  level = 36,
}: {
  state?: 'idle' | 'listening' | 'thinking' | 'muted';
  label?: string;
  level?: number;
}): React.ReactElement {
  const isActive = state === 'listening' || state === 'thinking';

  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-skeed-border bg-white px-4 py-3 shadow-sm">
      <div
        className={cx(
          'relative flex h-14 w-14 items-center justify-center rounded-full border transition',
          isActive ? 'border-skeed-brand bg-skeed-brand/10' : 'border-skeed-border bg-skeed-bg',
        )}
      >
        <span
          className={cx(
            'absolute h-full w-full rounded-full border border-skeed-brand/30',
            isActive && 'animate-ping motion-reduce:animate-none',
          )}
        />
        <span
          className={cx(
            'relative h-6 w-6 rounded-full transition',
            state === 'muted' ? 'bg-skeed-muted' : 'bg-skeed-brand',
            state === 'thinking' && 'animate-pulse motion-reduce:animate-none',
          )}
        />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-skeed-fg">{label}</p>
        <div className="mt-2 h-1.5 w-28 overflow-hidden rounded-full bg-skeed-bg">
          <div
            className="h-full rounded-full bg-skeed-brand transition-all duration-300"
            style={scoreStyle(state === 'muted' ? 0 : level)}
          />
        </div>
      </div>
    </div>
  );
}

export function SkeedSemanticMatchList({
  matches,
  title = 'Semantic matches',
  emptyLabel = 'No matches yet',
}: {
  matches: SkeedSemanticMatch[];
  title?: string;
  emptyLabel?: string;
}): React.ReactElement {
  return (
    <section className="rounded-skeed border border-skeed-border bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-skeed-fg">{title}</h2>
        <span className="text-xs font-medium text-skeed-muted">{matches.length} found</span>
      </div>
      {matches.length === 0 ? (
        <p className="rounded-skeed bg-skeed-bg px-3 py-4 text-sm text-skeed-muted">{emptyLabel}</p>
      ) : (
        <div className="grid gap-3">
          {matches.map((match) => (
            <article
              className="skeed-hover-lift rounded-skeed border border-skeed-border bg-white p-4 transition"
              key={match.id}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-skeed-fg">{match.title}</h3>
                  {match.source ? (
                    <p className="mt-1 text-xs font-medium text-skeed-muted">{match.source}</p>
                  ) : null}
                </div>
                <span className="shrink-0 rounded-full bg-skeed-bg px-2.5 py-1 text-xs font-bold text-skeed-brand">
                  {clampPercent(match.score)}%
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-skeed-muted">{match.excerpt}</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-skeed-bg">
                <div
                  className="h-full rounded-full bg-skeed-brand"
                  style={scoreStyle(match.score)}
                />
              </div>
              {match.tags && match.tags.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {match.tags.map((tag) => (
                    <span
                      className="rounded-full border border-skeed-border px-2 py-1 text-xs text-skeed-muted"
                      key={tag}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export function SkeedFitExplanation({
  audience,
  summary,
  factors,
}: {
  audience: string;
  summary: string;
  factors: SkeedFitFactor[];
}): React.ReactElement {
  const average =
    factors.length > 0
      ? Math.round(factors.reduce((total, factor) => total + factor.score, 0) / factors.length)
      : 0;

  return (
    <section className="rounded-skeed border border-skeed-border bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-skeed-accent">
            Demographic fit
          </p>
          <h2 className="mt-1 text-xl font-bold text-skeed-fg">{audience}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-skeed-muted">{summary}</p>
        </div>
        <div className="rounded-skeed bg-skeed-bg px-4 py-3 text-center">
          <p className="text-2xl font-bold text-skeed-brand">{clampPercent(average)}%</p>
          <p className="text-xs font-medium text-skeed-muted">fit score</p>
        </div>
      </div>
      <div className="mt-5 grid gap-3">
        {factors.map((factor) => (
          <article className="rounded-skeed border border-skeed-border p-3" key={factor.id}>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-skeed-fg">{factor.label}</h3>
              <span className="text-xs font-bold text-skeed-brand">
                {clampPercent(factor.score)}%
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-skeed-bg">
              <div
                className="h-full rounded-full bg-skeed-accent"
                style={scoreStyle(factor.score)}
              />
            </div>
            <p className="mt-2 text-sm leading-6 text-skeed-muted">{factor.rationale}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function SkeedInstallPlanCard({
  title,
  description,
  steps,
  actionLabel = 'Install',
  onAction,
}: {
  title: string;
  description: string;
  steps: SkeedInstallStep[];
  actionLabel?: string;
  onAction?: () => void;
}): React.ReactElement {
  return (
    <article className="rounded-skeed border border-skeed-border bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-skeed-accent">
            Install context
          </p>
          <h2 className="mt-1 text-lg font-bold text-skeed-fg">{title}</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-skeed-muted">{description}</p>
        </div>
        <button
          className="skeed-press-soft inline-flex justify-center rounded-skeed bg-skeed-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-skeed-brand/90 focus-visible:skeed-focus-ring"
          onClick={onAction}
          type="button"
        >
          {actionLabel}
        </button>
      </div>
      <ol className="mt-5 grid gap-3">
        {steps.map((step, index) => (
          <li className="flex gap-3 rounded-skeed border border-skeed-border p-3" key={step.id}>
            <span
              className={cx(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                step.status === 'complete' && 'bg-emerald-100 text-emerald-700',
                step.status === 'active' && 'bg-skeed-brand text-white',
                step.status === 'pending' && 'bg-skeed-bg text-skeed-muted',
              )}
            >
              {step.status === 'complete' ? 'Done' : index + 1}
            </span>
            <span>
              <span className="block text-sm font-semibold text-skeed-fg">{step.label}</span>
              {step.detail ? (
                <span className="mt-1 block text-sm leading-6 text-skeed-muted">{step.detail}</span>
              ) : null}
            </span>
          </li>
        ))}
      </ol>
    </article>
  );
}

export function SkeedAuditPanel({
  title = 'AI audit',
  items,
}: {
  title?: string;
  items: SkeedAuditItem[];
}): React.ReactElement {
  return (
    <section className="rounded-skeed border border-skeed-border bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-skeed-fg">{title}</h2>
        <span className="rounded-full bg-skeed-bg px-2.5 py-1 text-xs font-semibold text-skeed-muted">
          {items.length} checks
        </span>
      </div>
      <div className="grid gap-2">
        {items.map((item) => (
          <article className={cx('rounded-skeed border p-3', toneClasses(item.tone))} key={item.id}>
            <div className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-current" />
              <div>
                <h3 className="text-sm font-semibold text-skeed-fg">{item.label}</h3>
                <p className="mt-1 text-sm leading-6">{item.detail}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function SkeedAgentHint({
  label = 'Agent hint',
  children,
  tone = 'neutral',
  actionLabel,
  onAction,
}: {
  label?: string;
  children: React.ReactNode;
  tone?: Tone;
  actionLabel?: string;
  onAction?: () => void;
}): React.ReactElement {
  return (
    <aside className={cx('rounded-skeed border p-4 shadow-sm', toneClasses(tone))}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide">{label}</p>
          <div className="mt-2 text-sm leading-6 text-skeed-fg">{children}</div>
        </div>
        {actionLabel ? (
          <button
            className="skeed-press-soft inline-flex justify-center rounded-skeed border border-skeed-border bg-white px-3 py-2 text-sm font-semibold text-skeed-fg transition hover:bg-skeed-bg focus-visible:skeed-focus-ring"
            onClick={onAction}
            type="button"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </aside>
  );
}

export function SkeedContextSourceList({
  sources,
  title = 'Context sources',
}: {
  sources: SkeedContextSource[];
  title?: string;
}): React.ReactElement {
  return (
    <section className="rounded-skeed border border-skeed-border bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold text-skeed-fg">{title}</h2>
      <div className="mt-4 grid gap-3">
        {sources.map((source) => (
          <article className="rounded-skeed border border-skeed-border p-3" key={source.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-skeed-fg">{source.name}</h3>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-skeed-accent">
                  {source.kind}
                </p>
              </div>
              {source.confidence !== undefined ? (
                <span className="rounded-full bg-skeed-bg px-2 py-1 text-xs font-bold text-skeed-brand">
                  {clampPercent(source.confidence)}%
                </span>
              ) : null}
            </div>
            {source.detail ? (
              <p className="mt-2 text-sm leading-6 text-skeed-muted">{source.detail}</p>
            ) : null}
            {source.confidence !== undefined ? (
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-skeed-bg">
                <div
                  className="h-full rounded-full bg-skeed-brand"
                  style={scoreStyle(source.confidence)}
                />
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

export function SkeedPersonaTargetCard({
  name,
  description,
  signals,
  fitScore,
}: {
  name: string;
  description: string;
  signals: SkeedPersonaSignal[];
  fitScore?: number;
}): React.ReactElement {
  return (
    <article className="skeed-hover-lift rounded-skeed border border-skeed-border bg-white p-5 shadow-sm transition">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-skeed-accent">
            Persona target
          </p>
          <h2 className="mt-1 text-xl font-bold text-skeed-fg">{name}</h2>
        </div>
        {fitScore !== undefined ? (
          <span className="rounded-full bg-skeed-brand px-3 py-1.5 text-xs font-bold text-white">
            {clampPercent(fitScore)}% fit
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-sm leading-6 text-skeed-muted">{description}</p>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        {signals.map((signal) => (
          <div className="rounded-skeed bg-skeed-bg p-3" key={signal.id}>
            <dt className="text-xs font-semibold uppercase tracking-wide text-skeed-muted">
              {signal.label}
            </dt>
            <dd className="mt-1 text-sm font-semibold text-skeed-fg">{signal.value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
