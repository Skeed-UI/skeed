'use client';

import { useIconContext } from '../IconContext';
import { getStrokeWidth, type IconProps } from '../types';

export function ChevronRight({ size = 16, weight, variant, className, ...props }: IconProps) {
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
        <path d="M10 6L8.59 7.41L13.17 12L8.59 16.59L10 18L16 12L10 6Z" />
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
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
