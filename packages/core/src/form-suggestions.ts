/**
 * Form Suggestion System
 *
 * Provides actionable suggestions based on validation errors and user input.
 * Supports demographic-specific suggestion voices and patterns.
 */

import type {
  FieldType,
  Suggestion,
  SuggestionPattern,
  SuggestionTrigger,
  ValidationError,
} from '@skeed/contracts';

export interface SuggestionEngine {
  getSuggestion(error: ValidationError, fieldType: FieldType, demographic: string): Suggestion;
  getSuggestionsForField(fieldType: FieldType, value: string, demographic: string): Suggestion[];
  shouldShowSuggestion(pattern: SuggestionPattern, hasError: boolean): boolean;
}

/**
 * Demographic-specific suggestion patterns
 */
const DEMOGRAPHIC_SUGGESTION_PATTERNS: Record<string, Record<string, Suggestion[]>> = {
  kids: {
    email: [
      {
        field: 'email',
        message: 'Try adding an @ symbol! 📧',
        action: 'explain',
      },
      {
        field: 'email',
        message: 'Example: name@gmail.com',
        action: 'explain',
      },
    ],
    password: [
      {
        field: 'password',
        message: 'Add a number to make it stronger! 🔢',
        action: 'explain',
      },
      {
        field: 'password',
        message: 'Try adding an uppercase letter! 🔠',
        action: 'explain',
      },
    ],
  },
  fintech: {
    email: [
      {
        field: 'email',
        message: 'Please enter a valid email address',
        action: 'format',
      },
    ],
    password: [
      {
        field: 'password',
        message: 'Include uppercase, lowercase, and numbers',
        action: 'explain',
      },
    ],
  },
  gov: {
    email: [
      {
        field: 'email',
        message: 'Please enter a valid email address',
        action: 'format',
      },
    ],
    password: [
      {
        field: 'password',
        message: 'Password must meet security requirements',
        action: 'explain',
      },
    ],
  },
  health: {
    email: [
      {
        field: 'email',
        message: 'Please enter a valid email address',
        action: 'format',
      },
    ],
    password: [
      {
        field: 'password',
        message: 'Password must meet HIPAA requirements',
        action: 'explain',
      },
    ],
  },
  working_class: {
    email: [
      {
        field: 'email',
        message: 'Check your email format',
        action: 'format',
      },
    ],
    password: [
      {
        field: 'password',
        message: 'Try adding more characters for security',
        action: 'explain',
      },
    ],
  },
};

/**
 * Common error-to-suggestion mappings
 */
const ERROR_SUGGESTIONS: Record<string, { message: string; action: Suggestion['action'] }> = {
  REQUIRED: {
    message: 'This field is required',
    action: 'explain',
  },
  MIN_LENGTH: {
    message: 'Add more characters',
    action: 'explain',
  },
  MAX_LENGTH: {
    message: 'Shorten your input',
    action: 'replace',
  },
  PATTERN: {
    message: 'Check the format',
    action: 'format',
  },
  EMAIL: {
    message: 'Check email format (e.g., user@example.com)',
    action: 'format',
  },
  PASSWORD: {
    message: 'Strengthen your password',
    action: 'explain',
  },
  PHONE: {
    message: 'Check phone format (e.g., +1 555-123-4567)',
    action: 'format',
  },
};

/**
 * Create a suggestion engine instance
 */
export function createSuggestionEngine(): SuggestionEngine {
  return {
    getSuggestion,
    getSuggestionsForField,
    shouldShowSuggestion,
  };
}

/**
 * Get a suggestion for a validation error
 */
