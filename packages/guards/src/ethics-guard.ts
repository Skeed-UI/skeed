/**
 * Ethics Guard
 * 
 * Detects forbidden patterns for AAA-strict demographics.
 * Enforces accessibility, safety, and ethical design standards.
 */

export interface EthicsGuardOptions {
  /** Component source code */
  source: string;
  /** Component ID */
  componentId: string;
  /** Demographic ID for context */
  demographicId: string;
  /** Archetype category */
  category?: 'atom' | 'molecule' | 'organism' | 'template' | 'page';
  /** Strict mode - fail on any warning */
  strict?: boolean;
}

export interface EthicsGuardResult {
  /** Whether ethics check passed */
  valid: boolean;
  /** Severity level */
  severity: 'error' | 'warning' | 'info';
  /** Violations found */
  violations: EthicsViolation[];
  /** Suggested fixes */
  fixes: string[];
}

export interface EthicsViolation {
  /** Type of violation */
  type: string;
  /** Line number */
  line: number;
  /** Column number */
  column: number;
  /** Violation description */
  message: string;
  /** Why this is an issue */
  reasoning: string;
  /** How to fix it */
  fix: string;
}

// Demographics requiring AAA strict compliance
const AAA_STRICT_DEMOGRAPHICS = [
  'kids',
  'education',
  'health',
  'gov',
  'mental_wellness',
];

// Forbidden patterns by demographic
const FORBIDDEN_PATTERNS: Record<string, Array<{ pattern: RegExp; message: string; fix: string }>> = {
  kids: [
    { 
      pattern: /autoplay|autoPlay/, 
      message: 'Autoplay can overwhelm children and cause distress',
      fix: 'Remove autoplay, add explicit play controls',
    },
    { 
      pattern: /notification.*sound|alert.*sound/i, 
      message: 'Unexpected sounds can startle children',
      fix: 'Use visual indicators instead of sound alerts',
    },
    { 
      pattern: /infinite-scroll|infiniteScroll/i, 
      message: 'Infinite scroll can be addictive for children',
      fix: 'Use pagination with clear end states',
    },
    { 
      pattern: /gamification.*points|earn.*coins/i, 
      message: 'Gamification can promote addictive behaviors in children',
      fix: 'Focus on learning outcomes, not extrinsic rewards',
    },
  ],
  education: [
    { 
      pattern: /paywall|upgrade.*premium/i, 
      message: 'Paywalls in educational content limit access to learning',
      fix: 'Ensure core educational content remains free',
    },
    { 
      pattern: /skip.*lesson|skip.*content/i, 
      message: 'Skipping educational content undermines learning objectives',
      fix: 'Allow review but encourage completion',
    },
  ],
  health: [
    { 
      pattern: /guaranteed.*cure|100%.*effective/i, 
      message: 'Medical guarantees are misleading and potentially harmful',
      fix: 'Use evidence-based language with appropriate disclaimers',
    },
    { 
      pattern: /no.*side.*effects|zero.*risk/i, 
      message: 'Minimizing medical risks is dangerous',
      fix: 'Always disclose potential side effects and risks',
    },
  ],
  mental_wellness: [
    { 
      pattern: /cure.*depression|cure.*anxiety/i, 
      message: 'Mental health conditions cannot be "cured" - they are managed',
      fix: 'Use "manage", "support", or "treat" instead of "cure"',
    },
    { 
      pattern: /just.*think.*positive|simply.*happy/i, 
      message: 'Toxic positivity trivializes mental health struggles',
      fix: 'Acknowledge difficulties while offering support resources',
    },
    { 
      pattern: /self-harm|suicide.*method/i, 
      message: 'Content about self-harm methods is prohibited',
      fix: 'Replace with crisis resources and support information',
    },
  ],
};

