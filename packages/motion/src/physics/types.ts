/**
 * Core physics types for the motion system
 */

export interface Vector2D {
  x: number;
  y: number;
}

export interface SpringConfig {
  mass: number;
  stiffness: number;
  damping: number;
  velocity?: number;
}

export interface Material {
  mass: number;
  elasticity: number;
  friction: number;
  damping: number;
  magneticStrength?: number;
}

export interface PhysicsState {
  position: number;
  velocity: number;
  target: number;
  spring: SpringConfig;
}

export type MaterialType = 'jelly' | 'metal' | 'rubber' | 'fabric' | 'glass' | 'magnetic';

export const MATERIALS: Record<MaterialType, Material> = {
  jelly: { mass: 0.2, elasticity: 0.9, friction: 0.1, damping: 0.3 },
  metal: { mass: 1.0, elasticity: 0.1, friction: 0.8, damping: 0.9 },
  rubber: { mass: 0.5, elasticity: 0.7, friction: 0.4, damping: 0.5 },
  fabric: { mass: 0.1, elasticity: 0.3, friction: 0.2, damping: 0.4 },
  glass: { mass: 0.4, elasticity: 0.2, friction: 0.1, damping: 0.7 },
  magnetic: { mass: 0.6, elasticity: 0.0, friction: 0.3, damping: 0.5, magneticStrength: 0.5 },
};

export function getMaterial(type: MaterialType): Material {
  return MATERIALS[type];
}
