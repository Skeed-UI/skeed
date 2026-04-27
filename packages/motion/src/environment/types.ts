/**
 * Environmental effect types - scenic/atmospheric effects
 */

import type * as React from 'react';

export interface SpotlightConfig {
  intensity: number;
  color: string;
  followCursor: boolean;
  inertia: number;
  radius: number;
}

export interface WindConfig {
  direction: 'left' | 'right' | 'up' | 'down' | { x: number; y: number };
  strength: number;
  scrollLinked: boolean;
  turbulence: number;
  cursorWake: boolean;
  cursorRadius: number;
}

export interface ParticleConfig {
  count: number;
  type: 'dust' | 'spores' | 'sparkles' | 'snow' | 'rain';
  avoidCursor: boolean;
  cursorRadius: number;
  connectNearby: boolean;
  connectDistance: number;
  color: string;
  opacity: number;
  size: { min: number; max: number };
}

export interface FogConfig {
  density: number;
  color: string;
  scrollLinked: boolean;
  clearSpeed: number;
}

export interface ParallaxConfig {
  layers: Array<{
    depth: number;
    speed: number;
    elements: React.ReactNode;
  }>;
  damping: number;
}

export interface ScenicConfig {
  light?: Partial<SpotlightConfig>;
  wind?: Partial<WindConfig>;
  particles?: Partial<ParticleConfig>;
  fog?: Partial<FogConfig>;
  parallax?: ParallaxConfig;
}

export interface EnvironmentState {
  cursor: { x: number; y: number };
  scroll: { x: number; y: number; velocity: number };
  time: number;
}
