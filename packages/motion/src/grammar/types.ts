/**
 * Effect grammar types - declarative motion configuration
 */

import type { MaterialType } from '../physics/types.js';

export type EffectTrigger =
  | 'onHover'
  | 'onClick'
  | 'onFocus'
  | 'onBlur'
  | 'onScroll'
  | 'onMount'
  | 'onUnmount'
  | 'idle'
  | 'enter'
  | 'leave';

export type EffectName =
  | 'ripple'
  | 'elastic'
  | 'wind'
  | 'morph'
  | 'magnetic'
  | 'glow'
  | 'curtain'
  | 'jiggle'
  | 'breathe'
  | 'pulse'
  | 'lift'
  | 'spotlight'
  | 'god-rays'
  | 'lens-flare'
  | 'cursor-wake'
  | 'ambient-breeze'
  | 'telescope-expand'
  | 'unfold-cascade'
  | 'domino-reveal'
  | 'confidence-wave'
  | 'elastic-snap'
  | 'aurora-glow'
  | 'waveform-pulse';

export interface EffectParameter {
  key: string;
  value: string | number | boolean;
}

export interface EffectSpec {
  name: EffectName;
  parameters: Record<string, string | number | boolean>;
}

export interface MotionConfig {
  material?: MaterialType | { mass: number; elasticity: number; friction: number; damping: number };
  onHover?: EffectSpec | EffectSpec[];
  onClick?: EffectSpec | EffectSpec[];
  onFocus?: EffectSpec | EffectSpec[];
  onBlur?: EffectSpec | EffectSpec[];
  onScroll?: EffectSpec | EffectSpec[];
  onMount?: EffectSpec | EffectSpec[];
  onUnmount?: EffectSpec | EffectSpec[];
  idle?: EffectSpec | EffectSpec[];
  enter?: EffectSpec | EffectSpec[];
  leave?: EffectSpec | EffectSpec[];
}

export type MotionString = string;

/**
 * Parsed motion instruction from string notation
 * Example: "[material:jelly] [onHover:ripple:intensity=0.6]"
 */
export interface ParsedMotion {
  material?: MaterialType;
  effects: ParsedEffect[];
}

export interface ParsedEffect {
  trigger: EffectTrigger;
  name: EffectName;
  parameters: Record<string, string | number | boolean>;
}
