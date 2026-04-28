import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import {
  type ArchetypeManifest,
  ArchetypeManifest as ArchetypeManifestSchema,
} from '@skeed/contracts';

export interface LoadedArchetype {
  manifest: ArchetypeManifest;
  manifestPath: string;
  sourcePath: string;
  source: string;
}

export interface LoadArchetypesOptions {
  /** Absolute path to the `data/archetypes` directory. */
  dataRoot: string;
  strict?: boolean;
}

export interface LoadArchetypesResult {
  archetypes: Map<string, LoadedArchetype>;
  errors: Array<{ path: string; message: string }>;
}

export async function loadArchetypes(opts: LoadArchetypesOptions): Promise<LoadArchetypesResult> {
  const out: LoadArchetypesResult = { archetypes: new Map(), errors: [] };
  if (!(await dirExists(opts.dataRoot))) return out;

  const entries = await readdir(opts.dataRoot);
  for (const entry of entries) {
    if (!entry.endsWith('.archetype.json')) continue;
    const manifestPath = join(opts.dataRoot, entry);
    const id = entry.replace(/\.archetype\.json$/, '');
    const sourcePath = join(opts.dataRoot, `${id}.archetype.tsx`);
    try {
      const manifestJson = JSON.parse(await readFile(manifestPath, 'utf8'));
      const manifest = ArchetypeManifestSchema.parse(manifestJson);
      if (manifest.id !== id) {
        throw new Error(`archetype id "${manifest.id}" does not match filename "${id}"`);
      }
      const source = await readFile(sourcePath, 'utf8');
      out.archetypes.set(id, { manifest, manifestPath, sourcePath, source });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (opts.strict) throw err;
      out.errors.push({ path: manifestPath, message });
    }
  }
  return out;
}

async function dirExists(path: string): Promise<boolean> {
  try {
    const s = await stat(path);
    return s.isDirectory();
  } catch {
    return false;
  }
}
