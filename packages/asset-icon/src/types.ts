import type { SVGProps } from 'react';

export interface IconProps extends SVGProps<SVGSVGElement> {
  size?: 12 | 16 | 20 | 24 | 32;
}

export type IconComponent = (props: IconProps) => JSX.Element;
