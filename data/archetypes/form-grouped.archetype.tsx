import React, { type HTMLAttributes, useState, useId } from 'react';
import { cn } from '@skeed/core/cn';
import { createGroupingEngine, type FieldConfig, type GroupingStrategy } from '@skeed/core/form-grouping';
import type { FieldGroup } from '@skeed/contracts';

export interface GroupedFormProps extends Omit<HTMLAttributes<HTMLElement>, 'onSubmit'> {
  onSubmit: (data: Record<string, unknown>) => void | Promise<void>;
  fields: FieldConfig[];
  groupingStrategy?: GroupingStrategy;
  loading?: boolean;
  success?: boolean;
  error?: string;
  title?: string;
  subtitle?: string;
}

const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const INPUT_BASE =
  'w-full bg-skeed-color-neutral-50 text-skeed-color-neutral-900 ' +
  'border border-skeed-color-neutral-300 rounded-skeed-radius-2 ' +
  'px-skeed-density-cozy-padx py-skeed-density-cozy-pady ' +
  'font-skeed-body placeholder:text-skeed-color-neutral-400 ' +
  'transition-colors duration-skeed-motion-duration-fast ease-skeed-motion-easing-default ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500 ' +
  'focus-visible:border-skeed-color-brand-500 ' +
  'disabled:pointer-events-none disabled:opacity-50';

const ERROR_INPUT = 'border-skeed-color-danger-500 focus-visible:ring-skeed-color-danger-500 focus-visible:border-skeed-color-danger-500';

export function GroupedForm({
  onSubmit,
  fields,
  groupingStrategy = 'semantic',
  loading = false,
  success = false,
  error,
  title = 'Form',
  subtitle,
  className,
  ...rest
}: GroupedFormProps) {
  const formId = useId();
  const groupingEngine = createGroupingEngine();
  const fieldGroups = groupingEngine.groupFields(fields, groupingStrategy);
  
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(fieldGroups.filter((g: FieldGroup) => g.defaultExpanded).map((g: FieldGroup) => g.id))
  );
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLoading = loading || isSubmitting;

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const handleFieldChange = (fieldId: string, value: string) => {
    setFormData((prev: Record<string, string>) => ({ ...prev, [fieldId]: value }));
    // Clear error when user starts typing
    if (fieldErrors[fieldId]) {
      setFieldErrors((prev: Record<string, string>) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    for (const field of fields) {
      if (field.required && !formData[field.id]?.trim()) {
        errors[field.id] = `${field.label} is required.`;
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      aria-labelledby={`${formId}-title`}
      className={cn(
        'flex flex-col gap-skeed-spacing-6 w-full max-w-2xl ' +
        'bg-skeed-color-neutral-50 rounded-skeed-radius-7 ' +
        'p-skeed-spacing-8 shadow-skeed-shadow-1',
        className,
      )}
      {...rest}
    >
      {/* Header */}
      <div className="flex flex-col gap-skeed-spacing-2">
        <h1 id={`${formId}-title`} className="text-2xl font-semibold font-skeed-body text-skeed-color-neutral-900">
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
        {fieldGroups.map((group: FieldGroup) => {
          const isExpanded = expandedGroups.has(group.id);
          const groupHasError = group.fields.some((fieldId: string) => fieldErrors[fieldId]);

          return (
            <div
              key={group.id}
              className={cn(
                'border border-skeed-color-neutral-200 rounded-skeed-radius-4 overflow-hidden',
                groupHasError && 'border-skeed-color-danger-300'
              )}
            >
              {/* Group Header */}
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className={cn(
                  'w-full flex items-center justify-between px-skeed-spacing-4 py-skeed-spacing-3 ' +
                  'bg-skeed-color-neutral-100 hover:bg-skeed-color-neutral-200 ' +
                  'transition-colors duration-skeed-motion-duration-fast ease-skeed-motion-easing-default ' +
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500',
                  !group.collapsible && 'cursor-default hover:bg-skeed-color-neutral-100'
                )}
                disabled={!group.collapsible}
                aria-expanded={isExpanded}
                aria-controls={`${formId}-${group.id}-content`}
              >
                <div className="flex items-center gap-skeed-spacing-2">
                  {group.collapsible && (
                    <span className="text-skeed-color-neutral-500">
                      {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
                    </span>
                  )}
                  <span className="font-medium font-skeed-body text-skeed-color-neutral-900">
                    {group.label}
                  </span>
                  {groupHasError && (
                    <span className="text-xs text-skeed-color-danger-600">
                      ({Object.keys(fieldErrors).filter((k) => group.fields.includes(k)).length} errors)
                    </span>
                  )}
                </div>
                {group.description && (
                  <span className="text-sm text-skeed-color-neutral-500">
                    {group.description}
                  </span>
                )}
              </button>

              {/* Group Content */}
              {isExpanded && (
                <div
                  id={`${formId}-${group.id}-content`}
                  className="p-skeed-spacing-4 flex flex-col gap-skeed-spacing-4"
                >
                  {group.fields.map((fieldId: string) => {
                    const field = fields.find((f: FieldConfig) => f.id === fieldId);
                    if (!field) return null;

                    return (
                      <div key={fieldId} className="flex flex-col gap-skeed-spacing-1">
                        <label
                          htmlFor={`${formId}-${fieldId}`}
                          className="text-sm font-medium font-skeed-body text-skeed-color-neutral-900"
                        >
                          {field.label}
                          {field.required && <span className="text-skeed-color-danger-600 ml-1">*</span>}
                        </label>
                        <input
                          id={`${formId}-${fieldId}`}
                          type={field.type === 'email' ? 'email' : field.type === 'password' ? 'password' : 'text'}
                          value={formData[fieldId] || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange(fieldId, e.target.value)}
                          placeholder={field.label}
                          disabled={isLoading}
                          aria-invalid={!!fieldErrors[fieldId]}
                          aria-describedby={fieldErrors[fieldId] ? `${formId}-${fieldId}-error` : undefined}
                          className={cn(INPUT_BASE, fieldErrors[fieldId] && ERROR_INPUT)}
                        />
                        {fieldErrors[fieldId] && (
                          <p
                            id={`${formId}-${fieldId}-error`}
                            role="alert"
                            className="text-sm font-skeed-body text-skeed-color-danger-600"
                          >
                            {fieldErrors[fieldId]}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

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
          {isLoading ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </section>
  );
}
