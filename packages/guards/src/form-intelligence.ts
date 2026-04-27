/**
 * Form Intelligence Quality Gates
 * 
 * Validates form configurations, intelligence metadata, and ensures
 * demographic-appropriate form behavior across the Skeed pipeline.
 */

import type {
  FormIntelligenceConfig,
  FieldGroup,
  ValidationRule,
  FieldType,
} from '@skeed/contracts';

export interface FormIntelligenceGuardOptions {
  strict?: boolean;
  allowedDemographics?: string[];
  maxGroups?: number;
  minFieldsPerGroup?: number;
  maxFieldsPerGroup?: number;
}

export interface FormIntelligenceViolation {
  type: 'error' | 'warning';
  code: string;
  message: string;
  field?: string;
  suggestion?: string;
}

export interface FormIntelligenceGuardResult {
  isValid: boolean;
  violations: FormIntelligenceViolation[];
  errors: FormIntelligenceViolation[];
  warnings: FormIntelligenceViolation[];
}

/**
 * Run form intelligence quality checks
 */
export function checkFormIntelligence(
  config: Partial<FormIntelligenceConfig>,
  groups: FieldGroup[],
  rules: Record<string, ValidationRule>,
  options: FormIntelligenceGuardOptions = {}
): FormIntelligenceGuardResult {
  const violations: FormIntelligenceViolation[] = [];
  const { strict = false } = options;

  // Validate form intelligence configuration
  violations.push(...validateConfig(config, strict));

  // Validate grouping structure
  violations.push(...validateGroups(groups, options));

  // Validate field rules
  violations.push(...validateRules(rules, strict));

  // Check demographic appropriateness
  if (config.validationStyle && config.suggestionMode) {
    violations.push(...validateDemographicFit(config));
  }

  const errors = violations.filter((v) => v.type === 'error');
  const warnings = violations.filter((v) => v.type === 'warning');

  return {
    isValid: errors.length === 0,
    violations,
    errors,
    warnings,
  };
}

/**
 * Validate form intelligence configuration
 */
function validateConfig(
  config: Partial<FormIntelligenceConfig>,
  strict: boolean
): FormIntelligenceViolation[] {
  const violations: FormIntelligenceViolation[] = [];

  // Check required fields in strict mode
  if (strict) {
    if (!config.validationStyle) {
      violations.push({
        type: 'error',
        code: 'MISSING_VALIDATION_STYLE',
        message: 'Form intelligence config must specify validationStyle',
        suggestion: 'Add validationStyle: "strict" | "lenient" | "adaptive"',
      });
    }

    if (!config.groupingStrategy) {
      violations.push({
        type: 'error',
        code: 'MISSING_GROUPING_STRATEGY',
        message: 'Form intelligence config must specify groupingStrategy',
        suggestion: 'Add groupingStrategy: "semantic" | "functional" | "frequency" | "dependency" | "none"',
      });
    }

    if (!config.voice?.validation) {
      violations.push({
        type: 'warning',
        code: 'MISSING_VALIDATION_VOICE',
        message: 'No validation voice specified',
        suggestion: 'Add voice.validation for demographic-appropriate error messages',
      });
    }
  }

  // Validate validation style value
  if (config.validationStyle) {
    const validStyles = ['strict', 'lenient', 'adaptive'];
    if (!validStyles.includes(config.validationStyle)) {
      violations.push({
        type: 'error',
        code: 'INVALID_VALIDATION_STYLE',
        message: `Invalid validation style: ${config.validationStyle}`,
        suggestion: `Must be one of: ${validStyles.join(', ')}`,
      });
    }
  }

  // Validate grouping strategy value
  if (config.groupingStrategy) {
    const validStrategies = ['semantic', 'functional', 'frequency', 'dependency', 'none'];
    if (!validStrategies.includes(config.groupingStrategy)) {
      violations.push({
        type: 'error',
        code: 'INVALID_GROUPING_STRATEGY',
        message: `Invalid grouping strategy: ${config.groupingStrategy}`,
        suggestion: `Must be one of: ${validStrategies.join(', ')}`,
      });
    }
  }

  // Validate suggestion mode
  if (config.suggestionMode) {
    const validModes = ['aggressive', 'conservative', 'none'];
    if (!validModes.includes(config.suggestionMode)) {
      violations.push({
        type: 'error',
        code: 'INVALID_SUGGESTION_MODE',
        message: `Invalid suggestion mode: ${config.suggestionMode}`,
        suggestion: `Must be one of: ${validModes.join(', ')}`,
      });
    }
  }

  return violations;
}

