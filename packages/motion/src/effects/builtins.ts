/**
 * Built-in effect generators
 */

import { registerEffect } from './registry.js';
import type { EffectOutput } from './types.js';

/**
 * Ripple effect - expanding wave from interaction point
 */
registerEffect(
  'ripple',
  (ctx, params): EffectOutput => {
    const intensity = (params.intensity as number) ?? 0.5;
    const spread = (params.spread as string) ?? 'outward';

    // Scale based on material elasticity
    const scale = 0.95 + (1 - ctx.material.elasticity) * intensity * 0.1;

    return {
      transforms: [{ type: 'scale', x: scale, y: scale }],
      springConfig: {
        mass: ctx.material.mass,
        stiffness: 200 + intensity * 100,
        damping: ctx.material.damping * 15,
      },
    };
  },
  { intensity: 0.5, spread: 'outward' },
);

/**
 * Elastic effect - overshoot bounce
 */
registerEffect(
  'elastic',
  (ctx, params): EffectOutput => {
    const overshoot = (params.overshoot as number) ?? 1.2;

    // Calculate scale with overshoot based on material
    const baseScale = overshoot;
    const elasticityFactor = ctx.material.elasticity;

    return {
      transforms: [
        {
          type: 'scale',
          x: baseScale * (0.9 + elasticityFactor * 0.2),
          y: baseScale * (0.9 + elasticityFactor * 0.2),
        },
      ],
      springConfig: {
        mass: ctx.material.mass,
        stiffness: 150,
        damping: ctx.material.damping * 10,
      },
    };
  },
  { overshoot: 1.2 },
);

/**
 * Glow effect - ambient pulse or interaction glow
 */
registerEffect(
  'glow',
  (ctx, params): EffectOutput => {
    const color = (params.color as string) ?? 'brand';
    const pulse = (params.pulse as string) ?? 'subtle';
    const intensity = (params.intensity as number) ?? 0.5;

    const pulseIntensity = pulse === 'subtle' ? 0.3 : pulse === 'strong' ? 0.7 : 0.5;

    return {
      transforms: [],
      cssProperties: {
        '--motion-glow-color': `var(--skeed-color-${color}-500, rgba(59, 130, 246, ${intensity}))`,
        '--motion-glow-intensity': String(pulseIntensity * intensity),
      },
      springConfig: {
        mass: 0.5,
        stiffness: 100,
        damping: 15,
      },
    };
  },
  { color: 'brand', pulse: 'subtle', intensity: 0.5 },
);

/**
 * Magnetic effect - attraction to cursor
 */
registerEffect(
  'magnetic',
  (ctx, params): EffectOutput => {
    const strength = (params.strength as number) ?? 0.4;
    const radius = (params.radius as number) ?? 100;

    // Calculate magnetic pull based on cursor position
    const pullX = (ctx.position.x - 0.5) * strength * 20;
    const pullY = (ctx.position.y - 0.5) * strength * 20;

    return {
      transforms: [{ type: 'translate', x: pullX, y: pullY }],
      springConfig: {
        mass: ctx.material.mass * 0.5,
        stiffness: 300,
        damping: ctx.material.damping * 20,
      },
    };
  },
  { strength: 0.4, radius: 100 },
);

/**
 * Breathe effect - subtle ambient pulsing
 */
registerEffect(
  'breathe',
  (ctx, params): EffectOutput => {
    const period = (params.period as number) ?? 4000;
    const amplitude = (params.amplitude as number) ?? 0.02;

    // Subtle scale oscillation
    const breatheScale = 1 + Math.sin((ctx.timestamp / period) * Math.PI * 2) * amplitude;

    return {
      transforms: [{ type: 'scale', x: breatheScale, y: breatheScale }],
      cssProperties: {
        '--motion-breathe-phase': String((ctx.timestamp % period) / period),
      },
      duration: period / 4, // Quarter period for smooth breathing
      easing: 'ease-in-out',
    };
  },
  { period: 4000, amplitude: 0.02 },
);

/**
 * Jiggle effect - chaotic micro-movements
 */
registerEffect(
  'jiggle',
  (ctx, params): EffectOutput => {
    const entropy = (params.entropy as number) ?? 0.3;

    // Pseudo-random offsets based on timestamp
    const time = ctx.timestamp / 1000;
    const offsetX = Math.sin(time * 15) * entropy * 3;
    const offsetY = Math.cos(time * 13) * entropy * 3;
    const rotation = Math.sin(time * 10) * entropy * 2;

    return {
      transforms: [
        { type: 'translate', x: offsetX, y: offsetY },
        { type: 'rotate', angle: rotation },
      ],
      duration: 50, // Very short for chaotic feel
      easing: 'linear',
    };
  },
  { entropy: 0.3 },
);

