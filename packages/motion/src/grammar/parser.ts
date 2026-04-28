/**
 * Effect grammar parser - converts string notation to structured config
 * Format: "[material:jelly] [onHover:ripple:intensity=0.6] [onClick:elastic]"
 */

import type { MaterialType } from '../physics/types.js';
import type {
  EffectName,
  EffectSpec,
  EffectTrigger,
  MotionConfig,
  ParsedEffect,
  ParsedMotion,
} from './types.js';

const TRIGGERS: EffectTrigger[] = [
  'onHover',
  'onClick',
  'onFocus',
  'onBlur',
  'onScroll',
  'onMount',
  'onUnmount',
  'idle',
  'enter',
  'leave',
];

const EFFECTS: EffectName[] = [
  'ripple',
  'elastic',
  'wind',
  'morph',
  'magnetic',
  'glow',
  'curtain',
  'jiggle',
  'breathe',
  'pulse',
  'lift',
  'spotlight',
  'god-rays',
  'lens-flare',
  'cursor-wake',
  'ambient-breeze',
  'telescope-expand',
  'unfold-cascade',
  'domino-reveal',
  'confidence-wave',
  'elastic-snap',
  'aurora-glow',
  'waveform-pulse',
];

const MATERIALS: MaterialType[] = ['jelly', 'metal', 'rubber', 'fabric', 'glass', 'magnetic'];

/**
 * Parse a single bracketed instruction like "[material:jelly]"
 * or "[onHover:ripple:intensity=0.6]"
 */
function parseInstruction(
  instruction: string,
): ParsedEffect | { type: 'material'; value: MaterialType } | null {
  // Remove brackets and trim
  const content = instruction.replace(/^\[|\]$/g, '').trim();
  if (!content) return null;

  // Check for material specification: "material:jelly"
  if (content.startsWith('material:')) {
    const material = content.replace('material:', '') as MaterialType;
    if (MATERIALS.includes(material)) {
      return { type: 'material', value: material };
    }
    return null;
  }

  // Parse effect: "onHover:ripple:intensity=0.6"
  const parts = content.split(':');
  if (parts.length < 2) return null;

  const trigger = parts[0] as EffectTrigger;
  if (!TRIGGERS.includes(trigger)) return null;

  const effectName = parts[1] as EffectName;
  if (!EFFECTS.includes(effectName)) return null;

  // Parse parameters: "intensity=0.6", "spread=outward"
  const parameters: Record<string, string | number | boolean> = {};
  for (let i = 2; i < parts.length; i++) {
    const paramPart = parts[i];
    if (!paramPart) continue;
    const eqIndex = paramPart.indexOf('=');

    if (eqIndex > 0) {
      const key = paramPart.slice(0, eqIndex);
      const value = paramPart.slice(eqIndex + 1);

      // Try to parse as number or boolean
      if (value === 'true') {
        parameters[key] = true;
      } else if (value === 'false') {
        parameters[key] = false;
      } else if (!isNaN(Number(value))) {
        parameters[key] = Number(value);
      } else {
        parameters[key] = value;
      }
    }
  }

  return {
    trigger,
    name: effectName,
    parameters,
  };
}

/**
 * Parse motion string notation to structured config
 */
export function parseMotionString(motionString: string): ParsedMotion {
  const result: ParsedMotion = { effects: [] };

  // Extract all bracketed instructions
  const instructionRegex = /\[[^\]]+\]/g;
  const instructions = motionString.match(instructionRegex) || [];

  for (const instruction of instructions) {
    const parsed = parseInstruction(instruction);
    if (!parsed) continue;

    if ('type' in parsed && parsed.type === 'material') {
      result.material = parsed.value;
    } else if ('trigger' in parsed) {
      result.effects.push(parsed);
    }
  }

  return result;
}

/**
 * Convert parsed motion to MotionConfig object
 */
export function toMotionConfig(parsed: ParsedMotion): MotionConfig {
  const config: MotionConfig = {};

  if (parsed.material) {
    config.material = parsed.material;
  }

  // Group effects by trigger
  for (const effect of parsed.effects) {
    const { trigger, name, parameters } = effect;
    const spec: EffectSpec = { name, parameters };

    const existing = config[trigger];
    if (existing) {
      // Convert to array if multiple effects for same trigger
      if (Array.isArray(existing)) {
        existing.push(spec);
      } else {
        config[trigger] = [existing, spec];
      }
    } else {
      config[trigger] = spec;
    }
  }

  return config;
}

/**
 * Main entry point: parse motion string to config
 */
export function parseMotion(motionString: string): MotionConfig {
  const parsed = parseMotionString(motionString);
  return toMotionConfig(parsed);
}

/**
 * Validate motion string format
 */
export function validateMotionString(motionString: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check bracket balance
  const openBrackets = (motionString.match(/\[/g) || []).length;
  const closeBrackets = (motionString.match(/\]/g) || []).length;

  if (openBrackets !== closeBrackets) {
    errors.push(`Mismatched brackets: ${openBrackets} opening, ${closeBrackets} closing`);
  }

  // Validate each instruction
  const instructionRegex = /\[[^\]]+\]/g;
  const instructions = motionString.match(instructionRegex) || [];

  for (const instruction of instructions) {
    const parsed = parseInstruction(instruction);
    if (!parsed) {
      errors.push(`Invalid instruction: ${instruction}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Serialize MotionConfig back to string notation
 */
export function serializeMotion(config: MotionConfig): string {
  const parts: string[] = [];

  if (config.material) {
    if (typeof config.material === 'string') {
      parts.push(`[material:${config.material}]`);
    }
  }

  const triggers: EffectTrigger[] = [
    'onHover',
    'onClick',
    'onFocus',
    'onBlur',
    'onScroll',
    'onMount',
    'onUnmount',
    'idle',
    'enter',
    'leave',
  ];

  for (const trigger of triggers) {
    const effects = config[trigger];
    if (!effects) continue;

    const effectList = Array.isArray(effects) ? effects : [effects];

    for (const effect of effectList) {
      const params = Object.entries(effect.parameters)
        .map(([key, value]) => `${key}=${value}`)
        .join(':');

      const paramStr = params ? `:${params}` : '';
      parts.push(`[${trigger}:${effect.name}${paramStr}]`);
    }
  }

  return parts.join(' ');
}
