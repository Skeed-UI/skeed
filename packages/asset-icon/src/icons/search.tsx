'use client';

import { useIconContext } from '../IconContext';
import { getStrokeWidth, type IconProps } from '../types';

export function Search({ size = 16, weight, variant, className, ...props }: IconProps) {
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
        <path d="M11 2C6.03 2 2 6.03 2 11C2 15.97 6.03 20 11 20C13.06 20 14.94 19.31 16.44 18.15L20.29 22L21.71 20.59L17.86 16.74C19.21 15.04 20 12.87 20 11C20 6.03 15.97 2 11 2ZM11 4C14.86 4 18 7.14 18 11C18 14.86 14.86 18 11 18C7.14 18 4 14.86 4 11C4 7.14 7.14 4 11 4Z" />
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
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