/**
 * Curtain effect - fold/wave like hanging fabric
 */
registerEffect(
  'curtain',
  (ctx, params): EffectOutput => {
    const direction = (params.direction as string) ?? 'vertical';
    const waveCount = (params.waves as number) ?? 3;

    // Skew to simulate fabric wave
    const skewAngle = Math.sin(ctx.timestamp / 500) * (ctx.material.elasticity * 10);

    return {
      transforms: [
        {
          type: 'skew',
          x: direction === 'vertical' ? skewAngle : 0,
          y: direction === 'horizontal' ? skewAngle : 0,
        },
      ],
      cssProperties: {
        '--motion-curtain-wave': String(waveCount),
      },
      springConfig: {
        mass: ctx.material.mass,
        stiffness: 80,
        damping: ctx.material.damping * 12,
      },
    };
  },
  { direction: 'vertical', waves: 3 },
);

/**
 * Morph effect - shape transformation (simplified as scale/skew)
 */
registerEffect(
  'morph',
  (ctx, params): EffectOutput => {
    const to = (params.to as string) ?? 'wedge';
    const intensity = (params.intensity as number) ?? 0.5;

    // Simplified morph using skew transforms
    let skewX = 0;
    let skewY = 0;

    if (to === 'wedge') {
      skewX = intensity * 15;
    } else if (to === 'parallelogram') {
      skewX = intensity * 10;
      skewY = intensity * 5;
    }

    return {
      transforms: [{ type: 'skew', x: skewX, y: skewY }],
      springConfig: {
        mass: ctx.material.mass,
        stiffness: 120,
        damping: ctx.material.damping * 15,
      },
    };
  },
  { to: 'wedge', intensity: 0.5 },
);

/**
 * Wind effect - element responds to cursor "airflow"
 */
registerEffect(
  'wind',
  (ctx, params): EffectOutput => {
    const strength = (params.strength as number) ?? 0.4;
    const direction = params.direction as string | undefined;

    // Use cursor velocity to simulate wind
    const windX = ctx.direction.x * strength * 10;
    const windY = ctx.direction.y * strength * 10;

    // Skew in wind direction
    const skewX = windX * 0.5;

    return {
      transforms: [
        { type: 'skew', x: skewX },
        { type: 'translate', x: windX * 0.3, y: windY * 0.3 },
      ],
      springConfig: {
        mass: ctx.material.mass * 0.3, // Lighter in wind
        stiffness: 60,
        damping: ctx.material.damping * 8,
      },
    };
  },
  { strength: 0.4 },
);

/**
 * Lift effect - subtle elevation on hover
 */
registerEffect(
  'lift',
  (ctx, params): EffectOutput => {
    const height = (params.height as number) ?? 8;
    const intensity = (params.intensity as number) ?? 0.5;

    const translateY = -height * intensity;

    return {
      transforms: [{ type: 'translate', y: translateY }],
      cssProperties: {
        '--motion-lift-shadow': `${translateY * 0.5}px ${-translateY}px ${height * 2}px rgba(0,0,0,0.15)`,
      },
      springConfig: {
        mass: ctx.material.mass,
        stiffness: 200,
        damping: ctx.material.damping * 18,
      },
    };
  },
  { height: 8, intensity: 0.5 },
);

/**
 * Pulse effect - urgent attention pulse
 */
registerEffect(
  'pulse',
  (ctx, params): EffectOutput => {
    const urgency = (params.urgency as string) ?? 'medium';

    const speeds = { low: 2000, medium: 1000, high: 500 };
    const speed = speeds[urgency as keyof typeof speeds] || speeds.medium;

    const pulseScale = 1 + Math.sin((ctx.timestamp / speed) * Math.PI * 2) * 0.05;

    return {
      transforms: [{ type: 'scale', x: pulseScale, y: pulseScale }],
      cssProperties: {
        '--motion-pulse-opacity': String(
          0.7 + Math.sin((ctx.timestamp / speed) * Math.PI * 2) * 0.3,
        ),
      },
      duration: speed / 2,
      easing: 'ease-in-out',
    };
  },
  { urgency: 'medium' },
);
