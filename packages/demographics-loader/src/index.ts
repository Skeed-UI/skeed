import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import {
  type DemographicId,
  DemographicPreset,
  PainPoint,
  PsychologyProfile,
} from '@skeed/contracts';
import { z } from 'zod';

const PainPointFile = z.object({
  demographic: z.string(),
  niche: z.string(),
  schemaVersion: z.literal(1),
  points: z.array(PainPoint),
});

const IllustrationStyle = z.object({
  demographic: z.string(),
  schemaVersion: z.literal(1),
  promptSuffix: z.string(),
  negativePromptSuffix: z.string().default(''),
  preferredAspectRatios: z.array(z.string()).default([]),
  providerHints: z.record(z.string(), z.unknown()).default({}),
});
export type IllustrationStyle = z.infer<typeof IllustrationStyle>;

export interface LoadedDemographic {
  preset: DemographicPreset;
  psychology: Map<string, PsychologyProfile>;
  painPoints: Map<string, ReturnType<typeof PainPointFile.parse>>;
  illustrationStyle: IllustrationStyle;
  logoPrimitives: LogoPrimitiveIndex;
  ownersPath: string;
  readmePath: string;
}

export interface LogoPrimitive {
  id: string;
  kind: 'shape' | 'mark' | 'wordmark' | 'container';
  filePath: string;
  contents: string;
}

export interface LogoPrimitiveIndex {
  shapes: LogoPrimitive[];
  marks: LogoPrimitive[];
  wordmarks: LogoPrimitive[];
  containers: LogoPrimitive[];
}

export interface LoadOptions {
  /** Absolute path to the `data/demographics` directory. */
  dataRoot: string;
  /** Throw on first error instead of collecting. */
  strict?: boolean;
}

export interface LoadResult {
  demographics: Map<DemographicId, LoadedDemographic>;
  errors: Array<{ path: string; message: string }>;
}

export async function loadDemographics(opts: LoadOptions): Promise<LoadResult> {
  const result: LoadResult = { demographics: new Map(), errors: [] };
  const entries = await readdir(opts.dataRoot, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const demoDir = join(opts.dataRoot, entry.name);
    try {
      const loaded = await loadOneDemographic(demoDir);
      result.demographics.set(loaded.preset.id, loaded);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (opts.strict) throw err;
      result.errors.push({ path: demoDir, message });
    }
  }
  return result;
}

async function loadOneDemographic(demoDir: string): Promise<LoadedDemographic> {
  const presetPath = join(demoDir, 'preset.json');
  const presetJson = JSON.parse(await readFile(presetPath, 'utf8'));
  const preset = DemographicPreset.parse(presetJson);

  const psychology = new Map<string, PsychologyProfile>();
  const psyDir = join(demoDir, 'psychology');
  if (await dirExists(psyDir)) {
    for (const file of await readdir(psyDir)) {
      if (!file.endsWith('.json')) continue;
      const niche = file.replace(/\.json$/, '');
      const json = JSON.parse(await readFile(join(psyDir, file), 'utf8'));
      psychology.set(niche, PsychologyProfile.parse(json));
    }
  }

  const painPoints = new Map<string, ReturnType<typeof PainPointFile.parse>>();
  const painDir = join(demoDir, 'pain-points');
  if (await dirExists(painDir)) {
    for (const file of await readdir(painDir)) {
      if (!file.endsWith('.json')) continue;
      const niche = file.replace(/\.json$/, '');
      const json = JSON.parse(await readFile(join(painDir, file), 'utf8'));
      painPoints.set(niche, PainPointFile.parse(json));
    }
  }

  const illustrationPath = join(demoDir, 'illustration-style.json');
  const illustrationJson = JSON.parse(await readFile(illustrationPath, 'utf8'));
  const illustrationStyle = IllustrationStyle.parse(illustrationJson);

  const logoPrimitives = await loadLogoPrimitives(join(demoDir, 'logo-primitives'));

  return {
    preset,
    psychology,
    painPoints,
    illustrationStyle,
    logoPrimitives,
    ownersPath: join(demoDir, 'owners.md'),
    readmePath: join(demoDir, 'README.md'),
  };
}

async function loadLogoPrimitives(root: string): Promise<LogoPrimitiveIndex> {
  const out: LogoPrimitiveIndex = { shapes: [], marks: [], wordmarks: [], containers: [] };
  if (!(await dirExists(root))) return out;
  for (const kind of ['shapes', 'marks', 'wordmarks', 'containers'] as const) {
    const dir = join(root, kind);
    if (!(await dirExists(dir))) continue;
    for (const file of await readdir(dir)) {
      const filePath = join(dir, file);
      const contents = await readFile(filePath, 'utf8');
      const id = file.replace(/\.(svg|json)$/, '');
      const singular: LogoPrimitive['kind'] =
        kind === 'shapes' ? 'shape'
        : kind === 'marks' ? 'mark'
        : kind === 'wordmarks' ? 'wordmark'
        : 'container';
      out[kind].push({ id, kind: singular, filePath, contents });
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
