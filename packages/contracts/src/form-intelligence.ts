import { z } from 'zod';

/**
 * Form Intelligence Configuration Schema
 * Defines the structure for demographic-specific form behavior
 */

export const ValidationStyle = z.enum(['strict', 'lenient', 'adaptive']);
export type ValidationStyle = z.infer<typeof ValidationStyle>;

export const SuggestionMode = z.enum(['aggressive', 'conservative', 'none']);
export type SuggestionMode = z.infer<typeof SuggestionMode>;

export const GroupingStrategy = z.enum(['semantic', 'functional', 'frequency', 'dependency', 'none']);
export type GroupingStrategy = z.infer<typeof GroupingStrategy>;

export const ProgressiveDisclosure = z.enum(['always', 'conditional', 'never']);
export type ProgressiveDisclosure = z.infer<typeof ProgressiveDisclosure>;

export const CorrectionType = z.enum(['typo', 'format', 'semantic']);
export type CorrectionType = z.infer<typeof CorrectionType>;

export const SmartDefaultSource = z.enum(['geo-ip', 'browser', 'user-context', 'none']);
export type SmartDefaultSource = z.infer<typeof SmartDefaultSource>;

export const SmartDefaults = z.record(z.string(), SmartDefaultSource);
export type SmartDefaults = z.infer<typeof SmartDefaults>;

export const FormIntelligenceVoice = z.object({
  validation: z.string(),
  suggestion: z.string(),
  success: z.string(),
});
export type FormIntelligenceVoice = z.infer<typeof FormIntelligenceVoice>;

export const FormIntelligenceConfig = z.object({
  validationStyle: ValidationStyle,
  suggestionMode: SuggestionMode,
  groupingStrategy: GroupingStrategy,
  progressiveDisclosure: ProgressiveDisclosure,
  smartDefaults: SmartDefaults,
  correctionTypes: z.array(CorrectionType),
  voice: FormIntelligenceVoice,
});
export type FormIntelligenceConfig = z.infer<typeof FormIntelligenceConfig>;

/**
 * Field Configuration Schema
 * Used by grouping and disclosure engines
 */
export const FieldConfig = z.object({
  id: z.string(),
  label: z.string(),
  type: z.string(),
  category: z.string().optional(),
  required: z.boolean().optional(),
  dependencies: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
});
export type FieldConfig = z.infer<typeof FieldConfig>;

/**
 * Validation Rule Schema
 * Defines validation patterns per field type
 */

export const FieldType = z.enum([
  'text',
  'email',
  'password',
  'number',
  'phone',
  'date',
  'url',
  'textarea',
  'select',
  'checkbox',
  'radio',
  'file',
]);
export type FieldType = z.infer<typeof FieldType>;

export const ValidationRule = z.object({
  type: FieldType,
  required: z.boolean().optional(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  pattern: z.string().optional(),
  customValidator: z.string().optional(), // Reference to custom validator function
  demographicOverrides: z.record(z.string(), z.any()).optional(),
});
export type ValidationRule = z.infer<typeof ValidationRule>;

/**
 * Suggestion Pattern Schema
 * Defines when/how to show suggestions
 */

export const SuggestionTrigger = z.enum(['on-error', 'on-blur', 'on-type', 'manual']);
export type SuggestionTrigger = z.infer<typeof SuggestionTrigger>;

export const SuggestionPattern = z.object({
  fieldType: FieldType,
  trigger: SuggestionTrigger,
  debounceMs: z.number().optional(),
  showInline: z.boolean().default(true),
  showDropdown: z.boolean().default(false),
  maxSuggestions: z.number().default(3),
});
export type SuggestionPattern = z.infer<typeof SuggestionPattern>;

/**
 * Grouping Schema
 * Defines how to group configuration options
 */

export const FieldGroup = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
  fields: z.array(z.string()), // Field IDs
  collapsible: z.boolean().default(false),
  defaultExpanded: z.boolean().default(true),
  order: z.number().optional(),
});
export type FieldGroup = z.infer<typeof FieldGroup>;

/**
 * Disclosure Rule Schema
 * Defines progressive disclosure rules
 */

export const DisclosureTrigger = z.object({
  field: z.string(),
  operator: z.enum(['equals', 'not-equals', 'contains', 'not-contains', 'greater-than', 'less-than']),
  value: z.any(),
});
export type DisclosureTrigger = z.infer<typeof DisclosureTrigger>;

export const DisclosureRule = z.object({
  fieldId: z.string(),
  trigger: DisclosureTrigger,
  showFields: z.array(z.string()),
  hideFields: z.array(z.string()).optional(),
});
export type DisclosureRule = z.infer<typeof DisclosureRule>;

/**
 * Form State Schema
 * Defines the structure for form state
 */

export const FormState = z.record(z.string(), z.any());
export type FormState = z.infer<typeof FormState>;

/**
 * Validation Result Schema
 */

export const ValidationError = z.object({
  field: z.string(),
  message: z.string(),
  code: z.string(),
  suggestion: z.string().optional(),
});
export type ValidationError = z.infer<typeof ValidationError>;

export const ValidationResult = z.object({
  isValid: z.boolean(),
  errors: z.array(ValidationError),
  warnings: z.array(ValidationError).optional(),
});
export type ValidationResult = z.infer<typeof ValidationResult>;

/**
 * Correction Schema
 * AI-powered input correction
 */

export const Correction = z.object({
  original: z.string(),
  corrected: z.string(),
  confidence: z.number().min(0).max(1),
  type: CorrectionType,
  explanation: z.string().optional(),
});
export type Correction = z.infer<typeof Correction>;

/**
 * Suggestion Schema
 * Actionable suggestions based on errors
 */

export const Suggestion = z.object({
  field: z.string(),
  message: z.string(),
  action: z.enum(['accept', 'replace', 'format', 'explain']),
  value: z.string().optional(),
});
export type Suggestion = z.infer<typeof Suggestion>;
