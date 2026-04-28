/**
 * Form Validation Engine
 *
 * Validates form fields with demographic-specific rules and patterns.
 * Supports format, semantic, and demographic-specific validation.
 */

import type {
  FieldType,
  FormState,
  ValidationError,
  ValidationResult,
  ValidationRule,
  ValidationStyle,
} from '@skeed/contracts';

export interface ValidationEngine {
  validateField(value: string, rules: ValidationRule, demographic: string): ValidationResult;
  validateForm(
    state: FormState,
    rules: Record<string, ValidationRule>,
    demographic: string,
  ): ValidationResult;
  getSuggestion(error: ValidationError, demographic: string): string;
}

/**
 * Demographic-specific validation patterns
 */
const DEMOGRAPHIC_VALIDATION_PATTERNS: Record<string, ValidationStyle> = {
  kids: 'lenient',
  fintech: 'strict',
  gov: 'adaptive',
  health: 'strict',
  working_class: 'adaptive',
  teens: 'lenient',
  education: 'adaptive',
  military: 'strict',
  legal: 'strict',
};

/**
 * Common validation patterns
 */
const PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[\d\s-()]{10,}$/,
  url: /^https?:\/\/.+/,
  passwordMinLength: 8,
  passwordMaxLength: 128,
};

/**
 * Demographic-specific suggestion voices
 */
const SUGGESTION_VOICES: Record<string, Record<string, string>> = {
  kids: {
    email: 'Try adding an @ symbol! 📧',
    password: 'Add some numbers to make it stronger! 🔢',
    required: 'Oops, this field needs a value! ⭐',
    format: "Let's try a different format! 🎨",
  },
  fintech: {
    email: 'Please enter a valid email address',
    password: 'Password must include uppercase, lowercase, and numbers',
    required: 'This field is required',
    format: 'Please use the required format',
  },
  gov: {
    email: 'Please enter a valid email address',
    password: 'Password must meet security requirements',
    required: 'This field is required',
    format: 'Please enter in the required format',
  },
  health: {
    email: 'Please enter a valid email address',
    password: 'Password must meet HIPAA security requirements',
    required: 'This field is required',
    format: 'Please use the standard format',
  },
  working_class: {
    email: 'Check your email format',
    password: 'Try adding more characters for security',
    required: 'This field is needed',
    format: 'Try the suggested format',
  },
};

/**
 * Create a validation engine instance
 */
export function createValidationEngine(): ValidationEngine {
  return {
    validateField,
    validateForm,
    getSuggestion,
  };
}

/**
 * Validate a single field
 */
