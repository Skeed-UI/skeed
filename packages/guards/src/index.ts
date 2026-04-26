/**
 * Skeed Guards Package
 * 
 * Quality gates for component generation:
 * - Token validation (no hardcoded values)
 * - Contrast validation (WCAG AA/AAA compliance)
 * - Ethics guard (forbidden patterns for sensitive demographics)
 */

export {
  validateTokens,
  hasHardcodedValues,
  formatValidationReport,
  type TokenValidationOptions,
  type TokenValidationResult,
  type TokenViolation,
} from './token-validation.js';

export {
  validateContrast,
  validateContrastPairs,
  requiresAAA,
  formatContrastResult,
  type ContrastValidationOptions,
  type ContrastValidationResult,
  type ContrastFixSuggestion,
} from './contrast-validation.js';

export {
  runEthicsGuard,
  isEthical,
  formatEthicsReport,
  getAAAStrictDemographics,
  isAAAStrict,
  type EthicsGuardOptions,
  type EthicsGuardResult,
  type EthicsViolation,
} from './ethics-guard.js';
