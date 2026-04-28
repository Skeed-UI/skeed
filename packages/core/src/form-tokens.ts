/**
 * Form-specific token helpers
 *
 * Provides utilities for working with form state tokens
 * These tokens are used for form input states, validation feedback, and grouping
 */

import { parseTokenRef, tokenToVarExpr } from './tokens.js';

/**
 * Form state token paths
 * These should be defined in demographic presets under the 'form' namespace
 */
export const FORM_TOKEN_PATHS = {
  // Input styling
  inputRadius: 'form.input.radius',
  focusRing: 'form.focus.ring',
  errorColor: 'form.state.error.color',
  successColor: 'form.state.success.color',
  warningColor: 'form.state.warning.color',

  // Suggestion UI
  suggestionBg: 'form.suggestion.background',
  suggestionText: 'form.suggestion.text',

  // Grouping
  groupSpacing: 'form.group.spacing',
  groupBorder: 'form.group.border',

  // Transitions
  transitionDuration: 'form.transition.duration',
} as const;

/**
 * Get CSS variable expression for a form token
 */
export function formToken(path: string): string {
  const ref = parseTokenRef(`form.${path}`);
  if (!ref) {
    throw new Error(`Invalid form token path: form.${path}`);
  }
  return tokenToVarExpr(ref.raw);
}

/**
 * Form state token helpers
 */
export const formTokens = {
  inputRadius: () => formToken('input.radius'),
  focusRing: () => formToken('focus.ring'),
  errorColor: () => formToken('state.error.color'),
  successColor: () => formToken('state.success.color'),
  warningColor: () => formToken('state.warning.color'),
  suggestionBg: () => formToken('suggestion.background'),
  suggestionText: () => formToken('suggestion.text'),
  groupSpacing: () => formToken('group.spacing'),
  groupBorder: () => formToken('group.border'),
  transitionDuration: () => formToken('transition.duration'),
} as const;
