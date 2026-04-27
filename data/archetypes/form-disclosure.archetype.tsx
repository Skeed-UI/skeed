import React, { type HTMLAttributes, useState, useId, useCallback } from 'react';
import { cn } from '@skeed/core/cn';
import { ChevronDown, ChevronRight } from '@skeed/asset-icon';
import { createDisclosureEngine, type DisclosureRule, type DisclosureState } from '@skeed/core/progressive-disclosure';
import type { FieldConfig, FormState } from '@skeed/contracts';

export interface FormDisclosureProps extends Omit<HTMLAttributes<HTMLElement>, 'onSubmit'> {
  onSubmit: (data: Record<string, unknown>) => void | Promise<void>;
  fields: FieldConfig[];
  disclosureRules?: DisclosureRule[];
  loading?: boolean;
  error?: string;
  title?: string;
  subtitle?: string;
  showProgressIndicator?: boolean;
  animateDisclosure?: boolean;
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

const ERROR_INPUT = 'border-skeed-color-danger-500 focus-visible:ring-skeed-color-danger-500 focus-visible:border-skeed-color-danger-500';

/**
 * FormDisclosure - A form component with progressive disclosure support
 * Shows/hides fields based on user input and conditional rules
 */
export function FormDisclosure({
  onSubmit,
  fields,
  disclosureRules = [],
  loading = false,
  error,
  title = 'Form',
  subtitle,
  showProgressIndicator = true,
  animateDisclosure = true,
  className,
  ...rest
}: FormDisclosureProps) {
  const formId = useId();
  const disclosureEngine = createDisclosureEngine();
  
  const [formData, setFormData] = useState<FormState>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const isLoading = loading || isSubmitting;

  // Get visible fields based on current form state and disclosure rules
  const disclosureState: DisclosureState = disclosureEngine.evaluateRules(formData, disclosureRules);
  const visibleFieldIds = disclosureEngine.getVisibleFields(
    fields.map((f) => f.id),
    disclosureState
  );
  
  const visibleFields = fields.filter((f) => visibleFieldIds.includes(f.id));
  const hiddenFieldCount = fields.length - visibleFields.length;

  // Group visible fields by their category for better organization
  const groupedFields = groupFieldsByCategory(visibleFields);

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections((prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  const handleFieldChange = useCallback((fieldId: string, value: string) => {
    setFormData((prev: FormState) => ({ ...prev, [fieldId]: value }));
    // Clear error when user starts typing
    if (fieldErrors[fieldId]) {
      setFieldErrors((prev: Record<string, string>) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  }, [fieldErrors]);

  const validate = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    for (const field of visibleFields) {
      if (field.required && !formData[field.id]?.trim()) {
        errors[field.id] = `${field.label} is required.`;
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [visibleFields, formData]);

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

  const completedCount = visibleFields.filter((f) => formData[f.id]?.trim()).length;
  const completionPercentage = visibleFields.length > 0
    ? Math.round((completedCount / visibleFields.length) * 100)
    : 0;

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

      {/* Progress Indicator */}
      {showProgressIndicator && (
        <div className="flex flex-col gap-skeed-spacing-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-skeed-color-neutral-600">
              {completedCount} of {visibleFields.length} fields completed
            </span>
            <span className="text-skeed-color-brand-600 font-medium">{completionPercentage}%</span>
          </div>
          <div className="h-2 bg-skeed-color-neutral-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-skeed-color-brand-500 transition-all duration-skeed-motion-duration-normal"
              style={{ width: `${completionPercentage}%` }}
              aria-hidden="true"
            />
          </div>
          {hiddenFieldCount > 0 && (
            <p className="text-xs text-skeed-color-neutral-500">
              {hiddenFieldCount} additional {hiddenFieldCount === 1 ? 'field' : 'fields'} will appear based on your answers
            </p>
          )}
        </div>
      )}

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
        {/* Render fields grouped by category */}
        {Object.entries(groupedFields).map(([category, categoryFields], categoryIndex) => {
          const isExpanded = expandedSections.has(category) || categoryIndex === 0;
          const categoryCompleted = categoryFields.filter((f) => formData[f.id]?.trim()).length;
          const categoryTotal = categoryFields.length;

          return (
            <div
              key={category}
              className={cn(
                'border border-skeed-color-neutral-200 rounded-skeed-radius-4 overflow-hidden',
                animateDisclosure && 'transition-all duration-skeed-motion-duration-normal'
              )}
            >
              {/* Category Header */}
              <button
                type="button"
                onClick={() => toggleSection(category)}
                className={
                  'w-full flex items-center justify-between px-skeed-spacing-4 py-skeed-spacing-3 ' +
                  'bg-skeed-color-neutral-100 hover:bg-skeed-color-neutral-200 ' +
                  'transition-colors duration-skeed-motion-duration-fast ease-skeed-motion-easing-default ' +
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500'
                }
                aria-expanded={isExpanded}
                aria-controls={`${formId}-${category}-content`}
              >
                <div className="flex items-center gap-skeed-spacing-2">
                  <span className="text-skeed-color-neutral-500">
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </span>
                  <span className="font-medium font-skeed-body text-skeed-color-neutral-900">
                    {formatCategoryName(category)}
                  </span>
                  <span className="text-xs text-skeed-color-neutral-500">
                    ({categoryCompleted}/{categoryTotal})
                  </span>
                </div>
              </button>

              {/* Category Content */}
              {isExpanded && (
                <div
                  id={`${formId}-${category}-content`}
                  className={cn(
                    'p-skeed-spacing-4 flex flex-col gap-skeed-spacing-4',
                    animateDisclosure && 'animate-in fade-in slide-in-from-top-2 duration-200'
                  )}
                >
                  {categoryFields.map((field: FieldConfig) => (
                    <div key={field.id} className="flex flex-col gap-skeed-spacing-1">
                      <label
                        htmlFor={`${formId}-${field.id}`}
                        className="text-sm font-medium font-skeed-body text-skeed-color-neutral-900"
                      >
                        {field.label}
                        {field.required && <span className="text-skeed-color-danger-600 ml-1">*</span>}
                      </label>
                      {field.dependencies && field.dependencies.length > 0 && (
                        <p className="text-xs text-skeed-color-neutral-500">
                          Shown based on previous answers
                        </p>
                      )}
                      <input
                        id={`${formId}-${field.id}`}
                        type={field.type === 'email' ? 'email' : field.type === 'password' ? 'password' : 'text'}
                        value={(formData[field.id] as string) || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange(field.id, e.target.value)}
                        placeholder={field.label}
                        disabled={isLoading}
                        aria-invalid={!!fieldErrors[field.id]}
                        aria-describedby={fieldErrors[field.id] ? `${formId}-${field.id}-error` : undefined}
                        className={cn(INPUT_BASE, fieldErrors[field.id] && ERROR_INPUT)}
                      />
                      {fieldErrors[field.id] && (
                        <p
                          id={`${formId}-${field.id}-error`}
                          role="alert"
                          className="text-sm font-skeed-body text-skeed-color-danger-600"
                        >
                          {fieldErrors[field.id]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Show more button if there are hidden fields */}
        {hiddenFieldCount > 0 && !showProgressIndicator && (
          <p className="text-sm text-skeed-color-neutral-500 text-center">
            Answer the visible fields to reveal additional options
          </p>
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
          {isLoading ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </section>
  );
}

/**
 * Group fields by their semantic category
 */
function groupFieldsByCategory(fields: FieldConfig[]): Record<string, FieldConfig[]> {
  const groups: Record<string, FieldConfig[]> = {};

  for (const field of fields) {
    const category = field.category || 'general';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(field);
  }

  return groups;
}

/**
 * Format a category name for display
 */
function formatCategoryName(category: string): string {
  return category
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * CollapsibleSection - A reusable collapsible section component for forms
 */
export interface CollapsibleSectionProps {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
}

export function CollapsibleSection({
  id,
  title,
  description,
  children,
  defaultExpanded = false,
  onToggle,
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleToggle = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onToggle?.(newExpanded);
  };

  return (
    <div className="border border-skeed-color-neutral-200 rounded-skeed-radius-4 overflow-hidden">
      <button
        type="button"
        onClick={handleToggle}
        className={
          'w-full flex items-center justify-between px-skeed-spacing-4 py-skeed-spacing-3 ' +
          'bg-skeed-color-neutral-100 hover:bg-skeed-color-neutral-200 ' +
          'transition-colors duration-skeed-motion-duration-fast ' +
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500'
        }
        aria-expanded={isExpanded}
        aria-controls={`${id}-content`}
      >
        <div className="flex flex-col items-start">
          <span className="font-medium font-skeed-body text-skeed-color-neutral-900">{title}</span>
          {description && (
            <span className="text-sm text-skeed-color-neutral-500">{description}</span>
          )}
        </div>
        <span className="text-skeed-color-neutral-500">
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
      </button>

      {isExpanded && (
        <div id={`${id}-content`} className="p-skeed-spacing-4">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * ShowMoreButton - Button to reveal additional content
 */
export interface ShowMoreButtonProps {
  onClick: () => void;
  expanded: boolean;
  showLessText?: string;
  showMoreText?: string;
}

export function ShowMoreButton({
  onClick,
  expanded,
  showLessText = 'Show less',
  showMoreText = 'Show more',
}: ShowMoreButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'flex items-center gap-skeed-spacing-1 text-sm font-skeed-body ' +
        'text-skeed-color-brand-600 hover:text-skeed-color-brand-700 ' +
        'transition-colors duration-skeed-motion-duration-fast ' +
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500 '
      }
    >
      {expanded ? (
        <>
          <ChevronDown size={16} />
          {showLessText}
        </>
      ) : (
        <>
          <ChevronRight size={16} />
          {showMoreText}
        </>
      )}
    </button>
  );
}
