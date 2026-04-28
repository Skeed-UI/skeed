'use client';

import { useIconContext } from '../IconContext';
import { type IconProps, getStrokeWidth } from '../types';

export function X({ size = 16, weight, variant, className, ...props }: IconProps) {
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
        <path d="M18.3 5.71C17.9 5.31 17.3 5.31 16.89 5.71L12 10.59L7.11 5.7C6.7 5.3 6.1 5.3 5.7 5.7C5.3 6.1 5.3 6.7 5.7 7.11L10.59 12L5.7 16.89C5.3 17.3 5.3 17.9 5.7 18.3C6.1 18.7 6.7 18.7 7.11 18.3L12 13.41L16.89 18.3C17.3 18.7 17.9 18.7 18.3 18.3C18.7 17.9 18.7 17.3 18.3 16.89L13.41 12L18.3 7.11C18.7 6.7 18.7 6.1 18.3 5.71Z" />
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
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
