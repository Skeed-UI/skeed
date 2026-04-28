/**
 * Progressive Disclosure Engine
 *
 * Implements conditional, contextual, and staged disclosure patterns
 * for showing/hiding form fields based on user input and context.
 */

import type { DisclosureRule, DisclosureTrigger, FieldConfig, FormState } from '@skeed/contracts';

export interface DisclosureEngine {
  buildDisclosureRules(fields: FieldConfig[]): DisclosureRule[];
  evaluateRules(rules: DisclosureRule[], currentState: FormState): DisclosureState;
  getVisibleFields(fields: FieldConfig[], state: FormState, rules: DisclosureRule[]): FieldConfig[];
}

export interface DisclosureState {
  visibleFields: Set<string>;
  hiddenFields: Set<string>;
  triggeredRules: DisclosureRule[];
}

/**
 * Create a progressive disclosure engine instance
 */
export function createDisclosureEngine(): DisclosureEngine {
  return {
    buildDisclosureRules,
    evaluateRules,
    getVisibleFields,
  };
}

/**
 * Build disclosure rules from field configurations
 * Analyzes field dependencies and relationships to auto-generate rules
 */
function buildDisclosureRules(fields: FieldConfig[]): DisclosureRule[] {
  const rules: DisclosureRule[] = [];

  for (const field of fields) {
    // Auto-generate rules based on field dependencies
    if (field.dependencies && field.dependencies.length > 0) {
      for (const dep of field.dependencies) {
        rules.push({
          fieldId: dep,
          trigger: {
            field: dep,
            operator: 'equals',
            value: true,
          },
          showFields: [field.id],
        });
      }
    }

    // Auto-generate rules for common patterns
    // e.g., show "state" when "country" is selected
    if (field.id.toLowerCase().includes('state') || field.id.toLowerCase().includes('region')) {
      const countryField = fields.find(
        (f) => f.id.toLowerCase().includes('country') || f.id.toLowerCase().includes('nation'),
      );
      if (countryField) {
        rules.push({
          fieldId: countryField.id,
          trigger: {
            field: countryField.id,
            operator: 'not-equals',
            value: '',
          },
          showFields: [field.id],
        });
      }
    }

    // Auto-generate rules for conditional fields
    // e.g., show "company" only if email domain is corporate
    if (field.category === 'professional') {
      const emailField = fields.find((f) => f.type === 'email');
      if (emailField) {
        rules.push({
          fieldId: emailField.id,
          trigger: {
            field: emailField.id,
            operator: 'contains',
            value: '@', // Has email
          },
          showFields: [field.id],
        });
      }
    }
  }

  return rules;
}

/**
 * Evaluate disclosure rules against current form state
 */
function evaluateRules(rules: DisclosureRule[], currentState: FormState): DisclosureState {
  const visibleFields = new Set<string>();
  const hiddenFields = new Set<string>();
  const triggeredRules: DisclosureRule[] = [];

  for (const rule of rules) {
    const triggerValue = currentState[rule.trigger.field];
    const isTriggered = evaluateTrigger(rule.trigger, triggerValue);

    if (isTriggered) {
      triggeredRules.push(rule);
      for (const fieldId of rule.showFields) {
        visibleFields.add(fieldId);
        hiddenFields.delete(fieldId);
      }
      if (rule.hideFields) {
        for (const fieldId of rule.hideFields) {
          hiddenFields.add(fieldId);
          visibleFields.delete(fieldId);
        }
      }
    }
  }

  return {
    visibleFields,
    hiddenFields,
    triggeredRules,
  };
}

/**
 * Get the list of visible fields based on current state and rules
 */
function getVisibleFields(
  fields: FieldConfig[],
  state: FormState,
  rules: DisclosureRule[],
): FieldConfig[] {
  const disclosureState = evaluateRules(rules, state);
  return fields.filter((field) => {
    // Field is visible if it's not explicitly hidden
    if (disclosureState.hiddenFields.has(field.id)) {
      return false;
    }
    // Field is visible if it's explicitly shown or has no rules affecting it
    return true;
  });
}

/**
 * Evaluate a single trigger condition
 */
function evaluateTrigger(trigger: DisclosureTrigger, currentValue: unknown): boolean {
  switch (trigger.operator) {
    case 'equals':
      return currentValue === trigger.value;
    case 'not-equals':
      return currentValue !== trigger.value;
    case 'contains':
      return typeof currentValue === 'string' && currentValue.includes(String(trigger.value));
    case 'not-contains':
      return typeof currentValue === 'string' && !currentValue.includes(String(trigger.value));
    case 'greater-than':
      return typeof currentValue === 'number' && currentValue > Number(trigger.value);
    case 'less-than':
      return typeof currentValue === 'number' && currentValue < Number(trigger.value);
    default:
      return false;
  }
}

/**
 * Helper to create custom disclosure rules
 */
export function createDisclosureRule(
  fieldId: string,
  operator: DisclosureTrigger['operator'],
  value: unknown,
  showFields: string[],
  hideFields?: string[],
): DisclosureRule {
  return {
    fieldId,
    trigger: {
      field: fieldId,
      operator,
      value,
    },
    showFields,
    hideFields,
  };
}

/**
 * Common disclosure rule patterns
 */
export const DisclosurePatterns = {
  /**
   * Show fields when a checkbox is checked
   */
  whenChecked: (fieldId: string, showFields: string[]): DisclosureRule =>
    createDisclosureRule(fieldId, 'equals', true, showFields),

  /**
   * Show fields when a specific value is selected
   */
  whenValue: (fieldId: string, value: unknown, showFields: string[]): DisclosureRule =>
    createDisclosureRule(fieldId, 'equals', value, showFields),

  /**
   * Show fields when a field has any value
   */
  whenNotEmpty: (fieldId: string, showFields: string[]): DisclosureRule =>
    createDisclosureRule(fieldId, 'not-equals', '', showFields),

  /**
   * Show fields when a field contains a substring
   */
  whenContains: (fieldId: string, substring: string, showFields: string[]): DisclosureRule =>
    createDisclosureRule(fieldId, 'contains', substring, showFields),
} as const;