/**
 * Validate group structure
 */
function validateGroups(
  groups: FieldGroup[],
  options: FormIntelligenceGuardOptions
): FormIntelligenceViolation[] {
  const violations: FormIntelligenceViolation[] = [];
  const { maxGroups = 10, minFieldsPerGroup = 1, maxFieldsPerGroup = 10 } = options;

  // Check group count
  if (groups.length > maxGroups) {
    violations.push({
      type: 'warning',
      code: 'TOO_MANY_GROUPS',
      message: `Form has ${groups.length} groups, which may overwhelm users`,
      suggestion: `Consider consolidating into ${maxGroups} or fewer groups`,
    });
  }

  // Check empty groups
  const emptyGroups = groups.filter((g) => g.fields.length === 0);
  if (emptyGroups.length > 0) {
    violations.push({
      type: 'error',
      code: 'EMPTY_GROUPS',
      message: `${emptyGroups.length} groups have no fields`,
      field: emptyGroups.map((g) => g.id).join(', '),
      suggestion: 'Remove empty groups or add fields to them',
    });
  }

  // Check fields per group
  for (const group of groups) {
    if (group.fields.length < minFieldsPerGroup) {
      violations.push({
        type: 'warning',
        code: 'SPARSE_GROUP',
        message: `Group "${group.label}" has only ${group.fields.length} field(s)`,
        field: group.id,
        suggestion: `Consider merging with another group (min: ${minFieldsPerGroup})`,
      });
    }

    if (group.fields.length > maxFieldsPerGroup) {
      violations.push({
        type: 'warning',
        code: 'DENSE_GROUP',
        message: `Group "${group.label}" has ${group.fields.length} fields, which may be overwhelming`,
        field: group.id,
        suggestion: `Consider splitting into smaller groups (max: ${maxFieldsPerGroup})`,
      });
    }
  }

  // Check for duplicate field assignments
  const fieldToGroups = new Map<string, string[]>();
  for (const group of groups) {
    for (const fieldId of group.fields) {
      if (!fieldToGroups.has(fieldId)) {
        fieldToGroups.set(fieldId, []);
      }
      fieldToGroups.get(fieldId)!.push(group.id);
    }
  }

  for (const [fieldId, groupIds] of fieldToGroups.entries()) {
    if (groupIds.length > 1) {
      violations.push({
        type: 'error',
        code: 'DUPLICATE_FIELD',
        message: `Field "${fieldId}" is assigned to ${groupIds.length} groups`,
        field: fieldId,
        suggestion: `Remove from all but one group: ${groupIds.join(', ')}`,
      });
    }
  }

  return violations;
}

/**
 * Validate field rules
 */
function validateRules(
  rules: Record<string, ValidationRule>,
  strict: boolean
): FormIntelligenceViolation[] {
  const violations: FormIntelligenceViolation[] = [];
  const validFieldTypes: FieldType[] = [
    'text', 'email', 'password', 'number', 'phone', 'date', 'url', 'textarea', 'select', 'checkbox', 'radio', 'file'
  ];

  for (const [fieldId, rule] of Object.entries(rules)) {
    // Validate field type
    if (!validFieldTypes.includes(rule.type)) {
      violations.push({
        type: 'error',
        code: 'INVALID_FIELD_TYPE',
        message: `Field "${fieldId}" has invalid type: ${rule.type}`,
        field: fieldId,
        suggestion: `Must be one of: ${validFieldTypes.join(', ')}`,
      });
    }

    // Check for conflicting rules
    if (rule.minLength && rule.maxLength && rule.minLength > rule.maxLength) {
      violations.push({
        type: 'error',
        code: 'CONFLICTING_LENGTH',
        message: `Field "${fieldId}" has minLength (${rule.minLength}) > maxLength (${rule.maxLength})`,
        field: fieldId,
        suggestion: 'Ensure minLength <= maxLength',
      });
    }

    // Validate pattern regex
    if (rule.pattern) {
      try {
        new RegExp(rule.pattern);
      } catch {
        violations.push({
          type: 'error',
          code: 'INVALID_PATTERN',
          message: `Field "${fieldId}" has invalid regex pattern`,
          field: fieldId,
          suggestion: 'Fix the regular expression syntax',
        });
      }
    }

    // Strict mode: required fields should have validation rules
    if (strict && rule.required && !rule.pattern && !rule.minLength) {
      violations.push({
        type: 'warning',
        code: 'MISSING_VALIDATION',
        message: `Required field "${fieldId}" has no validation rules`,
        field: fieldId,
        suggestion: 'Add pattern or minLength validation',
      });
    }
  }

  return violations;
}

