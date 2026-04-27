'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { IconWeight, IconVariant } from './types';

export interface IconContextValue {
  weight: IconWeight;
  variant: IconVariant;
}

const IconContext = createContext<IconContextValue>({
  weight: 'regular',
  variant: 'stroke',
});

export interface IconProviderProps {
  children: ReactNode;
  weight?: IconWeight;
  variant?: IconVariant;
}

export function IconProvider({ children, weight = 'regular', variant = 'stroke' }: IconProviderProps) {
  return (
    <IconContext.Provider value={{ weight, variant }}>
      {children}
    </IconContext.Provider>
  );
}

export function useIconContext(): IconContextValue {
  return useContext(IconContext);
}
