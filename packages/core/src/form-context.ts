/**
 * Form Context Hooks
 * 
 * React hooks for accessing browser, user, and environmental context
 * to enable smart defaults and contextual form behavior.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  getBrowserContext, 
  createSmartDefaultsEngine,
  storeDefault,
  type BrowserContext,
  type GeoContext,
} from './smart-defaults.js';
import type { SmartDefaultSource, FormState } from '@skeed/contracts';

export interface UseFormContextReturn {
  browserContext: BrowserContext;
  isMobile: boolean;
  isTouchDevice: boolean;
  prefersReducedMotion: boolean;
}

export interface UseSmartDefaultsReturn {
  defaults: Partial<FormState>;
  isLoading: boolean;
  applyDefaults: (fields: Record<string, SmartDefaultSource>) => void;
  storeUserPreference: (fieldId: string, value: string) => void;
}

export interface UsePreviousValuesReturn {
  getPreviousValue: (fieldId: string) => string | undefined;
  storeValue: (fieldId: string, value: string) => void;
  clearStoredValues: () => void;
}

/**
 * Hook to access browser and device context
 */
export function useFormContext(): UseFormContextReturn {
  const [browserContext, setBrowserContext] = useState<BrowserContext>(() => getBrowserContext());
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Update context on mount
    setBrowserContext(getBrowserContext());
    
    // Check for touch device
    setIsTouchDevice(
      'ontouchstart' in window || 
      navigator.maxTouchPoints > 0 ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window.matchMedia && window.matchMedia('(pointer: coarse)').matches)
    );

    // Check for reduced motion preference
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(motionQuery.matches);
    
    const handleMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    motionQuery.addEventListener('change', handleMotionChange);
    
    return () => {
      motionQuery.removeEventListener('change', handleMotionChange);
    };
  }, []);

  const isMobile = browserContext.screenSize.width < 768 || isTouchDevice;

  return {
    browserContext,
    isMobile,
    isTouchDevice,
    prefersReducedMotion,
  };
}

/**
 * Hook for smart defaults with loading state
 */
export function useSmartDefaults(
  demographic: string,
  options: {
    geoProvider?: () => Promise<GeoContext>;
    storage?: Storage;
  } = {}
): UseSmartDefaultsReturn {
  const [defaults, setDefaults] = useState<Partial<FormState>>({});
  const [isLoading, setIsLoading] = useState(false);
  const engineRef = useRef(createSmartDefaultsEngine(options));

  const applyDefaults = useCallback(
    async (fields: Record<string, SmartDefaultSource>) => {
      setIsLoading(true);
      try {
        const browserDefaults = await engineRef.current.getDefaults(fields);
        const inferredDefaults = engineRef.current.inferFromContext(browserDefaults);
        const demographicDefaults = engineRef.current.getDemographicDefaults(demographic);
        
        setDefaults({
          ...demographicDefaults,
          ...browserDefaults,
          ...inferredDefaults,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [demographic]
  );

  const storeUserPreference = useCallback(
    (fieldId: string, value: string) => {
      storeDefault(fieldId, value, options.storage);
    },
    [options.storage]
  );

  return {
    defaults,
    isLoading,
    applyDefaults,
    storeUserPreference,
  };
}

/**
 * Hook to remember and retrieve user's previous form values
 */
export function usePreviousValues(
  namespace: string = 'skeed-form',
  storage: Storage = localStorage
): UsePreviousValuesReturn {
  const getStorageKey = useCallback(
    (fieldId: string) => `${namespace}-prev-${fieldId}`,
    [namespace]
  );

  const getPreviousValue = useCallback(
    (fieldId: string): string | undefined => {
      try {
        return storage.getItem(getStorageKey(fieldId)) || undefined;
      } catch {
        return undefined;
      }
    },
    [getStorageKey, storage]
  );

  const storeValue = useCallback(
    (fieldId: string, value: string) => {
      try {
        storage.setItem(getStorageKey(fieldId), value);
      } catch {
        // Silently fail
      }
    },
    [getStorageKey, storage]
  );

  const clearStoredValues = useCallback(() => {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key?.startsWith(`${namespace}-prev-`)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => storage.removeItem(key));
    } catch {
      // Silently fail
    }
  }, [namespace, storage]);

  return {
    getPreviousValue,
    storeValue,
    clearStoredValues,
  };
}

/**
 * Hook to detect if user is filling form on mobile
 * Adjusts UX accordingly (larger touch targets, simplified UI)
 */
export function useMobileFormUX(): {
  isMobile: boolean;
  touchTargetSize: 'small' | 'medium' | 'large';
  shouldSimplifyUI: boolean;
} {
  const { isMobile, isTouchDevice } = useFormContext();

  return {
    isMobile,
    touchTargetSize: isMobile || isTouchDevice ? 'large' : 'medium',
    shouldSimplifyUI: isMobile,
  };
}

/**
 * Hook for demographic-specific form behavior
 */
export function useDemographicBehavior(demographic: string): {
  validationDelay: number;
  shouldShowExamples: boolean;
  shouldUseAnimations: boolean;
  prefersEmojis: boolean;
} {
  const { prefersReducedMotion } = useFormContext();

  const behaviors: Record<string, {
    validationDelay: number;
    shouldShowExamples: boolean;
    prefersEmojis: boolean;
  }> = {
    kids: {
      validationDelay: 500,
      shouldShowExamples: true,
      prefersEmojis: true,
    },
    fintech: {
      validationDelay: 150,
      shouldShowExamples: false,
      prefersEmojis: false,
    },
    gov: {
      validationDelay: 0,
      shouldShowExamples: true,
      prefersEmojis: false,
    },
    health: {
      validationDelay: 200,
      shouldShowExamples: true,
      prefersEmojis: false,
    },
    working_class: {
      validationDelay: 200,
      shouldShowExamples: true,
      prefersEmojis: false,
    },
  };

  const behavior = behaviors[demographic] || behaviors.working_class!;

  return {
    validationDelay: behavior.validationDelay,
    shouldShowExamples: behavior.shouldShowExamples,
    shouldUseAnimations: !prefersReducedMotion,
    prefersEmojis: behavior.prefersEmojis,
  };
}

/**
 * Hook to track form completion progress
 */
export function useFormProgress(
  fields: { id: string; required?: boolean }[],
  values: FormState
): {
  completedCount: number;
  requiredCount: number;
  optionalCount: number;
  completionPercentage: number;
  isComplete: boolean;
} {
  const requiredFields = fields.filter((f) => f.required);
  const optionalFields = fields.filter((f) => !f.required);

  const requiredCompleted = requiredFields.filter(
    (f) => values[f.id] && String(values[f.id]).trim() !== ''
  ).length;

  const optionalCompleted = optionalFields.filter(
    (f) => values[f.id] && String(values[f.id]).trim() !== ''
  ).length;

  const completedCount = requiredCompleted + optionalCompleted;
  const requiredCount = requiredFields.length;
  const optionalCount = optionalFields.length;

  const completionPercentage = requiredCount > 0
    ? Math.round((requiredCompleted / requiredCount) * 100)
    : 100;

  return {
    completedCount,
    requiredCount,
    optionalCount,
    completionPercentage,
    isComplete: requiredCompleted === requiredCount,
  };
}
