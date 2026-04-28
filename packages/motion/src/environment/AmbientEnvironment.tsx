/**
 * AmbientEnvironment - container for scenic effects
 */

import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ParticleConfig, ScenicConfig, WindConfig } from './types.js';

interface AmbientEnvironmentProps {
  children: React.ReactNode;
  config?: ScenicConfig;
  className?: string;
  style?: React.CSSProperties;
}

interface CursorState {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export function AmbientEnvironment({
  children,
  config = {},
  className,
  style,
}: AmbientEnvironmentProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState<CursorState>({ x: 0.5, y: 0.5, vx: 0, vy: 0 });
  const lastCursor = useRef({ x: 0.5, y: 0.5, time: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const now = performance.now();
    const dt = now - lastCursor.current.time;

    const vx = dt > 0 ? (x - lastCursor.current.x) / dt : 0;
    const vy = dt > 0 ? (y - lastCursor.current.y) / dt : 0;

    lastCursor.current = { x, y, time: now };
    setCursor({ x, y, vx, vy });
  }, []);

  // Compute spotlight position with inertia
  const spotlightStyle = React.useMemo(() => {
    if (!config.light?.followCursor) return {};

    const inertia = config.light.inertia ?? 0.8;
    const radius = config.light.radius ?? 200;
    const intensity = config.light.intensity ?? 0.3;

    return {
      '--spotlight-x': `${cursor.x * 100}%`,
      '--spotlight-y': `${cursor.y * 100}%`,
      '--spotlight-radius': `${radius}px`,
      '--spotlight-intensity': intensity,
      '--spotlight-color': config.light.color ?? 'rgba(255, 255, 255, 0.1)',
    } as React.CSSProperties;
  }, [config.light, cursor]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        overflow: 'hidden',
        ...style,
        ...spotlightStyle,
      }}
      onMouseMove={handleMouseMove}
    >
      {/* Spotlight overlay */}
      {config.light && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: `radial-gradient(circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), var(--spotlight-color, rgba(255,255,255,0.1)) 0%, transparent var(--spotlight-radius, 200px))`,
            opacity: config.light.intensity ?? 0.3,
            transition: 'opacity 0.3s ease',
          }}
        />
      )}

      {/* Wind field visualization (optional, for debugging or subtle effect) */}
      {config.wind?.cursorWake && <WindWakeIndicator cursor={cursor} config={config.wind} />}

      {/* Particle field */}
      {config.particles && (
        <ParticleField config={config.particles} cursor={cursor} containerRef={containerRef} />
      )}

      {/* Main content */}
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  );
}

// Wind wake indicator component
function WindWakeIndicator({
  cursor,
  config,
}: {
  cursor: CursorState;
  config: Partial<WindConfig>;
}): React.ReactElement | null {
  const speed = Math.sqrt(cursor.vx * cursor.vx + cursor.vy * cursor.vy);
  const strength = config.strength ?? 0.4;

  if (speed < 0.001) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${cursor.x * 100}%`,
        top: `${cursor.y * 100}%`,
        width: `${(config.cursorRadius ?? 200) * 2}px`,
        height: `${(config.cursorRadius ?? 200) * 2}px`,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        background: `radial-gradient(circle, rgba(255,255,255,${speed * strength * 0.1}) 0%, transparent 70%)`,
        transition: 'opacity 0.1s ease',
      }}
    />
  );
}

// Particle field component
function ParticleField({
  config,
  cursor,
  containerRef,
}: {
  config: Partial<ParticleConfig>;
  cursor: CursorState;
  containerRef: React.RefObject<HTMLDivElement | null>;
}): React.ReactElement {
  const count = config.count ?? 30;
  const [particles, setParticles] = useState<
    Array<{
      id: number;
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
    }>
  >(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.001,
      vy: (Math.random() - 0.5) * 0.001,
      size:
        (config.size?.min ?? 2) +
        Math.random() * ((config.size?.max ?? 4) - (config.size?.min ?? 2)),
      opacity: Math.random() * (config.opacity ?? 0.5),
    })),
  );

  useEffect(() => {
    let rafId: number;

    const animate = () => {
      setParticles((prev) =>
        prev.map((p) => {
          let vx = p.vx;
          let vy = p.vy;

          // Cursor avoidance
          if (config.avoidCursor) {
            const dx = p.x - cursor.x;
            const dy = p.y - cursor.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const radius = (config.cursorRadius ?? 100) / 1000;

            if (dist < radius && dist > 0) {
              const force = (1 - dist / radius) * 0.001;
              vx += (dx / dist) * force;
              vy += (dy / dist) * force;
            }
          }

          // Apply velocity with damping
          vx *= 0.99;
          vy *= 0.99;

          // Update position
          let x = p.x + vx;
          let y = p.y + vy;

          // Wrap around edges
          if (x < 0) x = 1;
          if (x > 1) x = 0;
          if (y < 0) y = 1;
          if (y > 1) y = 0;

          return { ...p, x, y, vx, vy };
        }),
      );

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [config.avoidCursor, config.cursorRadius, cursor]);

  return (
    <>
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x * 100}%`,
            top: `${p.y * 100}%`,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            backgroundColor: config.color ?? 'rgba(255,255,255,0.5)',
            opacity: p.opacity,
            pointerEvents: 'none',
            transform: 'translate(-50%, -50%)',
            transition: 'none',
          }}
        />
      ))}
    </>
  );
}
