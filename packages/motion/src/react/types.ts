/**
 * React integration types
 */

import type * as React from 'react';
import type { MotionConfig } from '../grammar/types.js';
import type { MaterialType } from '../physics/types.js';

export interface MotionProviderProps {
  children: React.ReactNode;
  demographic?: string;
  intensity?: number;
  respectPrefersReducedMotion?: boolean;
  alternativeMode?: 'fade-only' | 'instant' | 'simplify';
}

export interface UseMotionOptions {
  config: MotionConfig | string;
  disabled?: boolean;
}

export interface MotionStyle {
  transform?: string | undefined;
  filter?: string | undefined;
  opacity?: number | undefined;
  transition?: string | undefined;
  [key: string]: string | number | undefined;
}

export interface UseMotionReturn {
  style: MotionStyle;
  handlers: {
    onMouseEnter?: (e: React.MouseEvent<HTMLElement>) => void;
    onMouseLeave?: (e: React.MouseEvent<HTMLElement>) => void;
    onMouseMove?: (e: React.MouseEvent<HTMLElement>) => void;
    onClick?: (e: React.MouseEvent<HTMLElement>) => void;
    onFocus?: (e: React.FocusEvent<HTMLElement>) => void;
    onBlur?: (e: React.FocusEvent<HTMLElement>) => void;
  };
  isActive: boolean;
}

export interface WithMotionProps {
  motion?: MotionConfig | string;
  motionDisabled?: boolean;
}
