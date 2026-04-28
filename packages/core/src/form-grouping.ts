/**
 * Answer Grouping Engine
 *
 * Intelligently groups configuration options based on semantic, functional,
 * frequency, or dependency relationships between fields.
 */

import type { FieldGroup, GroupingStrategy } from '@skeed/contracts';

export interface FieldConfig {
  id: string;
  label: string;
  type: string;
  category?: string;
  required?: boolean;
  dependencies?: string[];
  keywords?: string[];
}

export interface GroupingEngine {
  groupFields(fields: FieldConfig[], strategy: GroupingStrategy): FieldGroup[];
  detectRelatedFields(field: FieldConfig, allFields: FieldConfig[]): FieldConfig[];
  suggestGroupLabel(fields: FieldConfig[]): string;
}

/**
 * Common field categories for semantic grouping
 */
const SEMANTIC_CATEGORIES = {
  personal: ['name', 'firstName', 'lastName', 'fullName', 'age', 'dob', 'birthday'],
  contact: ['email', 'phone', 'mobile', 'address', 'city', 'state', 'zip', 'country'],
  account: ['username', 'password', 'confirmPassword', 'securityQuestion', 'answer'],
  preferences: ['language', 'timezone', 'theme', 'notifications', 'newsletter'],
  professional: ['company', 'title', 'department', 'industry', 'website'],
  financial: ['cardNumber', 'expiry', 'cvv', 'bankAccount', 'routing'],
} as const;

/**
 * Common functional groups for functional grouping
 */
const FUNCTIONAL_GROUPS = {
  accountSetup: ['username', 'email', 'password', 'confirmPassword'],
  security: ['password', 'confirmPassword', 'securityQuestion', 'twoFactor'],
  contactInfo: ['email', 'phone', 'address', 'city', 'state', 'zip'],
  preferences: ['language', 'timezone', 'theme', 'notifications'],
  payment: ['cardNumber', 'expiry', 'cvv', 'billingAddress'],
} as const;

/**
 * Create a grouping engine instance
 */
export function createGroupingEngine(): GroupingEngine {
  return {
    groupFields,
    detectRelatedFields,
    suggestGroupLabel,
  };
}

/**
 * Group fields based on the specified strategy
 */
function groupFields(fields: FieldConfig[], strategy: GroupingStrategy): FieldGroup[] {
  switch (strategy) {
    case 'semantic':
      return groupBySemantics(fields);
    case 'functional':
      return groupByFunction(fields);
    case 'frequency':
      return groupByFrequency(fields);
    case 'dependency':
      return groupByDependency(fields);
    case 'none':
      return groupNone(fields);
    default:
      return groupBySemantics(fields);
  }
}

/**
 * Group fields by semantic categories (meaning-based)
 */