// Accessibility patterns (required for AAA)
const REQUIRED_ACCESSIBILITY_PATTERNS = [
  { 
    name: 'alt-text', 
    pattern: /alt\s*=\s*["'][^"']+["']/,
    message: 'Images must have descriptive alt text',
  },
  { 
    name: 'aria-label', 
    pattern: /aria-label|aria-labelledby/,
    message: 'Interactive elements need accessible labels',
  },
  { 
    name: 'focus-visible', 
    pattern: /focus-visible|focusVisible/,
    message: 'Keyboard navigation must be visible',
  },
  { 
    name: 'reduced-motion', 
    pattern: /prefers-reduced-motion|motion-reduce/,
    message: 'Respect user motion preferences',
  },
];

/**
 * Run ethics guard on component source
 */
export function runEthicsGuard(options: EthicsGuardOptions): EthicsGuardResult {
  const { source, demographicId, strict = false } = options;
  
  const violations: EthicsViolation[] = [];
  const fixes: string[] = [];
  
  // Check if this demographic requires strict checking
  const isAAAStrict = AAA_STRICT_DEMOGRAPHICS.includes(demographicId);
  
  // Check forbidden patterns for this demographic
  const forbiddenPatterns = FORBIDDEN_PATTERNS[demographicId] || [];
  const lines = source.split('\n');
  
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex]!;
    const lineNum = lineIndex + 1;
    
    for (const { pattern, message, fix } of forbiddenPatterns) {
      const match = pattern.exec(line);
      if (match) {
        violations.push({
          type: 'forbidden-pattern',
          line: lineNum,
          column: match.index! + 1,
          message,
          reasoning: `This pattern is prohibited for ${demographicId} demographics`,
          fix,
        });
        fixes.push(fix);
      }
    }
  }
  
  // For AAA strict, check accessibility requirements
  if (isAAAStrict) {
    for (const { name, pattern, message } of REQUIRED_ACCESSIBILITY_PATTERNS) {
      if (!pattern.test(source)) {
        // Check if this pattern is actually needed (e.g., alt-text only for images)
        if (name === 'alt-text' && !/<img/i.test(source)) {
          continue; // No images, no alt text needed
        }
        if (name === 'aria-label' && !/<button|<a |<input/i.test(source)) {
          continue; // No interactive elements
        }
        
        violations.push({
          type: 'missing-accessibility',
          line: 1,
          column: 1,
          message,
          reasoning: 'AAA accessibility compliance requires this feature',
          fix: `Add ${name} to relevant elements`,
        });
        fixes.push(`Add ${name}`);
      }
    }
  }
  
  // Determine severity
  let severity: 'error' | 'warning' | 'info' = 'info';
  if (violations.length > 0) {
    severity = isAAAStrict || strict ? 'error' : 'warning';
  }
  
  // Validate based on strictness
  const valid = isAAAStrict 
    ? violations.length === 0 
    : strict 
      ? violations.length === 0 
      : violations.filter(v => v.type === 'forbidden-pattern').length === 0;
  
  return {
    valid,
    severity,
    violations,
    fixes: [...new Set(fixes)], // Remove duplicates
  };
}

/**
 * Check if a component passes ethics validation
 */
export function isEthical(options: EthicsGuardOptions): boolean {
  return runEthicsGuard(options).valid;
}

/**
 * Format ethics report as human-readable string
 */
export function formatEthicsReport(result: EthicsGuardResult): string {
  if (result.valid) {
    return '✅ Ethics validation passed';
  }
  
  const icon = result.severity === 'error' ? '❌' : '⚠️';
  const lines: string[] = [
    `${icon} Ethics validation ${result.severity} - ${result.violations.length} violations:`,
  ];
  
  for (const v of result.violations) {
    lines.push(`   Line ${v.line}:${v.column} - ${v.type}`);
    lines.push(`     ${v.message}`);
    lines.push(`     → ${v.fix}`);
  }
  
  return lines.join('\n');
}

/**
 * Get the list of AAA-strict demographics
 */
export function getAAAStrictDemographics(): string[] {
  return [...AAA_STRICT_DEMOGRAPHICS];
}

/**
 * Check if demographic requires AAA compliance
 */
export function isAAAStrict(demographicId: string): boolean {
  return AAA_STRICT_DEMOGRAPHICS.includes(demographicId);
}
