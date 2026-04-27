/**
 * Spring physics solver - zero-dependency implementation
 */

import type { SpringConfig, PhysicsState } from './types.js';

export interface SpringUpdate {
  position: number;
  velocity: number;
  done: boolean;
}

const PRECISION = 0.01;
const VELOCITY_THRESHOLD = 0.001;

/**
 * Calculate spring physics update using semi-implicit Euler integration
 */
export function updateSpring(
  state: PhysicsState,
  deltaTime: number
): SpringUpdate {
  const { position, velocity, target, spring } = state;
  const { mass, stiffness, damping } = spring;

  // Calculate spring force: F = -k * displacement
  const displacement = position - target;
  const springForce = -stiffness * displacement;

  // Calculate damping force: F = -c * velocity
  const dampingForce = -damping * velocity;

  // Total force
  const totalForce = springForce + dampingForce;

  // Acceleration: a = F / m
  const acceleration = totalForce / mass;

  // Semi-implicit Euler integration
  const newVelocity = velocity + acceleration * deltaTime;
  const newPosition = position + newVelocity * deltaTime;

  // Check if spring has settled
  const isSettled =
    Math.abs(newPosition - target) < PRECISION &&
    Math.abs(newVelocity) < VELOCITY_THRESHOLD;

  return {
    position: newPosition,
    velocity: newVelocity,
    done: isSettled,
  };
}

/**
 * Create spring configuration from material properties
 */
export function createSpringFromMaterial(
  mass: number,
  elasticity: number,
  damping: number
): SpringConfig {
  // Convert material properties to spring physics
  // Higher elasticity = higher stiffness
  const stiffness = elasticity * 200; // Scale to usable range
  const dampingRatio = damping * 20; // Scale to usable range

  return {
    mass: Math.max(0.1, mass),
    stiffness: Math.max(10, stiffness),
    damping: Math.max(1, dampingRatio),
    velocity: 0,
  };
}

/**
 * Pre-configured spring presets for common use cases
 */
export const SPRING_PRESETS = {
  default: { mass: 1, stiffness: 100, damping: 10 },
  gentle: { mass: 1, stiffness: 50, damping: 15 },
  wobbly: { mass: 1, stiffness: 200, damping: 5 },
  stiff: { mass: 1, stiffness: 300, damping: 20 },
  slow: { mass: 2, stiffness: 80, damping: 15 },
} as const;

/**
 * Estimate spring settle time for animation planning
 */
export function estimateSettleTime(spring: SpringConfig): number {
  // Approximate based on mass, stiffness, and damping
  const naturalFrequency = Math.sqrt(spring.stiffness / spring.mass);
  const dampingRatio = spring.damping / (2 * Math.sqrt(spring.mass * spring.stiffness));

  if (dampingRatio >= 1) {
    // Overdamped - slower
    return 1000 / naturalFrequency * 3;
  }
  // Underdamped - oscillates but settles faster
  return 1000 / naturalFrequency * 2;
}
