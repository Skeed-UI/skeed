/**
 * Motion validation - checks animation configurations for demographic appropriateness
 */

import type { MotionConfig } from '@skeed/motion/grammar';

export interface MotionViolation {
  type:
    | 'duration-excessive'
    | 'demographic-inappropriate'
    | 'accessibility-risk'
    | 'forbidden-effect';
  component?: string;
  effect?: string;
  message: string;
  suggestion: string;
}

export interface MotionValidationResult {
  valid: boolean;
  violations: MotionViolation[];
}

interface DemographicMotionRules {
  maxDuration: number;
  forbiddenEffects: string[];
  allowedMaterials: string[];
  reducedMotionMode: 'simplify' | 'fade-only' | 'instant';
}

const DEMOGRAPHIC_RULES: Record<string, DemographicMotionRules> = {
  education: {
    maxDuration: 300,
    forbiddenEffects: ['jiggle', 'chaotic', 'dramatic'],
    allowedMaterials: ['metal', 'glass', 'fabric'],
    reducedMotionMode: 'simplify',
  },
  kids: {
    maxDuration: 200,
    forbiddenEffects: [],
    allowedMaterials: ['jelly', 'rubber', 'fabric'],
    reducedMotionMode: 'fade-only',
  },
  professional: {
    maxDuration: 250,
    forbiddenEffects: ['jiggle', 'curtain', 'wind'],
    allowedMaterials: ['metal', 'glass'],
    reducedMotionMode: 'instant',
  },
  health: {
    maxDuration: 400,
    forbiddenEffects: ['jiggle', 'pulse', 'chaotic'],
    allowedMaterials: ['glass', 'fabric'],
    reducedMotionMode: 'simplify',
  },
  fintech: {
    maxDuration: 200,
    forbiddenEffects: ['jiggle', 'chaotic'],
    allowedMaterials: ['metal', 'glass'],
    reducedMotionMode: 'instant',
  },
};

/**
 * Validate motion configuration for a specific demographic
 */
export function validateMotionForDemographic(
  motion: MotionConfig,
  demographic: string,
): MotionValidationResult {
  const violations: MotionViolation[] = [];
  const rules = DEMOGRAPHIC_RULES[demographic];

  if (!rules) {
    return { valid: true, violations: [] };
  }

  // Check material
  if (motion.material && typeof motion.material === 'string') {
    if (!rules.allowedMaterials.includes(motion.material)) {
      violations.push({
        type: 'demographic-inappropriate',
        message: `Material '${motion.material}' may not be appropriate for ${demographic} demographic`,
        suggestion: `Consider using: ${rules.allowedMaterials.join(', ')}`,
      });
    }
  }

  // Check effects
  const allEffects = [
    ...(Array.isArray(motion.onHover) ? motion.onHover : motion.onHover ? [motion.onHover] : []),
    ...(Array.isArray(motion.onClick) ? motion.onClick : motion.onClick ? [motion.onClick] : []),
    ...(Array.isArray(motion.onFocus) ? motion.onFocus : motion.onFocus ? [motion.onFocus] : []),
    ...(Array.isArray(motion.idle) ? motion.idle : motion.idle ? [motion.idle] : []),
  ];

  for (const effect of allEffects) {
    if (rules.forbiddenEffects.includes(effect.name)) {
      violations.push({
        type: 'forbidden-effect',
        effect: effect.name,
        message: `Effect '${effect.name}' is not recommended for ${demographic} demographic`,
        suggestion: `Avoid effects that may cause anxiety or distraction in ${demographic} context`,
      });
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

/**
 * Validate motion string notation
 */
export function validateMotionString(motionString: string): MotionValidationResult {
  const violations: MotionViolation[] = [];

  // Check for excessive complexity
  const effectCount = (motionString.match(/\[/g) || []).length;
  if (effectCount > 5) {
    violations.push({
      type: 'accessibility-risk',
      message: 'Motion configuration has too many effects',
      suggestion: 'Limit to 5 or fewer effects for better accessibility',
    });
  }

  // Check for potentially problematic combinations
  if (motionString.includes('jiggle') && motionString.includes('pulse')) {
    violations.push({
      type: 'accessibility-risk',
      message: 'Combining jiggle and pulse effects may cause discomfort',
      suggestion: 'Use one motion effect at a time, or provide reduced-motion alternative',
    });
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

/**
 * Get recommended motion config for a demographic
 */
export function getRecommendedMotion(demographic: string): Partial<MotionConfig> {
  const defaults: Record<string, Partial<MotionConfig>> = {
    education: {
      material: 'glass',
      onHover: { name: 'glow', parameters: { intensity: 0.3 } },
      onClick: { name: 'elastic', parameters: { overshoot: 1.1 } },
    },
    kids: {
      material: 'jelly',
      onHover: { name: 'magnetic', parameters: { strength: 0.5 } },
      onClick: { name: 'elastic', parameters: { overshoot: 1.3 } },
    },
    professional: {
      material: 'metal',
      onHover: { name: 'lift', parameters: { height: 4 } },
      onClick: { name: 'ripple', parameters: { intensity: 0.3 } },
    },
    health: {
      material: 'glass',
      onHover: { name: 'glow', parameters: { intensity: 0.2 } },
      onClick: { name: 'ripple', parameters: { intensity: 0.2 } },
    },
    fintech: {
      material: 'metal',
      onHover: { name: 'lift', parameters: { height: 2 } },
      onClick: { name: 'elastic', parameters: { overshoot: 1.05 } },
    },
  };

  return defaults[demographic] || { material: 'metal' };
}
