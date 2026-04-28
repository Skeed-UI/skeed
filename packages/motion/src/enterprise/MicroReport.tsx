/**
 * MicroReport - Compact, glanceable information with micro-interactions
 */

import * as React from 'react';
import { useMotionContext } from '../react/MotionProvider.js';
import { useMotion } from '../react/useMotion.js';

interface MicroReportProps {
  type: 'trend' | 'status' | 'count' | 'percentage';
  value: number | string;
  context?: string;
  trend?: 'up' | 'down' | 'neutral';
  motion?: string;
  className?: string;
}

export function MicroReport({
  type,
  value,
  context,
  trend,
  motion = '[value:count-up] [trend:arrow-sweep] [context:fade-stagger]',
  className,
}: MicroReportProps): React.ReactElement {
  const contextVal = useMotionContext();
  const disabled = contextVal.reducedMotion;

  const [displayValue, setDisplayValue] = React.useState(0);
  const numericValue = typeof value === 'number' ? value : Number.parseFloat(value) || 0;
  const isNumeric = !Number.isNaN(numericValue);

  // Count-up animation
  React.useEffect(() => {
    if (disabled || !isNumeric) {
      setDisplayValue(numericValue);
      return;
    }

    const duration = 1000;
    const startTime = performance.now();
    const startValue = 0;

    let rafId: number;
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - (1 - progress) ** 3;
      const current = startValue + (numericValue - startValue) * eased;

      setDisplayValue(current);

      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      }
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [numericValue, disabled, isNumeric]);

  const motionConfig = disabled ? '' : '[material:glass] [onHover:lift]';
  const motionResult = useMotion({
    config: motionConfig,
    disabled,
  });

  // Format display value
  const formattedValue =
    type === 'percentage'
      ? `${Math.round(displayValue)}%`
      : type === 'count'
        ? Math.round(displayValue).toLocaleString()
        : displayValue.toFixed(1);

  const trendColors = {
    up: 'var(--skeed-color-success-500)',
    down: 'var(--skeed-color-danger-500)',
    neutral: 'var(--skeed-color-neutral-500)',
  };

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: '6px',
        padding: '8px 12px',
        borderRadius: '6px',
        background: 'var(--skeed-color-neutral-50)',
        ...motionResult.style,
      }}
      {...motionResult.handlers}
    >
      {/* Trend arrow */}
      {trend && (
        <span
          style={{
            color: trendColors[trend],
            fontSize: '14px',
            animation: disabled ? undefined : 'arrowSweep 0.3s ease',
          }}
        >
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
        </span>
      )}

      {/* Value */}
      <span
        style={{ fontWeight: '600', fontSize: '18px', color: 'var(--skeed-color-neutral-900)' }}
      >
        {isNumeric ? formattedValue : value}
      </span>

      {/* Context */}
      {context && (
        <span
          style={{
            fontSize: '12px',
            color: 'var(--skeed-color-neutral-500)',
            animation: disabled ? undefined : 'fadeStagger 0.4s ease 0.2s both',
          }}
        >
          {context}
        </span>
      )}

      <style>{`
        @keyframes arrowSweep {
          from { transform: translateX(-10px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeStagger {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
