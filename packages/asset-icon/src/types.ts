import type { SVGProps } from 'react';

export type IconWeight = 'thin' | 'light' | 'regular' | 'bold';
export type IconVariant = 'stroke' | 'fill';

export interface IconProps extends SVGProps<SVGSVGElement> {
  size?: 12 | 16 | 20 | 24 | 32;
  weight?: IconWeight;
  variant?: IconVariant;
}

export type IconComponent = (props: IconProps) => JSX.Element;

/** Maps weight + size to precise stroke width in pixels */
export const STROKE_WIDTHS: Record<IconWeight, Record<number, number>> = {
  thin: {
    12: 1,
    16: 1,
    20: 1,
    24: 1.5,
    32: 1.5,
  },
  light: {
    12: 1.5,
    16: 1.5,
    20: 1.5,
    24: 2,
    32: 2,
  },
  regular: {
    12: 2,
    16: 2,
    20: 2,
    24: 2.5,
    32: 3,
  },
  bold: {
    12: 2.5,
    16: 2.5,
    20: 3,
    24: 3,
    32: 3.5,
  },
};

/** Get stroke width for given weight and size */
export function getStrokeWidth(weight: IconWeight = 'regular', size = 16): number {
  const sizes = [12, 16, 20, 24, 32];
  const sizeKey = sizes.find((s) => s >= size) ?? 24;
  return STROKE_WIDTHS[weight][sizeKey] ?? 2;
}
