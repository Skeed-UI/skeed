/**
 * MotionProvider - context provider for global motion configuration
 */

import type * as React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import type { MotionProviderProps } from './types.js';

interface MotionContextValue {
  demographic: string;
  intensity: number;
  respectReducedMotion: boolean;
  alternativeMode: 'fade-only' | 'instant' | 'simplify';
  reducedMotion: boolean;
}

const MotionContext = createContext<MotionContextValue>({
  demographic: 'default',
  intensity: 1,
  respectReducedMotion: true,
  alternativeMode: 'simplify',
  reducedMotion: false,
});

export function useMotionContext(): MotionContextValue {
  return useContext(MotionContext);
}

export function MotionProvider({
  children,
  demographic = 'default',
  intensity = 1,
  respectPrefersReducedMotion = true,
  alternativeMode = 'simplify',
}: MotionProviderProps): React.ReactElement {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (!respectPrefersReducedMotion) {
      setReducedMotion(false);
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [respectPrefersReducedMotion]);

  const value: MotionContextValue = {
    demographic,
    intensity,
    respectReducedMotion: respectPrefersReducedMotion,
    alternativeMode,
    reducedMotion,
  };

  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
}
