/**
 * Smart Defaults Engine
 * 
 * Provides intelligent default values for form fields based on browser context,
 * geo-IP data, user preferences, and demographic-specific common defaults.
 */

import type { FormState, SmartDefaultSource } from '@skeed/contracts';

export interface SmartDefaultsEngine {
  getDefaults(sources: Record<string, SmartDefaultSource>): Promise<Partial<FormState>>;
  inferFromContext(existingState: FormState): Partial<FormState>;
  getDemographicDefaults(demographic: string): Partial<FormState>;
}

export interface BrowserContext {
  language: string;
  timezone: string;
  colorScheme: 'light' | 'dark' | 'no-preference';
  screenSize: { width: number; height: number };
}

export interface GeoContext {
  country?: string;
  region?: string;
  city?: string;
  currency?: string;
}

/**
 * Create a smart defaults engine instance
 */
export function createSmartDefaultsEngine(
  options: { 
    geoProvider?: () => Promise<GeoContext>;
    storage?: Storage;
  } = {}
): SmartDefaultsEngine {
  return {
    getDefaults: (sources) => getDefaults(sources, options),
    inferFromContext: (existingState) => inferFromContext(existingState),
    getDemographicDefaults: (demographic) => getDemographicDefaults(demographic),
  };
}

/**
 * Get defaults from specified sources
 */
async function getDefaults(
  sources: Record<string, SmartDefaultSource>,
  options: { geoProvider?: () => Promise<GeoContext>; storage?: Storage }
): Promise<Partial<FormState>> {
  const defaults: Partial<FormState> = {};

  for (const [fieldId, source] of Object.entries(sources)) {
    switch (source) {
      case 'browser':
        const browserValue = getBrowserDefault(fieldId);
        if (browserValue) {
          defaults[fieldId] = browserValue;
        }
        break;

      case 'geo-ip':
        if (options.geoProvider) {
          try {
            const geo = await options.geoProvider();
            const geoValue = getGeoDefault(fieldId, geo);
            if (geoValue) {
              defaults[fieldId] = geoValue;
            }
          } catch {
            // Silently fail - geo defaults are optional
          }
        }
        break;

      case 'user-context':
        const storedValue = getStoredDefault(fieldId, options.storage);
        if (storedValue) {
          defaults[fieldId] = storedValue;
        }
        break;

      case 'none':
        // No default
        break;
    }
  }

  return defaults;
}

/**
 * Get browser-based defaults
 */
function getBrowserDefault(fieldId: string): string | undefined {
  if (typeof navigator === 'undefined') return undefined;

  const fieldIdLower = fieldId.toLowerCase();

  // Language
  if (fieldIdLower.includes('language') || fieldIdLower.includes('lang')) {
    return navigator.language || 'en-US';
  }

  // Timezone
  if (fieldIdLower.includes('timezone') || fieldIdLower.includes('tz')) {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return undefined;
    }
  }

  // User agent hints (for device type)
  if (fieldIdLower.includes('device') || fieldIdLower.includes('platform')) {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('mobile')) return 'mobile';
    if (userAgent.includes('tablet')) return 'tablet';
    return 'desktop';
  }

  return undefined;
}

/**
 * Get geo-based defaults
 */
function getGeoDefault(fieldId: string, geo: GeoContext): string | undefined {
  const fieldIdLower = fieldId.toLowerCase();

  if ((fieldIdLower.includes('country') || fieldIdLower.includes('nation')) && geo.country) {
    return geo.country;
  }

  if ((fieldIdLower.includes('state') || fieldIdLower.includes('region') || fieldIdLower.includes('province')) && geo.region) {
    return geo.region;
  }

  if (fieldIdLower.includes('city') && geo.city) {
    return geo.city;
  }

  if (fieldIdLower.includes('currency') && geo.currency) {
    return geo.currency;
  }

  return undefined;
}

/**
 * Get stored user preference
 */
