'use client';

import { getStrokeWidth, type IconProps, type IconWeight } from '../types';

export type SpinnerVariant = 'track' | 'dots' | 'pulse' | 'arc';

export interface SpinnerProps extends Omit<IconProps, 'variant'> {
  variant?: SpinnerVariant;
}

function getSpinnerSize(size: number): { r: number; strokeWidth: number; dotSize: number } {
  if (size <= 12) return { r: 8, strokeWidth: 2, dotSize: 2 };
  if (size <= 16) return { r: 10, strokeWidth: 2.5, dotSize: 2.5 };
  if (size <= 20) return { r: 12, strokeWidth: 3, dotSize: 3 };
  if (size <= 24) return { r: 10, strokeWidth: 4, dotSize: 3 };
  return { r: 14, strokeWidth: 5, dotSize: 4 };
}

/** Superior track spinner with opacity-layered design from LoadingState */
function SpinnerTrack({ size = 16, className }: { size?: number; className?: string }) {
  const { r, strokeWidth } = getSpinnerSize(size);
  const dashArray = 2 * Math.PI * r * 0.75;
  const dashOffset = 2 * Math.PI * r * 0.25;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`animate-spin ${className || ''}`}
      aria-hidden="true"
    >
      {/* Background track - subtle opacity */}
      <circle
        cx="12"
        cy="12"
        r={r}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        opacity="0.15"
        strokeLinecap="round"
      />
      {/* Active segment - full opacity with dash animation */}
      <circle
        cx="12"
        cy="12"
        r={r}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={dashArray}
        strokeDashoffset={dashOffset}
        fill="none"
      />
    </svg>
  );
}

/** Three-dot chasing spinner */
function SpinnerDots({ size = 16, className }: { size?: number; className?: string }) {
  const { r } = getSpinnerSize(size);
  const dotR = size <= 16 ? 1.5 : 2;
  const positions = [
    { x: 12, y: 12 - r + 2 },
    { x: 12 + r * 0.87, y: 12 + r * 0.5 - 2 },
    { x: 12 - r * 0.87, y: 12 + r * 0.5 - 2 },
  ];

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`animate-spin ${className || ''}`}
      aria-hidden="true"
      style={{ animationDuration: '1.2s' }}
    >
      {positions.map((pos, i) => (
        <circle
          key={i}
          cx={pos.x}
          cy={pos.y}
          r={dotR}
          fill="currentColor"
          opacity={1 - i * 0.25}
        />
      ))}
    </svg>
  );
}

/** Expanding ring pulse spinner */
function SpinnerPulse({ size = 16, className }: { size?: number; className?: string }) {
  const { r } = getSpinnerSize(size);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r={r} fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3">
        <animate attributeName="r" values={`${r * 0.5};${r};${r * 0.5}`} dur="1.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="12" cy="12" r={r * 0.5} fill="currentColor" opacity="0.6" />
    </svg>
  );
}

/** Classic arc spinner (original design, refined) */
function SpinnerArc({ size = 16, className, weight }: { size?: number; className?: string; weight?: IconWeight }) {
  const strokeWidth = weight !== undefined ? getStrokeWidth(weight, size) : getStrokeWidth('regular', size);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      className={`animate-spin ${className || ''}`}
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

/** Main Spinner component with multiple variants */
export function Spinner({ size = 16, variant = 'track', weight, className, ...props }: SpinnerProps) {
  const commonProps = { size, className: `${className || ''}`, ...props };

  switch (variant) {
    case 'track':
      return <SpinnerTrack {...commonProps} />;
    case 'dots':
      return <SpinnerDots {...commonProps} />;
    case 'pulse':
      return <SpinnerPulse {...commonProps} />;
    case 'arc':
      return <SpinnerArc {...commonProps} weight={weight || 'regular'} />;
    default:
      return <SpinnerTrack {...commonProps} />;
  }
}