function getSuggestion(
  error: ValidationError,
  fieldType: FieldType,
  demographic: string,
): Suggestion {
  const baseSuggestion = ERROR_SUGGESTIONS[error.code] || {
    message: 'Please check your input',
    action: 'explain',
  };

  // Apply demographic-specific voice
  const demographicPatterns = DEMOGRAPHIC_SUGGESTION_PATTERNS[demographic];
  if (demographicPatterns?.[fieldType]) {
    const fieldSuggestions = demographicPatterns[fieldType];
    if (fieldSuggestions.length > 0) {
      // Return the first matching suggestion for this field type
      const firstSuggestion = fieldSuggestions[0];
      if (firstSuggestion) {
        return {
          field: error.field,
          message: firstSuggestion.message || baseSuggestion.message,
          action: firstSuggestion.action || baseSuggestion.action,
          value: firstSuggestion.value,
        };
      }
    }
  }

  return {
    field: error.field,
    message: baseSuggestion.message || 'Please check your input',
    action: (baseSuggestion.action as Suggestion['action']) || 'explain',
  };
}

/**
 * Get suggestions for a field based on current value
 */
function getSuggestionsForField(
  fieldType: FieldType,
  value: string,
  demographic: string,
): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // Get demographic-specific patterns
  const demographicPatterns = DEMOGRAPHIC_SUGGESTION_PATTERNS[demographic];
  if (demographicPatterns?.[fieldType]) {
    suggestions.push(...demographicPatterns[fieldType]);
  }

  // Add field-type specific suggestions based on value
  if (fieldType === 'email' && value && !value.includes('@')) {
    suggestions.push({
      field: fieldType,
      message: 'Add an @ symbol',
      action: 'format',
    });
  }

  if (fieldType === 'password' && value && value.length < 8) {
    suggestions.push({
      field: fieldType,
      message: 'Add more characters (minimum 8)',
      action: 'explain',
    });
  }

  if (fieldType === 'password' && value && !/[A-Z]/.test(value)) {
    suggestions.push({
      field: fieldType,
      message: 'Add an uppercase letter',
      action: 'explain',
    });
  }

  if (fieldType === 'password' && value && !/[0-9]/.test(value)) {
    suggestions.push({
      field: fieldType,
      message: 'Add a number',
      action: 'explain',
    });
  }

  return suggestions;
}

/**
 * Determine if a suggestion should be shown based on pattern
 */
function shouldShowSuggestion(pattern: SuggestionPattern, hasError: boolean): boolean {
  switch (pattern.trigger) {
    case 'on-error':
      return hasError;
    case 'on-blur':
      return true; // Shown on blur regardless of error
    case 'on-type':
      return true; // Shown while typing
    case 'manual':
      return false; // Only shown when manually requested
    default:
      return hasError;
  }
}

/**
 * Create a suggestion pattern for a field
 */
export function createSuggestionPattern(
  fieldType: FieldType,
  trigger: SuggestionTrigger,
  options: Partial<SuggestionPattern> = {},
): SuggestionPattern {
  return {
    fieldType,
    trigger,
    debounceMs: options.debounceMs || 300,
    showInline: options.showInline !== false,
    showDropdown: options.showDropdown || false,
    maxSuggestions: options.maxSuggestions || 3,
  };
}

/**
 * Common suggestion patterns
 */
export const CommonSuggestionPatterns = {
  emailOnError: createSuggestionPattern('email', 'on-error'),
  emailOnBlur: createSuggestionPattern('email', 'on-blur'),
  passwordOnType: createSuggestionPattern('password', 'on-type', { debounceMs: 500 }),
  requiredOnError: createSuggestionPattern('text', 'on-error'),
} as const;

/**
 * Format a suggestion for display
 */
export function formatSuggestion(suggestion: Suggestion): string {
  switch (suggestion.action) {
    case 'accept':
      return `Accept: ${suggestion.message}`;
    case 'replace':
      return `Replace with: ${suggestion.value || suggestion.message}`;
    case 'format':
      return `Format: ${suggestion.message}`;
    case 'explain':
      return suggestion.message;
    default:
      return suggestion.message;
  }
}

/**
 * Get suggestion icon based on action type
 */
export function getSuggestionIcon(action: Suggestion['action']): string {
  switch (action) {
    case 'accept':
      return '✓';
    case 'replace':
      return '↻';
    case 'format':
      return '✎';
    case 'explain':
      return 'ℹ';
    default:
      return 'ℹ';
  }
}