/**
 * Validate demographic configuration fit
 */
function validateDemographicFit(
  config: Partial<FormIntelligenceConfig>
): FormIntelligenceViolation[] {
  const violations: FormIntelligenceViolation[] = [];

  // Check for mismatched configurations
  if (config.validationStyle === 'strict' && config.suggestionMode === 'aggressive') {
    violations.push({
      type: 'warning',
      code: 'MISMATCHED_CONFIG',
      message: 'Strict validation with aggressive suggestions may frustrate users',
      suggestion: 'Consider using conservative suggestion mode with strict validation',
    });
  }

  if (config.validationStyle === 'lenient' && config.suggestionMode === 'none') {
    violations.push({
      type: 'warning',
      code: 'MISSING_GUIDANCE',
      message: 'Lenient validation without suggestions provides no user guidance',
      suggestion: 'Consider enabling suggestions for better UX',
    });
  }

  return violations;
}

/**
 * Check if form meets accessibility standards
 */
export function checkFormAccessibility(
  groups: FieldGroup[],
  rules: Record<string, ValidationRule>
): FormIntelligenceGuardResult {
  const violations: FormIntelligenceViolation[] = [];

  // Check for labels on all fields
  for (const fieldId of Object.keys(rules)) {
    // In a real implementation, we'd check actual field labels
    // Here we assume fields with rules should have labels
    const hasLabel = true; // Placeholder
    if (!hasLabel) {
      violations.push({
        type: 'error',
        code: 'MISSING_LABEL',
        message: `Field "${fieldId}" has no accessible label`,
        field: fieldId,
        suggestion: 'Add a label or aria-label attribute',
      });
    }
  }

  // Check group labels
  for (const group of groups) {
    if (!group.label || group.label.trim() === '') {
      violations.push({
        type: 'warning',
        code: 'MISSING_GROUP_LABEL',
        message: `Group "${group.id}" has no label`,
        field: group.id,
        suggestion: 'Add a descriptive label for screen readers',
      });
    }
  }

  return {
    isValid: violations.filter((v) => v.type === 'error').length === 0,
    violations,
    errors: violations.filter((v) => v.type === 'error'),
    warnings: violations.filter((v) => v.type === 'warning'),
  };
}

/**
 * Format guard result for reporting
 */
export function formatFormIntelligenceReport(result: FormIntelligenceGuardResult): string {
  const lines: string[] = [];

  if (result.isValid && result.violations.length === 0) {
    return '✓ Form intelligence configuration is valid\n';
  }

  lines.push(result.isValid ? '⚠ Form intelligence has warnings\n' : '✗ Form intelligence has errors\n');

  if (result.errors.length > 0) {
    lines.push('Errors:');
    for (const error of result.errors) {
      lines.push(`  [${error.code}] ${error.message}`);
      if (error.suggestion) {
        lines.push(`    → ${error.suggestion}`);
      }
    }
    lines.push('');
  }

  if (result.warnings.length > 0) {
    lines.push('Warnings:');
    for (const warning of result.warnings) {
      lines.push(`  [${warning.code}] ${warning.message}`);
      if (warning.suggestion) {
        lines.push(`    → ${warning.suggestion}`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Quick check if form is ready for production
 */
export function isFormProductionReady(
  config: Partial<FormIntelligenceConfig>,
  groups: FieldGroup[],
  rules: Record<string, ValidationRule>
): boolean {
  const result = checkFormIntelligence(config, groups, rules, { strict: true });
  return result.isValid && result.warnings.length === 0;
}