function getStoredDefault(fieldId: string, storage?: Storage): string | undefined {
  if (!storage) return undefined;
  
  try {
    const key = `skeed-form-default-${fieldId}`;
    return storage.getItem(key) || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Store a user preference for future defaults
 */
export function storeDefault(fieldId: string, value: string, storage?: Storage): void {
  if (!storage) return;
  
  try {
    const key = `skeed-form-default-${fieldId}`;
    storage.setItem(key, value);
  } catch {
    // Silently fail - storage is optional
  }
}

/**
 * Infer additional defaults from existing form state
 */
function inferFromContext(existingState: FormState): Partial<FormState> {
  const inferred: Partial<FormState> = {};

  // Infer country from email domain
  const email = existingState.email as string | undefined;
  if (email && !existingState.country) {
    const domain = email.split('@')[1];
    if (domain) {
      const country = inferCountryFromDomain(domain);
      if (country) {
        inferred.country = country;
      }
    }
  }

  // Infer name parts from full name
  const fullName = existingState.fullName || existingState.name;
  if (typeof fullName === 'string') {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      if (!existingState.firstName) {
        inferred.firstName = parts[0];
      }
      if (!existingState.lastName) {
        inferred.lastName = parts[parts.length - 1];
      }
    }
  }

  // Infer company from email domain (if corporate)
  if (email && !existingState.company) {
    const domain = email.split('@')[1];
    if (domain && !isCommonEmailProvider(domain)) {
      inferred.company = domain.split('.')[0];
    }
  }

  return inferred;
}

/**
 * Get demographic-specific common defaults
 */
function getDemographicDefaults(demographic: string): Partial<FormState> {
  const defaults: Record<string, Partial<FormState>> = {
    kids: {
      theme: 'colorful',
      notifications: 'simplified',
    },
    fintech: {
      currency: 'USD',
      twoFactor: 'enabled',
    },
    gov: {
      language: 'en-US',
      accessibility: 'wcag-aa',
    },
    health: {
      unitSystem: 'metric',
      privacy: 'strict',
    },
    working_class: {
      notifications: 'email',
      language: 'en-US',
    },
  };

  return defaults[demographic] || {};
}

/**
 * Infer country from email domain
 */
function inferCountryFromDomain(domain: string): string | undefined {
  const tldToCountry: Record<string, string> = {
    'uk': 'GB',
    'gb': 'GB',
    'de': 'DE',
    'fr': 'FR',
    'es': 'ES',
    'it': 'IT',
    'nl': 'NL',
    'ca': 'CA',
    'au': 'AU',
    'jp': 'JP',
    'cn': 'CN',
    'br': 'BR',
    'in': 'IN',
    'mx': 'MX',
    'ru': 'RU',
    'kr': 'KR',
    'us': 'US',
  };

  const tld = domain.split('.').pop()?.toLowerCase();
  return tld ? tldToCountry[tld] : undefined;
}

/**
 * Check if email domain is a common consumer provider
 */
function isCommonEmailProvider(domain: string): boolean {
  const providers = [
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'aol.com',
    'icloud.com',
    'mail.com',
    'protonmail.com',
  ];
  return providers.includes(domain.toLowerCase());
}

/**
 * Get browser context information
 */
export function getBrowserContext(): BrowserContext {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      language: 'en-US',
      timezone: 'UTC',
      colorScheme: 'no-preference',
      screenSize: { width: 1024, height: 768 },
    };
  }

  return {
    language: navigator.language || 'en-US',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    colorScheme: getColorScheme(),
    screenSize: {
      width: window.screen.width,
      height: window.screen.height,
    },
  };
}

/**
 * Get preferred color scheme
 */
function getColorScheme(): 'light' | 'dark' | 'no-preference' {
  if (typeof window === 'undefined') return 'no-preference';
  
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  return 'no-preference';
}

/**
 * Common default configurations per field type
 */
export const CommonDefaultSources: Record<string, SmartDefaultSource> = {
  language: 'browser',
  timezone: 'browser',
  country: 'geo-ip',
  region: 'geo-ip',
  city: 'geo-ip',
  currency: 'geo-ip',
  theme: 'browser',
  device: 'browser',
};
