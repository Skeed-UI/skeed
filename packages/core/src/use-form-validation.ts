/**
 * React hooks for form validation and suggestions
 *
 * Provides hooks for integrating the validation and suggestion engines
 * into React components with real-time feedback.
 */

import type {
  FieldType,
  FormState,
  Suggestion,
  ValidationResult,
  ValidationRule,
} from '@skeed/contracts';
import { useCallback, useRef, useState } from 'react';
import { type SuggestionEngine, createSuggestionEngine } from './form-suggestions.js';
import { type ValidationEngine, createValidationEngine } from './form-validation.js';

export interface UseFormValidationOptions {
  demographic: string;
  rules: Record<string, ValidationRule>;
  validateOnBlur?: boolean;
  validateOnChange?: boolean;
  debounceMs?: number;
}

export interface UseFormValidationReturn {
  state: FormState;
  errors: Record<string, string>;
  suggestions: Record<string, Suggestion[]>;
  isValid: boolean;
  validate: () => boolean;
  validateField: (fieldId: string, value: string) => ValidationResult;
  setFieldValue: (fieldId: string, value: string) => void;
  clearError: (fieldId: string) => void;
  clearAllErrors: () => void;
}

/**
 * Hook for form validation with real-time feedback
 */
export function useFormValidation(options: UseFormValidationOptions): UseFormValidationReturn {
  const {
    demographic,
    rules,
    validateOnBlur = true,
    validateOnChange = false,
    debounceMs = 300,
  } = options;

  const validationEngine = useRef<ValidationEngine>(createValidationEngine());
  const suggestionEngine = useRef<SuggestionEngine>(createSuggestionEngine());

  const [state, setState] = useState<FormState>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [suggestions, setSuggestions] = useState<Record<string, Suggestion[]>>({});
  const [isValid, setIsValid] = useState(true);

  const validateField = useCallback(
    (fieldId: string, value: string): ValidationResult => {
      const fieldRules = rules[fieldId];
      if (!fieldRules) {
        return { isValid: true, errors: [] };
      }

      const result = validationEngine.current.validateField(value, fieldRules, demographic);

      // Update errors state
      setErrors((prev) => {
        const next = { ...prev };
        if (result.errors.length > 0) {
          next[fieldId] = result.errors[0]?.message ?? '';
        } else {
          delete next[fieldId];
        }
        return next;
      });

      // Update suggestions
      if (result.errors.length > 0) {
        const suggestion = suggestionEngine.current.getSuggestion(
          result.errors[0]!,
          fieldRules.type,
          demographic,
        );
        setSuggestions((prev) => ({
          ...prev,
          [fieldId]: [suggestion],
        }));
      } else {
        setSuggestions((prev) => {
          const next = { ...prev };
          delete next[fieldId];
          return next;
        });
      }

      return result;
    },
    [demographic, rules],
  );

  const validate = useCallback((): boolean => {
    const result = validationEngine.current.validateForm(state, rules, demographic);

    const errorMap: Record<string, string> = {};
    for (const error of result.errors) {
      errorMap[error.field] = error.message;
    }
    setErrors(errorMap);
    setIsValid(result.isValid);

    return result.isValid;
  }, [state, rules, demographic]);

  const setFieldValue = useCallback(
    (fieldId: string, value: string) => {
      setState((prev) => ({ ...prev, [fieldId]: value }));

      if (validateOnChange) {
        validateField(fieldId, value);
      }
    },
    [validateOnChange, validateField],
  );

  const clearError = useCallback((fieldId: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
    setSuggestions((prev) => {
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
    setSuggestions({});
  }, []);

  return {
    state,
    errors,
    suggestions,
    isValid,
    validate,
    validateField,
    setFieldValue,
    clearError,
    clearAllErrors,
  };
}

/**
 * Hook for debounced field validation
 */
export function useDebouncedValidation(validateFn: (value: string) => void, delayMs = 300) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedValidate = useCallback(
    (value: string) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        validateFn(value);
      }, delayMs);
    },
    [validateFn, delayMs],
  );

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return { debouncedValidate, cancel };
}

/**
 * Hook for field-level validation state
 */
export function useFieldValidation(
  _fieldId: string,
  fieldType: FieldType,
  demographic: string,
  options: { required?: boolean; minLength?: number; maxLength?: number; pattern?: string } = {},
) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [touched, setTouched] = useState(false);

  const validationEngine = useRef<ValidationEngine>(createValidationEngine());
  const suggestionEngine = useRef<SuggestionEngine>(createSuggestionEngine());

  const { debouncedValidate, cancel } = useDebouncedValidation((val) => {
    const rule = {
      type: fieldType,
      required: options.required,
      minLength: options.minLength,
      maxLength: options.maxLength,
      pattern: options.pattern,
    };

    const result = validationEngine.current.validateField(val, rule, demographic);

    if (result.errors.length > 0) {
      setError(result.errors[0]?.message ?? null);
      setSuggestion(
        suggestionEngine.current.getSuggestion(result.errors[0]!, fieldType, demographic),
      );
    } else {
      setError(null);
      setSuggestion(null);
    }
  });

  const handleChange = useCallback(
    (newValue: string) => {
      setValue(newValue);
      if (touched) {
        debouncedValidate(newValue);
      }
    },
    [touched, debouncedValidate],
  );

  const handleBlur = useCallback(() => {
    setTouched(true);
    cancel();
    const rule = {
      type: fieldType,
      required: options.required,
      minLength: options.minLength,
      maxLength: options.maxLength,
      pattern: options.pattern,
    };

    const result = validationEngine.current.validateField(value, rule, demographic);

    if (result.errors.length > 0) {
      setError(result.errors[0]?.message ?? null);
      setSuggestion(
        suggestionEngine.current.getSuggestion(result.errors[0]!, fieldType, demographic),
      );
    } else {
      setError(null);
      setSuggestion(null);
    }
  }, [value, fieldType, demographic, options, cancel]);

  return {
    value,
    error,
    suggestion,
    touched,
    isValid: !error,
    handleChange,
    handleBlur,
    setValue,
  };
}
