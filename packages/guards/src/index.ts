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

export {
  checkForbiddenPatterns,
  hasBlockingViolation,
  FORBIDDEN_PATTERNS,
  type ForbiddenPattern,
  type ForbiddenViolation,
} from './forbidden-patterns.js';

export { scrubPii, type PiiHit } from './pii-scrub.js';

export {
  checkAssets,
  checkGarbledText,
  type AssetIssue,
  type AssetCheckInput,
  type OcrFn,
} from './asset-checks.js';

export {
  judgeRubric,
  RUBRIC_THRESHOLD,
  type RubricInput,
  type RubricResult,
  type RubricCriterion,
} from './rubric.js';

export {
  selfCritique,
  type SelfCritiqueOptions,
  type SelfCritiqueResult,
} from './self-critique.js';

export {
  checkDrift,
  type DriftSpec,
  type DriftEvidence,
  type DriftReport,
} from './drift-guard.js';

export {
  validateMotionForDemographic,
  validateMotionString,
  getRecommendedMotion,
  type MotionViolation,
  type MotionValidationResult,
} from './motion-validation.js';

export {
  checkFormIntelligence,
  checkFormAccessibility,
  formatFormIntelligenceReport,
  isFormProductionReady,
  type FormIntelligenceGuardOptions,
  type FormIntelligenceGuardResult,
  type FormIntelligenceViolation,
} from './form-intelligence.js';