function groupBySemantics(fields: FieldConfig[]): FieldGroup[] {
  const groups = new Map<string, FieldConfig[]>();
  const ungrouped: FieldConfig[] = [];

  for (const field of fields) {
    const category = findSemanticCategory(field);
    if (category) {
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(field);
    } else {
      ungrouped.push(field);
    }
  }

  const result: FieldGroup[] = [];
  let order = 0;

  // Convert groups to FieldGroup objects
  for (const [category, categoryFields] of groups.entries()) {
    result.push({
      id: `group-${category}`,
      label: formatGroupLabel(category),
      fields: categoryFields.map((f) => f.id),
      collapsible: categoryFields.length > 3,
      defaultExpanded: true,
      order: order++,
    });
  }

  // Add ungrouped fields as a single group if any
  if (ungrouped.length > 0) {
    result.push({
      id: 'group-other',
      label: 'Other',
      fields: ungrouped.map((f) => f.id),
      collapsible: false,
      defaultExpanded: true,
      order: order++,
    });
  }

  return result.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

/**
 * Group fields by functional task (what they accomplish)
 */
function groupByFunction(fields: FieldConfig[]): FieldGroup[] {
  const groups = new Map<string, FieldConfig[]>();
  const ungrouped: FieldConfig[] = [];

  for (const field of fields) {
    const group = findFunctionalGroup(field);
    if (group) {
      if (!groups.has(group)) {
        groups.set(group, []);
      }
      groups.get(group)!.push(field);
    } else {
      ungrouped.push(field);
    }
  }

  const result: FieldGroup[] = [];
  let order = 0;

  for (const [groupName, groupFields] of groups.entries()) {
    result.push({
      id: `group-${groupName}`,
      label: formatGroupLabel(groupName),
      fields: groupFields.map((f) => f.id),
      collapsible: groupFields.length > 2,
      defaultExpanded: groupName === 'accountSetup',
      order: order++,
    });
  }

  if (ungrouped.length > 0) {
    result.push({
      id: 'group-other',
      label: 'Additional Information',
      fields: ungrouped.map((f) => f.id),
      collapsible: true,
      defaultExpanded: false,
      order: order++,
    });
  }

  return result.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

/**
 * Group fields by usage frequency (required first, then optional)
 */
function groupByFrequency(fields: FieldConfig[]): FieldGroup[] {
  const required = fields.filter((f) => f.required);
  const optional = fields.filter((f) => !f.required);

  const result: FieldGroup[] = [];

  if (required.length > 0) {
    result.push({
      id: 'group-required',
      label: 'Required Information',
      fields: required.map((f) => f.id),
      collapsible: false,
      defaultExpanded: true,
      order: 0,
    });
  }

  if (optional.length > 0) {
    result.push({
      id: 'group-optional',
      label: 'Optional Information',
      fields: optional.map((f) => f.id),
      collapsible: true,
      defaultExpanded: false,
      order: 1,
    });
  }

  return result;
}

/**
 * Group fields by dependencies (fields that depend on each other)
 */
function groupByDependency(fields: FieldConfig[]): FieldGroup[] {
  const groups = new Map<string, FieldConfig[]>();
  const processed = new Set<string>();
  let order = 0;

  for (const field of fields) {
    if (processed.has(field.id)) continue;

    const group = [field];
    processed.add(field.id);

    // Find fields that depend on this field or that this field depends on
    for (const other of fields) {
      if (processed.has(other.id)) continue;

      const hasDependency =
        (field.dependencies?.includes(other.id) ?? false) ||
        (other.dependencies?.includes(field.id) ?? false);

      if (hasDependency) {
        group.push(other);
        processed.add(other.id);
      }
    }

    if (group.length > 1) {
      const groupId = `group-dependency-${order}`;
      groups.set(groupId, group);
    } else {
      // Single field with no dependencies
      const groupId = `group-single-${order}`;
      groups.set(groupId, group);
    }

    order++;
  }

  const result: FieldGroup[] = [];
  let groupOrder = 0;

  for (const [groupId, groupFields] of groups.entries()) {
    result.push({
      id: groupId,
      label: suggestGroupLabel(groupFields),
      fields: groupFields.map((f) => f.id),
      collapsible: groupFields.length > 2,
      defaultExpanded: true,
      order: groupOrder++,
    });
  }

  return result.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

/**
 * No grouping - all fields in a single group
 */
function groupNone(fields: FieldConfig[]): FieldGroup[] {
  return [
    {
      id: 'group-all',
      label: 'All Fields',
      fields: fields.map((f) => f.id),
      collapsible: false,
      defaultExpanded: true,
      order: 0,
    },
  ];
}

/**
 * Detect fields related to a given field
 */
function detectRelatedFields(field: FieldConfig, allFields: FieldConfig[]): FieldConfig[] {
  const related: FieldConfig[] = [];

  for (const other of allFields) {
    if (other.id === field.id) continue;

    // Check for explicit dependencies
    if (field.dependencies?.includes(other.id) || other.dependencies?.includes(field.id)) {
      related.push(other);
      continue;
    }

    // Check for semantic relationship
    const fieldCategory = findSemanticCategory(field);
    const otherCategory = findSemanticCategory(other);
    if (fieldCategory && fieldCategory === otherCategory) {
      related.push(other);
    }
  }

  return related;
}

/**
 * Suggest a label for a group of fields
 */
function suggestGroupLabel(fields: FieldConfig[]): string {
  if (fields.length === 0) return 'Group';
  if (fields.length === 1) {
    const firstField = fields[0];
    return firstField?.label || 'Group';
  }

  // Check if all fields belong to a semantic category
  const categories = new Set<string>();
  for (const field of fields) {
    const category = findSemanticCategory(field);
    if (category) categories.add(category);
  }

  if (categories.size === 1) {
    const firstCategory = Array.from(categories)[0];
    if (firstCategory) {
      return formatGroupLabel(firstCategory);
    }
  }

  // Check if all fields belong to a functional group
  const groups = new Set<string>();
  for (const field of fields) {
    const group = findFunctionalGroup(field);
    if (group) groups.add(group);
  }

  if (groups.size === 1) {
    const firstGroup = Array.from(groups)[0];
    if (firstGroup) {
      return formatGroupLabel(firstGroup);
    }
  }

  // Default: use the first field's label as a hint
  return `${fields[0]!.label} & ${fields.length - 1} more`;
}

/**
 * Find the semantic category for a field
 */
function findSemanticCategory(field: FieldConfig): string | null {
  const fieldId = field.id.toLowerCase();
  const fieldLabel = field.label.toLowerCase();

  for (const [category, keywords] of Object.entries(SEMANTIC_CATEGORIES)) {
    for (const keyword of keywords) {
      if (fieldId.includes(keyword.toLowerCase()) || fieldLabel.includes(keyword.toLowerCase())) {
        return category;
      }
    }
  }

  return null;
}

/**
 * Find the functional group for a field
 */
function findFunctionalGroup(field: FieldConfig): string | null {
  const fieldId = field.id.toLowerCase();

  for (const [groupName, fieldIds] of Object.entries(FUNCTIONAL_GROUPS)) {
    for (const id of fieldIds) {
      if (fieldId.includes(id.toLowerCase())) {
        return groupName;
      }
    }
  }

  return null;
}

/**
 * Format a category/group name into a human-readable label
 */
function formatGroupLabel(name: string): string {
  return name
    .split(/(?=[A-Z])/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
