/**
 * Skeed Motion - Physics-based micro-interactions library
 */

// Physics engine
export {
  updateSpring,
  createSpringFromMaterial,
  estimateSettleTime,
  SPRING_PRESETS,
} from './physics/spring.js';
export { getMaterial, MATERIALS } from './physics/types.js';
export type {
  Vector2D,
  SpringConfig,
  Material,
  PhysicsState,
  MaterialType,
} from './physics/types.js';

// Grammar parser
export {
  parseMotion,
  parseMotionString,
  validateMotionString,
  serializeMotion,
} from './grammar/parser.js';
export type {
  EffectTrigger,
  EffectName,
  EffectParameter,
  EffectSpec,
  MotionConfig,
  MotionString,
  ParsedMotion,
  ParsedEffect,
} from './grammar/types.js';

// Effect system
export {
  registerEffect,
  getEffect,
  hasEffect,
  executeEffect,
  listEffects,
} from './effects/registry.js';
export type {
  EffectContext,
  Transform,
  Filter,
  EffectOutput,
  EffectGenerator,
  RegisteredEffect,
} from './effects/types.js';

// Import builtins to ensure registration
import './effects/builtins.js';

// Version
export const VERSION = '0.1.0';
