'use client';

import { useIconContext } from '../IconContext';
import { type IconProps, getStrokeWidth } from '../types';

export function Eye({ size = 16, weight, className, ...props }: IconProps) {
  const ctx = useIconContext();
  const activeWeight = weight ?? ctx.weight;
  const strokeWidth = getStrokeWidth(activeWeight, size);

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
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
