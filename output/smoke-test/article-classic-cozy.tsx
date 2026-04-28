import { cn } from '@skeed/core/cn';
/**
 * @generated Component: article
 * @demographic classic
 * @density cozy
 * @variant default
 * @category molecule
 * @schemaVersion 1
 * @generatedAt 2026-04-26T03:16:27.023Z
 *
 * DO NOT EDIT: This file is auto-generated from archetype:
 *   - Source: article
 *   - Preset: classic
 */
import { type HTMLAttributes, forwardRef } from 'react';

export interface ArticleProps extends HTMLAttributes<HTMLElement> {
  title?: string;
  subtitle?: string;
}

export const Article = forwardRef<HTMLElement, ArticleProps>(function Article(
  { className, title, subtitle, children, ...rest },
  ref,
) {
  return (
    <article
      ref={ref as any}
      className={cn('max-w-none', 'prose prose-slate', className)}
      {...rest}
    >
      {title && (
        <header className="mb-skeed-spacing-6">
          <h1 className="text-2xl font-bold font-skeed-body text-skeed-color-neutral-900">
            {title}
          </h1>
          {subtitle && (
            <p className="text-lg font-skeed-body text-skeed-color-neutral-600 mt-skeed-spacing-1">
              {subtitle}
            </p>
          )}
        </header>
      )}
      <div className="text-base font-skeed-body text-skeed-color-neutral-700 leading-skeed-typography-body-lineheight">
        {children}
      </div>
    </article>
  );
});
