# Form Intelligence System

The Skeed Form Intelligence System provides best-in-class form experiences with demographic-aware validation, smart answer grouping, progressive disclosure, and AI-powered suggestions.

## Overview

The form intelligence system is integrated into existing Skeed packages and provides:

- **Smart Answer Grouping**: Automatically groups configuration options based on semantic, functional, or frequency patterns
- **Progressive Disclosure**: Shows/hides fields conditionally based on user input
- **Demographic-Aware Validation**: Validation rules and messages tailored to each demographic
- **Real-Time Suggestions**: Actionable suggestions based on validation errors
- **Form State Tokens**: Design tokens for form states (error, success, warning)

## Architecture

### Core Packages

- `@skeed/contracts`: Type definitions and schemas for form intelligence
- `@skeed/core`: Engines for grouping, disclosure, validation, and suggestions
- `@skeed/guards`: Quality gates for form intelligence (future)

### Key Components

1. **Answer Grouping Engine** (`packages/core/src/form-grouping.ts`)
   - Groups fields by semantic categories, functional tasks, or dependencies
   - Supports 5 grouping strategies: semantic, functional, frequency, dependency, none

2. **Progressive Disclosure Engine** (`packages/core/src/progressive-disclosure.ts`)
   - Evaluates disclosure rules based on form state
   - Auto-generates rules from field dependencies
   - Common patterns: whenChecked, whenValue, whenNotEmpty, whenContains

3. **Validation Engine** (`packages/core/src/form-validation.ts`)
   - Validates fields with demographic-specific rules
   - Supports strict, lenient, and adaptive validation styles
   - Type-specific validation for email, phone, password, URL

4. **Suggestion System** (`packages/core/src/form-suggestions.ts`)
   - Provides actionable suggestions based on errors
   - Demographic-specific suggestion voices
   - Trigger patterns: on-error, on-blur, on-type, manual

5. **React Hooks** (`packages/core/src/use-form-validation.ts`)
   - `useFormValidation`: Form-level validation with real-time feedback
   - `useFieldValidation`: Field-level validation with debouncing
   - `useDebouncedValidation`: Debounced validation utility

## Demographic Configuration

Each demographic preset includes form intelligence configuration:

```json
{
  "formIntelligence": {
    "validationStyle": "adaptive",
    "suggestionMode": "conservative",
    "groupingStrategy": "functional",
    "progressiveDisclosure": "conditional",
    "smartDefaults": {
      "country": "geo-ip",
      "language": "browser",
      "timezone": "browser"
    },
    "correctionTypes": ["typo", "format"],
    "voice": {
      "validation": "practical and clear",
      "suggestion": "helpful hints",
      "success": "encouraging"
    }
  },
  "form": {
    "input": { "radius": "0.5rem" },
    "focus": { "ring": "0 0 0 3px rgba(249, 115, 22, 0.2)" },
    "state": {
      "error": { "color": "#EF4444" },
      "success": { "color": "#22C55E" },
      "warning": { "color": "#F59E0B" }
    },
    "suggestion": {
      "background": "#FFF7ED",
      "text": "#78716C"
    },
    "group": {
      "spacing": "1rem",
      "border": "1px solid #E7E5E4"
    },
    "transition": {
      "duration": "150ms"
    }
  }
}
```

## Usage Examples

### Using the Grouping Engine

```typescript
import { createGroupingEngine, type GroupingStrategy } from '@skeed/core';

const engine = createGroupingEngine();
const fields = [
  { id: 'name', label: 'Name', type: 'text', category: 'personal' },
  { id: 'email', label: 'Email', type: 'email', category: 'contact' },
  { id: 'password', label: 'Password', type: 'password', category: 'account' },
];

const groups = engine.groupFields(fields, 'semantic');
```

### Using the Validation Engine

```typescript
import { createValidationEngine, CommonValidationRules } from '@skeed/core';

const engine = createValidationEngine();
const result = engine.validateField(
  'user@example.com',
  CommonValidationRules.email,
  'working_class'
);
```

### Using React Hooks

```typescript
import { useFormValidation } from '@skeed/core';

const { state, errors, suggestions, validate, setFieldValue } = useFormValidation({
  demographic: 'working_class',
  rules: {
    email: CommonValidationRules.email,
    password: CommonValidationRules.password,
  },
  validateOnBlur: true,
  validateOnChange: false,
});
```

### Using the Grouped Form Archetype

```typescript
import { GroupedForm } from '@skeed/archetypes';

<GroupedForm
  fields={fields}
  groupingStrategy="functional"
  onSubmit={handleSubmit}
  title="Account Setup"
/>
```

## Grouping Strategies

### Semantic
Groups fields by meaning (personal, contact, account, preferences, etc.)

### Functional
Groups fields by task (accountSetup, security, contactInfo, payment, etc.)

### Frequency
Groups required fields separately from optional fields

### Dependency
Groups fields that depend on each other

### None
All fields in a single group

## Validation Styles

### Strict
All validation rules are enforced as errors

### Lenient
Pattern violations are warnings, not errors

### Adaptive
Required fields are errors, pattern violations are warnings

## Demographic Voices

Each demographic has unique suggestion voices:

- **kids**: Playful with emojis, encouraging messages
- **fintech**: Professional, security-focused, precise
- **gov**: Plain language, clear, neutral
- **health**: HIPAA-aware, formal
- **working_class**: Practical, clear, helpful

## Form Tokens

Use form tokens in your components:

```typescript
import { formTokens } from '@skeed/core';

const styles = {
  errorColor: formTokens.errorColor(),
  focusRing: formTokens.focusRing(),
  groupSpacing: formTokens.groupSpacing(),
};
```

## Best Practices

1. **Use demographic presets**: Always leverage demographic-specific configurations
2. **Choose appropriate grouping strategy**: Match the strategy to your use case
3. **Set proper validation style**: Use strict for security, lenient for casual forms
4. **Provide clear suggestions**: Help users understand and fix errors
5. **Use progressive disclosure**: Reduce cognitive load by showing fields conditionally
6. **Leverage smart defaults**: Pre-fill fields when possible to improve UX

## Migration Guide

### Existing Forms

To add intelligence to existing forms:

1. Add `formIntelligence` config to demographic presets
2. Import and use `useFormValidation` hook
3. Replace static validation with validation engine
4. Add suggestion display components
5. Apply form tokens for styling

### New Forms

For new forms, use the `GroupedForm` archetype or integrate engines directly.

## Future Enhancements

- AI-powered input corrections via LLM router
- Smart defaults from user context
- Form intelligence quality gates
- MCP tools for form intelligence
- CLI commands for form validation