function validateField(
  value: string,
  rules: ValidationRule,
  demographic: string,
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  const validationStyle = DEMOGRAPHIC_VALIDATION_PATTERNS[demographic] || 'adaptive';

  // Required validation
  if (rules.required && !value.trim()) {
    errors.push({
      field: rules.type,
      message: getRequiredMessage(rules.type, demographic),
      code: 'REQUIRED',
    });
    return { isValid: false, errors, warnings };
  }

  // Skip further validation if empty and not required
  if (!value.trim()) {
    return { isValid: true, errors: [], warnings };
  }

  // Min length validation
  if (rules.minLength && value.length < rules.minLength) {
    const isStrict = validationStyle === 'strict';
    if (isStrict || validationStyle === 'adaptive') {
      errors.push({
        field: rules.type,
        message: `Must be at least ${rules.minLength} characters`,
        code: 'MIN_LENGTH',
      });
    } else {
      warnings.push({
        field: rules.type,
        message: `Consider using at least ${rules.minLength} characters`,
        code: 'MIN_LENGTH',
      });
    }
  }

  // Max length validation
  if (rules.maxLength && value.length > rules.maxLength) {
    errors.push({
      field: rules.type,
      message: `Must be no more than ${rules.maxLength} characters`,
      code: 'MAX_LENGTH',
    });
  }

  // Pattern validation
  if (rules.pattern) {
    const regex = new RegExp(rules.pattern);
    if (!regex.test(value)) {
      const isStrict = validationStyle === 'strict';
      if (isStrict || validationStyle === 'adaptive') {
        errors.push({
          field: rules.type,
          message: getPatternMessage(rules.type, demographic),
          code: 'PATTERN',
        });
      } else {
        warnings.push({
          field: rules.type,
          message: getPatternMessage(rules.type, demographic),
          code: 'PATTERN',
        });
      }
    }
  }

  // Type-specific validation
  const typeErrors = validateByType(rules.type, value, validationStyle);
  errors.push(...typeErrors);

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Validate an entire form
 */
function validateForm(
  state: FormState,
  rules: Record<string, ValidationRule>,
  demographic: string,
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  for (const [fieldId, value] of Object.entries(state)) {
    const fieldRules = rules[fieldId];
    if (!fieldRules) continue;

    const result = validateField(String(value), fieldRules, demographic);
    errors.push(...result.errors);
    if (result.warnings) {
      warnings.push(...result.warnings);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Get a suggestion for a validation error
 */
function getSuggestion(error: ValidationError, demographic: string): string {
  const voices = SUGGESTION_VOICES[demographic] || SUGGESTION_VOICES.working_class;
  if (!voices) return 'Please check your input';

  switch (error.code) {
    case 'REQUIRED':
      return voices.required || 'This field is required';
    case 'MIN_LENGTH':
      return voices.format || 'Add more characters';
    case 'MAX_LENGTH':
      return 'Shorten your input';
    case 'PATTERN':
      return voices.format || 'Check the format';
    case 'EMAIL':
      return voices.email || 'Check email format';
    case 'PASSWORD':
      return voices.password || 'Strengthen your password';
    default:
      return voices.format || 'Try a different format';
  }
}

/**
 * Validate by field type
 */
function validateByType(
  type: FieldType,
  value: string,
  validationStyle: ValidationStyle,
): ValidationError[] {
  const errors: ValidationError[] = [];

  switch (type) {
    case 'email':
      if (!PATTERNS.email.test(value)) {
        const isStrict = validationStyle === 'strict';
        if (isStrict || validationStyle === 'adaptive') {
          errors.push({
            field: type,
            message: 'Please enter a valid email address',
            code: 'EMAIL',
          });
        }
      }
      break;

    case 'phone':
      if (!PATTERNS.phone.test(value)) {
        const isStrict = validationStyle === 'strict';
        if (isStrict) {
          errors.push({
            field: type,
            message: 'Please enter a valid phone number',
            code: 'PHONE',
          });
        }
      }
      break;

    case 'url':
      if (!PATTERNS.url.test(value)) {
        errors.push({
          field: type,
          message: 'Please enter a valid URL',
          code: 'URL',
        });
      }
      break;

    case 'password':
      if (value.length < PATTERNS.passwordMinLength) {
        const isStrict = validationStyle === 'strict';
        if (isStrict || validationStyle === 'adaptive') {
          errors.push({
            field: type,
            message: `Password must be at least ${PATTERNS.passwordMinLength} characters`,
            code: 'PASSWORD',
          });
        }
      }
      break;
  }

  return errors;
}

/**
 * Get required field message based on demographic
 */
function getRequiredMessage(_fieldType: FieldType, demographic: string): string {
  const voices = SUGGESTION_VOICES[demographic] || SUGGESTION_VOICES.working_class;
  return voices?.required || 'This field is required';
}

/**
 * Get pattern validation message based on demographic
 */
function getPatternMessage(fieldType: FieldType, demographic: string): string {
  const voices = SUGGESTION_VOICES[demographic] || SUGGESTION_VOICES.working_class;
  if (!voices) return 'Please check the format';

  switch (fieldType) {
    case 'email':
      return voices.email || 'Please enter a valid email address';
    case 'password':
      return voices.password || 'Password does not meet requirements';
    default:
      return voices.format || 'Please check the format';
  }
}

/**
 * Create a validation rule for a field
 */
export function createValidationRule(
  type: FieldType,
  options: Partial<ValidationRule> = {},
): ValidationRule {
  return {
    type,
    required: options.required,
    minLength: options.minLength,
    maxLength: options.maxLength,
    pattern: options.pattern,
    customValidator: options.customValidator,
    demographicOverrides: options.demographicOverrides,
  };
}

/**
 * Common validation rules
 */
export const CommonValidationRules = {
  email: createValidationRule('email', { required: true, pattern: PATTERNS.email.source }),
  password: createValidationRule('password', {
    required: true,
    minLength: PATTERNS.passwordMinLength,
    maxLength: PATTERNS.passwordMaxLength,
  }),
  phone: createValidationRule('phone', { pattern: PATTERNS.phone.source }),
  url: createValidationRule('url', { pattern: PATTERNS.url.source }),
  requiredText: createValidationRule('text', { required: true }),
  optionalText: createValidationRule('text', { required: false }),
} as const;
