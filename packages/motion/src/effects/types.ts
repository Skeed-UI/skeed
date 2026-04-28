/**
 * Effect generator types - procedural animation system
 */

import type { EffectName } from '../grammar/types.js';
import type { Material, Vector2D } from '../physics/types.js';

export interface EffectContext {
  trigger:
    | 'hover'
    | 'click'
    | 'focus'
    | 'blur'
    | 'scroll'
    | 'mount'
    | 'unmount'
    | 'gesture'
    | 'idle';
  intensity: number; // 0-1 based on velocity/pressure
  direction: Vector2D; // cursor movement vector
  position: Vector2D; // relative position within element (0-1)
  material: Material;
  timestamp: number;
  deltaTime: number;
}

export interface Transform {
  type: 'translate' | 'scale' | 'rotate' | 'skew';
  x?: number;
  y?: number;
  z?: number;
  angle?: number;
}

export interface Filter {
  type: 'blur' | 'brightness' | 'contrast' | 'saturate' | 'hue-rotate';
  value: number;
}

export interface EffectOutput {
  transforms: Transform[];
  filters?: Filter[];
  opacity?: number;
  cssProperties?: Record<string, string>;
  springConfig?: {
    mass: number;
    stiffness: number;
    damping: number;
  };
  duration?: number; // in ms, if not using spring
  easing?: string; // CSS easing function, if not using spring
}

export type EffectGenerator = (
  ctx: EffectContext,
  parameters: Record<string, string | number | boolean>,
) => EffectOutput;

export interface RegisteredEffect {
  name: EffectName;
  generator: EffectGenerator;
  defaultParameters: Record<string, string | number | boolean>;
}
