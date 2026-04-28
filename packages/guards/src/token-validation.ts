/**
 * Token Validation Guard
 *
 * Ensures generated components use semantic tokens instead of hardcoded values.
 * This is a critical quality gate for maintaining design system consistency.
 */

export interface TokenValidationOptions {
  /** Component source code to validate */
  source: string;
  /** Demographic ID for context */
  demographicId?: string;
  /** Strict mode - fail on any literal values */
  strict?: boolean;
}

export interface TokenValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Violations found */
  violations: TokenViolation[];
  /** Summary statistics */
  stats: {
    totalTokens: number;
    validTokens: number;
    invalidTokens: number;
  };
}

export interface TokenViolation {
  /** Type of violation */
  type:
    | 'hardcoded-color'
    | 'hardcoded-spacing'
    | 'hardcoded-font'
    | 'hardcoded-radius'
    | 'hardcoded-shadow';
  /** Line number in source */
  line: number;
  /** Column number in source */
  column: number;
  /** The offending value */
  value: string;
  /** Suggested fix using proper token */
  suggestion: string;
}

// Patterns that indicate hardcoded values
const VIOLATION_PATTERNS = [
  {
    type: 'hardcoded-color' as const,
    pattern: /#[0-9a-fA-F]{3,8}/g,
    suggestion: 'Use semantic color tokens like color.brand.500',
  },
  {
    type: 'hardcoded-color' as const,
    pattern: /rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/g,
    suggestion: 'Use semantic color tokens like color.brand.500',
  },
  {
    type: 'hardcoded-color' as const,
    pattern: /rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)/g,
    suggestion: 'Use semantic color tokens like color.brand.500',
  },
  {
    type: 'hardcoded-color' as const,
    pattern: /hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)/g,
    suggestion: 'Use semantic color tokens like color.brand.500',
  },
  {
    type: 'hardcoded-spacing' as const,
    pattern:
      /p-\[\d+px\]|px-\[\d+px\]|py-\[\d+px\]|m-\[\d+px\]|mx-\[\d+px\]|my-\[\d+px\]|gap-\[\d+px\]/g,
    suggestion: 'Use density tokens like density.cozy.padY',
  },
  {
    type: 'hardcoded-spacing' as const,
    pattern: /text-\[\d+px\]|text-\d+(\.\d+)?rem/g,
    suggestion: 'Use typography scale tokens',
  },
  {
    type: 'hardcoded-font' as const,
    pattern: /font-\['[^']+'\]|font-\[[^\]]+\]/g,
    suggestion: 'Use font tokens like font.body.family',
  },
  {
    type: 'hardcoded-radius' as const,
    pattern: /rounded-\[\d+px\]/g,
    suggestion: 'Use radius tokens like radius.2',
  },
  {
    type: 'hardcoded-shadow' as const,
    pattern: /shadow-\[0\s+\d+px\s+\d+px\s+/g,
    suggestion: 'Use shadow tokens like shadow.1',
  },
];

// Valid token patterns (exceptions that are allowed)
const VALID_PATTERNS = [
  // CSS variables are OK
  /var\(--skeed-[\w-]+\)/,
  // Token references in brackets are OK
  /--skeed-[\w-]+/,
];

/**
 * Validate that a component uses only semantic tokens
 */
export function validateTokens(options: TokenValidationOptions): TokenValidationResult {
  const { source, strict = true } = options;
  const violations: TokenViolation[] = [];

  const lines = source.split('\n');

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex]!;
    const lineNum = lineIndex + 1;

    for (const { type, pattern, suggestion } of VIOLATION_PATTERNS) {
      // Reset regex lastIndex
      pattern.lastIndex = 0;

      let match: RegExpExecArray | null;
      while ((match = pattern.exec(line)) !== null) {
        const value = match[0]!;
        const column = match.index! + 1;

        // Check if this is actually in a valid context (e.g., inside a CSS var)
        const context = getContext(line, match.index!, value.length);
        if (isValidContext(context)) {
          continue;
        }

        violations.push({
          type,
          line: lineNum,
          column,
          value,
          suggestion,
        });
      }
    }
  }

  return {
    valid: strict ? violations.length === 0 : violations.length < 3,
    violations,
    stats: {
      totalTokens: countValidTokens(source),
      validTokens: countValidTokens(source),
      invalidTokens: violations.length,
    },
  };
}

/**
 * Get surrounding context of a match
 */
function getContext(line: string, index: number, length: number): string {
  const start = Math.max(0, index - 20);
  const end = Math.min(line.length, index + length + 20);
  return line.slice(start, end);
}

/**
 * Check if a value is in a valid context (e.g., part of a CSS variable)
 */
function isValidContext(context: string): boolean {
  for (const pattern of VALID_PATTERNS) {
    if (pattern.test(context)) {
      return true;
    }
  }
  return false;
}

/**
 * Count valid semantic tokens in source
 */
function countValidTokens(source: string): number {
  const tokenPattern = /skeed-[\w-]+/g;
  const matches = source.match(tokenPattern);
  return matches?.length ?? 0;
}

/**
 * Quick check for obvious hardcoded values
 */
export function hasHardcodedValues(source: string): boolean {
  const result = validateTokens({ source, strict: true });
  return !result.valid;
}

/**
 * Format validation result as human-readable report
 */
export function formatValidationReport(result: TokenValidationResult): string {
  if (result.valid) {
    return `✅ Token validation passed\n   ${result.stats.validTokens} semantic tokens found`;
  }

  const lines: string[] = [
    `❌ Token validation failed - ${result.violations.length} violations found:`,
  ];

  for (const v of result.violations) {
    lines.push(`   Line ${v.line}:${v.column} - ${v.type}: "${v.value}"`);
    lines.push(`     → ${v.suggestion}`);
  }

  return lines.join('\n');
}
