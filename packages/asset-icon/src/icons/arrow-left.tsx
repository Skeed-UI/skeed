'use client';

import { useIconContext } from '../IconContext';
import { getStrokeWidth, type IconProps } from '../types';

export function ArrowLeft({ size = 16, weight, variant, className, ...props }: IconProps) {
  const ctx = useIconContext();
  const activeWeight = weight ?? ctx.weight;
  const activeVariant = variant ?? ctx.variant;
  const strokeWidth = getStrokeWidth(activeWeight, size);

  if (activeVariant === 'fill') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        aria-hidden="true"
        {...props}
      >
        <path d="M12 20L13.41 18.59L7.83 13H20V11H7.83L13.41 5.41L12 4L4 12L12 20Z" />
      </svg>
    );
  }

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
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}
