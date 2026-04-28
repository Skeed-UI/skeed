import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type LogoPrimitiveIndex, loadDemographics } from '@skeed/demographics-loader';

const __dirname = dirname(fileURLToPath(import.meta.url));

let _cache: Map<string, LogoPrimitiveIndex> | undefined;

/** Walk up from this file until a `data/demographics` directory exists. */
export function findRepoData(): string {
  let cur = __dirname;
  for (let i = 0; i < 8; i += 1) {
    const candidate = resolve(cur, 'data', 'demographics');
    if (existsSync(candidate)) return candidate;
    cur = resolve(cur, '..');
  }
  // Fallback: assume monorepo layout
  return resolve(__dirname, '..', '..', '..', 'data', 'demographics');
}

/** Load primitive index for a given demographic; returns empty index if not found. */
export async function loadPrimitives(demographicId: string): Promise<LogoPrimitiveIndex> {
  if (!_cache) {
    const dataRoot = findRepoData();
    const loaded = await loadDemographics({ dataRoot });
    _cache = new Map();
    for (const [id, demo] of loaded.demographics) {
      _cache.set(id, demo.logoPrimitives);
    }
  }
  return _cache.get(demographicId) ?? { shapes: [], marks: [], wordmarks: [], containers: [] };
}
