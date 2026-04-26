/**
 * Skeed ESLint Plugin
 * 
 * ESLint rules for enforcing Skeed design system standards:
 * - no-literal-tokens: Bans hardcoded hex/px/rem in archetype source
 * - ethics-pattern-check: Enforces ethics rules per demographic
 */

import noLiteralTokens from './rules/no-literal-tokens.js';

const plugin = {
  meta: {
    name: '@skeed/eslint-plugin-skeed',
    version: '0.1.0',
  },
  rules: {
    'no-literal-tokens': noLiteralTokens,
  },
  configs: {
    recommended: {
      plugins: ['@skeed/skeed'],
      rules: {
        '@skeed/skeed/no-literal-tokens': 'error',
      },
    },
    strict: {
      plugins: ['@skeed/skeed'],
      rules: {
        '@skeed/skeed/no-literal-tokens': 'error',
      },
    },
  },
};

export default plugin;
