/**
 * Forbidden-pattern guard. Per-demographic deny list of regex patterns that must
 * not appear in emitted code, copy, or asset content.
 *
 * Distinct from ethics-guard: this is a hard text-pattern check (cheap, runs on
 * every emit). Ethics-guard runs LLM-judge for richer assessment.
 */
export interface ForbiddenPattern {
  /** Demographic id this rule applies to ('*' = all). */
  demographic: string;
  /** Pattern to ban. */
  pattern: RegExp;
  /** Why it's banned — surfaced to user. */
  reason: string;
  /** Severity: 'block' = fail emit; 'warn' = include in report. */
  severity: 'block' | 'warn';
}

export const FORBIDDEN_PATTERNS: ForbiddenPattern[] = [
  // Universal dark patterns
  { demographic: '*', pattern: /\bautoplay\b/i, reason: 'autoplay AV is hostile to most users', severity: 'warn' },
  { demographic: '*', pattern: /\bonly\s+\d+\s+left\b/i, reason: 'fake-scarcity urgency text', severity: 'block' },
  { demographic: '*', pattern: /\bact\s+now\b.*\bexpires?\b/i, reason: 'urgency-timer copy', severity: 'block' },

  // Kids
  { demographic: 'kids', pattern: /\bautoplay\b/i, reason: 'COPPA: kids must not face autoplay AV', severity: 'block' },
  { demographic: 'kids', pattern: /\binfinite\s+scroll\b/i, reason: 'kids must not face infinite scroll', severity: 'block' },
  { demographic: 'kids', pattern: /\bdata:image\/[^;]+;base64,[A-Za-z0-9+/]{1000,}/, reason: 'large embedded image — kids bundle should stay light', severity: 'warn' },

  // Health
  { demographic: 'health', pattern: /\?(\w+=)?[\w-]*(ssn|patient|medical-record-number)/i, reason: 'PII fragment in URL', severity: 'block' },

  // Gov
  { demographic: 'gov', pattern: /\bclick\s+here\b/i, reason: 'gov plain-language: avoid "click here"', severity: 'warn' },

  // Mental wellness
  { demographic: 'mental_wellness', pattern: /\b(streak|don\'?t\s+break|don\'?t\s+lose)\b/i, reason: 'streak-shame patterns are harmful in wellness context', severity: 'block' },
  { demographic: 'mental_wellness', pattern: /\b\d+\s+notifications?\b/i, reason: 'notification spam in wellness app', severity: 'warn' },
];

export interface ForbiddenViolation {
  pattern: ForbiddenPattern;
  match: string;
  index: number;
}

export function checkForbiddenPatterns(args: {
  text: string;
  demographic: string;
}): ForbiddenViolation[] {
  const out: ForbiddenViolation[] = [];
  for (const p of FORBIDDEN_PATTERNS) {
    if (p.demographic !== '*' && p.demographic !== args.demographic) continue;
    const m = args.text.match(p.pattern);
    if (m && m.index !== undefined) {
      out.push({ pattern: p, match: m[0], index: m.index });
    }
  }
  return out;
}

export function hasBlockingViolation(violations: ForbiddenViolation[]): boolean {
  return violations.some((v) => v.pattern.severity === 'block');
}
