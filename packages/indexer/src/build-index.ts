import { createHash } from 'node:crypto';
import { mkdir, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { loadArchetypes } from '@skeed/archetypes-loader';
import { loadDemographics } from '@skeed/demographics-loader';
import Database from 'better-sqlite3';
import { applyMigrations, discoverMigrations } from './migrate.js';

export interface BuildIndexOptions {
  /** Absolute path to repo `data/` directory. */
  dataRoot: string;
  /** Absolute path to write the SQLite file to. Overwritten if it exists. */
  outPath: string;
  /** Absolute path to the migrations directory. */
  migrationsDir: string;
  /** Registry version this index represents. */
  registryVersion: string;
  /** Embedding model id pinned for this build (placeholder until v0.2). */
  embeddingModel?: string;
  /** Git commit hash of the build, optional. */
  commit?: string;
  /** When true, deletes any existing file at `outPath` first. */
  clean?: boolean;
}

export interface BuildIndexResult {
  outPath: string;
  registryVersion: string;
  demographicsIndexed: number;
  archetypesIndexed: number;
  componentsIndexed: number;
  logoPrimitivesIndexed: number;
  durationMs: number;
}

export async function buildIndex(opts: BuildIndexOptions): Promise<BuildIndexResult> {
  const t0 = performance.now();
  await mkdir(dirname(opts.outPath), { recursive: true });
  if (opts.clean) {
    await rm(opts.outPath, { force: true });
  }

  const db = new Database(opts.outPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const migrations = await discoverMigrations(opts.migrationsDir);
  applyMigrations(db, migrations);

  // Indexer is lenient: stub demographics (those with `_TODO` markers) fail validation
  // and are silently skipped. lint:data is the strict gate; the indexer just indexes
  // whatever validates so local development with WIP demographics still produces a usable DB.
  const demos = await loadDemographics({
    dataRoot: join(opts.dataRoot, 'demographics'),
  });
  const arch = await loadArchetypes({
    dataRoot: join(opts.dataRoot, 'archetypes'),
  });
  if (demos.errors.length > 0) {
    process.stderr.write(
      `indexer: skipped ${demos.errors.length} demographic(s) with validation errors (likely stubs)\n`,
    );
  }
  if (arch.errors.length > 0) {
    process.stderr.write(
      `indexer: skipped ${arch.errors.length} archetype(s) with validation errors\n`,
    );
  }

  const insertDemographic = db.prepare(
    'INSERT OR REPLACE INTO demographics (id, preset_json, source_path, content_hash) VALUES (?, ?, ?, ?)',
  );
  const insertPsychology = db.prepare(
    'INSERT OR REPLACE INTO psychology_profiles (demographic_id, niche, profile_json) VALUES (?, ?, ?)',
  );
  const insertPainPoint = db.prepare(
    'INSERT OR REPLACE INTO pain_points (demographic_id, niche, point_id, point_json) VALUES (?, ?, ?, ?)',
  );
  const insertLogoPrimitive = db.prepare(
    'INSERT OR REPLACE INTO logo_primitives (id, demographic_id, kind, source_path, contents) VALUES (?, ?, ?, ?, ?)',
  );
  const insertArchetype = db.prepare(
    'INSERT OR REPLACE INTO archetypes (id, category, manifest_json, source_path, source_tsx) VALUES (?, ?, ?, ?, ?)',
  );
  const insertBuildMeta = db.prepare(
    'INSERT OR REPLACE INTO build_meta (registry_version, built_at, built_from_commit, embedding_model, schema_version) VALUES (?, ?, ?, ?, ?)',
  );

  let logoPrimitivesIndexed = 0;
  const txn = db.transaction(() => {
    for (const [demoId, demo] of demos.demographics) {
      const presetJson = JSON.stringify(demo.preset);
      insertDemographic.run(
        demoId,
        presetJson,
        demo.readmePath.replace(opts.dataRoot, 'data'),
        sha256(presetJson),
      );
      for (const [niche, profile] of demo.psychology) {
        insertPsychology.run(demoId, niche, JSON.stringify(profile));
      }
      for (const [niche, painFile] of demo.painPoints) {
        for (const point of painFile.points) {
          insertPainPoint.run(demoId, niche, point.id, JSON.stringify(point));
        }
      }
      for (const kind of ['shapes', 'marks', 'wordmarks', 'containers'] as const) {
        for (const prim of demo.logoPrimitives[kind]) {
          insertLogoPrimitive.run(
            prim.id,
            demoId,
            prim.kind,
            prim.filePath.replace(opts.dataRoot, 'data'),
            prim.contents,
          );
          logoPrimitivesIndexed++;
        }
      }
    }
    for (const [id, a] of arch.archetypes) {
      insertArchetype.run(
        id,
        a.manifest.category,
        JSON.stringify(a.manifest),
        a.manifestPath.replace(opts.dataRoot, 'data'),
        a.source,
      );
    }
    insertBuildMeta.run(
      opts.registryVersion,
      new Date().toISOString(),
      opts.commit ?? 'unknown',
      opts.embeddingModel ?? 'bge-small-en-v1.5',
      Math.max(0, ...migrations.map((m) => m.version)),
    );
  });
  txn();

  const componentsIndexed = (
    db.prepare('SELECT count(*) as c FROM components').get() as { c: number }
  ).c;

  db.close();

  return {
    outPath: opts.outPath,
    registryVersion: opts.registryVersion,
    demographicsIndexed: demos.demographics.size,
    archetypesIndexed: arch.archetypes.size,
    componentsIndexed,
    logoPrimitivesIndexed,
    durationMs: Math.round(performance.now() - t0),
  };
}

function sha256(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}
