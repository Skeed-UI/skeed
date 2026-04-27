/**
 * useMotion hook - primary interface for physics-based animations
 */

import * as React from 'react';
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { MotionConfig, EffectSpec } from '../grammar/types.js';
import { parseMotion } from '../grammar/parser.js';
import { getMaterial, type Material } from '../physics/types.js';
import { executeEffect } from '../effects/registry.js';
import type { EffectContext } from '../effects/types.js';
import type { UseMotionOptions, UseMotionReturn, MotionStyle } from './types.js';

interface CursorState {
  x: number;
  y: number;
  velocity: { x: number; y: number };
  timestamp: number;
}

function useCursorTracking() {
  const [cursor, setCursor] = useState<CursorState>({
    x: 0.5,
    y: 0.5,
    velocity: { x: 0, y: 0 },
    timestamp: 0,
  });
  const lastPosition = useRef({ x: 0.5, y: 0.5, time: 0 });

  const updatePosition = useCallback((e: React.MouseEvent | MouseEvent, rect: DOMRect) => {
    const now = performance.now();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const dt = now - lastPosition.current.time;
    const vx = dt > 0 ? (x - lastPosition.current.x) / dt : 0;
    const vy = dt > 0 ? (y - lastPosition.current.y) / dt : 0;

    lastPosition.current = { x, y, time: now };

    setCursor({
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y)),
      velocity: { x: vx, y: vy },
      timestamp: now,
    });
  }, []);

  return { cursor, updatePosition };
}

function resolveMaterial(config: MotionConfig): Material {
  if (!config.material) {
    return getMaterial('metal');
  }

  if (typeof config.material === 'string') {
    return getMaterial(config.material);
  }

  return config.material;
}

function createEffectContext(
  trigger: EffectContext['trigger'],
  cursor: CursorState,
  material: Material,
  intensity: number = 0.5
): EffectContext {
  return {
    trigger,
    intensity,
    direction: {
      x: cursor.velocity.x,
      y: cursor.velocity.y,
    },
    position: {
      x: cursor.x,
      y: cursor.y,
    },
    material,
    timestamp: cursor.timestamp,
    deltaTime: 16, // Assume 60fps
  };
}

function transformsToString(transforms: { type: string; x?: number; y?: number; z?: number; angle?: number }[]): string {
  return transforms
    .map((t) => {
      switch (t.type) {
        case 'translate':
          return `translate3d(${t.x ?? 0}px, ${t.y ?? 0}px, ${t.z ?? 0}px)`;
        case 'scale':
          return `scale3d(${t.x ?? 1}, ${t.y ?? 1}, ${t.z ?? 1})`;
        case 'rotate':
          return `rotate3d(0, 0, 1, ${t.angle ?? 0}deg)`;
        case 'skew':
          return `skew(${t.x ?? 0}deg, ${t.y ?? 0}deg)`;
        default:
          return '';
      }
    })
    .join(' ');
}

function mergeOutputs(outputs: ReturnType<typeof executeEffect>[]): MotionStyle {
  const transforms: string[] = [];
  const cssProperties: Record<string, string> = {};
  let transition = '';

  for (const output of outputs) {
    if (output.transforms?.length) {
      transforms.push(transformsToString(output.transforms));
    }

    if (output.cssProperties) {
      Object.assign(cssProperties, output.cssProperties);
    }

    if (output.springConfig) {
      // Use spring physics via transition
      const { mass, stiffness, damping } = output.springConfig;
      transition = `transform ${mass * 100}ms cubic-bezier(${1 - damping / 20}, ${stiffness / 300}, ${damping / 20}, 1)`;
    } else if (output.duration) {
      const easing = output.easing || 'ease';
      transition = `transform ${output.duration}ms ${easing}`;
    }
  }

  return {
    transform: transforms.join(' ') || undefined,
    transition: transition || undefined,
    ...cssProperties,
  };
}

export function useMotion(options: UseMotionOptions): UseMotionReturn {
  const { config, disabled = false } = options;

  // Parse config if it's a string
  const motionConfig = useMemo(() => {
    if (typeof config === 'string') {
      return parseMotion(config);
    }
    return config;
  }, [config]);

  const material = useMemo(() => resolveMaterial(motionConfig), [motionConfig]);
  const { cursor, updatePosition } = useCursorTracking();

  const [activeTrigger, setActiveTrigger] = useState<string | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);

  // Handle mouse events
  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (disabled) return;
      setActiveTrigger('hover');

      const target = e.currentTarget as HTMLElement;
      elementRef.current = target;
      const rect = target.getBoundingClientRect();
      updatePosition(e, rect);
    },
    [disabled, updatePosition]
  );

  const handleMouseLeave = useCallback(() => {
    setActiveTrigger(null);
    elementRef.current = null;
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (disabled || !elementRef.current) return;
      const rect = elementRef.current.getBoundingClientRect();
      updatePosition(e, rect);
    },
    [disabled, updatePosition]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (disabled) return;
      setActiveTrigger('click');

      const target = e.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      updatePosition(e, rect);

      // Reset after click animation
      setTimeout(() => {
        setActiveTrigger((prev: string | null) => (prev === 'click' ? null : prev));
      }, 300);
    },
    [disabled, updatePosition]
  );

  const handleFocus = useCallback(() => {
    if (disabled) return;
    setActiveTrigger('focus');
  }, [disabled]);

  const handleBlur = useCallback(() => {
    setActiveTrigger((prev: string | null) => (prev === 'focus' ? null : prev));
  }, []);

  // Compute current style based on active trigger
  const style = useMemo<MotionStyle>(() => {
    if (disabled || !activeTrigger) {
      return {};
    }

    const triggerKey = activeTrigger as keyof MotionConfig;
    const effects = motionConfig[triggerKey];

    if (!effects) {
      return {};
    }

    // Filter to only EffectSpec items (skip material string, etc.)
    const effectListRaw = Array.isArray(effects) ? effects : [effects];
    const effectList = effectListRaw.filter((e): e is EffectSpec =>
      e !== null && typeof e === 'object' && 'name' in e
    );

    if (effectList.length === 0) {
      return {};
    }

    const intensity = activeTrigger === 'click' ? 1 : 0.5;

    const context = createEffectContext(
      activeTrigger as EffectContext['trigger'],
      cursor,
      material,
      intensity
    );

    const outputs = effectList.map((spec) => executeEffect(spec, context));
    return mergeOutputs(outputs);
  }, [activeTrigger, motionConfig, cursor, material, disabled]);

  // Handle idle effects
  useEffect(() => {
    if (disabled || !motionConfig.idle) {
      return;
    }

    let rafId: number;
    const animate = () => {
      if (!activeTrigger) {
        // Update idle animation
        // This would update a separate idle style state
      }
      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [motionConfig.idle, activeTrigger, disabled]);

  return {
    style,
    handlers: {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onMouseMove: handleMouseMove,
      onClick: handleClick,
      onFocus: handleFocus,
      onBlur: handleBlur,
    },
    isActive: activeTrigger !== null,
  };
}
