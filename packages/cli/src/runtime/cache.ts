import type { StageContext } from '@skeed/contracts';

/** In-memory cache impl. M1 only — replaced in M2 by ~/.skeed/cache.db (SQLite). */
export function createMemoryCache(): StageContext['cache'] {
  const m = new Map<string, unknown>();
  return {
    async get(key) {
      return m.get(key);
    },
    async set(key, value) {
      m.set(key, value);
    },
  };
}
