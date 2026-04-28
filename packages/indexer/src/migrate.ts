import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type Database from 'better-sqlite3';

export interface MigrationFile {
  version: number;
  name: string;
  sql: string;
}

export async function discoverMigrations(migrationsDir: string): Promise<MigrationFile[]> {
  const files = (await readdir(migrationsDir)).filter((f) => /^\d{4}_.+\.sql$/.test(f)).sort();
  const out: MigrationFile[] = [];
  for (const file of files) {
    const m = /^(\d{4})_(.+)\.sql$/.exec(file);
    if (!m) continue;
    const versionStr = m[1];
    const name = m[2];
    if (!versionStr || !name) continue;
    const version = Number.parseInt(versionStr, 10);
    const sql = await readFile(join(migrationsDir, file), 'utf8');
    out.push({ version, name, sql });
  }
  return out;
}

export function applyMigrations(db: Database.Database, migrations: MigrationFile[]): number {
  db.exec(
    `CREATE TABLE IF NOT EXISTS schema_version (
       version INTEGER PRIMARY KEY,
       applied_at TEXT NOT NULL
     );`,
  );
  const applied = new Set<number>(
    db
      .prepare('SELECT version FROM schema_version')
      .all()
      .map((row) => (row as { version: number }).version),
  );
  let count = 0;
  const insertVersion = db.prepare(
    'INSERT INTO schema_version (version, applied_at) VALUES (?, ?)',
  );
  const txn = db.transaction((toApply: MigrationFile[]) => {
    for (const m of toApply) {
      db.exec(m.sql);
      insertVersion.run(m.version, new Date().toISOString());
      count++;
    }
  });
  txn(migrations.filter((m) => !applied.has(m.version)));
  return count;
}
