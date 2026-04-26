import Database from 'better-sqlite3';

export interface CatalogRow {
  id: string;
  name: string;
  category: string;
  demographics: string[];
  summary: string;
  thumbPath: string | null;
  score: number;
}

export interface SearchOpts {
  intent: string;
  demographic?: string;
  category?: string;
  density?: string;
  framework?: string;
  limit?: number;
}

export class Catalog {
  private readonly db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath, { readonly: true, fileMustExist: true });
    this.db.pragma('foreign_keys = ON');
  }

  close(): void {
    this.db.close();
  }

  searchComponents(opts: SearchOpts): CatalogRow[] {
    const where: string[] = [];
    const params: unknown[] = [];
    if (opts.demographic) {
      where.push('c.demographic_id = ?');
      params.push(opts.demographic);
    }
    if (opts.category) {
      where.push('c.category = ?');
      params.push(opts.category);
    }
    if (opts.density) {
      where.push('c.density = ?');
      params.push(opts.density);
    }
    if (opts.framework) {
      where.push('c.framework = ?');
      params.push(opts.framework);
    }
    const limit = Math.min(Math.max(opts.limit ?? 10, 1), 50);

    // FTS5 may not exist if migration hasn't run; do a plain prefix match fallback.
    const ftsAvailable = this.db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='component_fts'",
      )
      .get();

    let rows: Array<{
      id: string;
      manifest_json: string;
      thumb_path: string | null;
      score: number;
    }>;

    if (ftsAvailable) {
      const intentClause = opts.intent.replace(/['"`]/g, '').trim();
      const sql = `
        SELECT c.id, c.manifest_json, c.thumb_path, bm25(component_fts) as score
        FROM component_fts
        JOIN components c ON c.id = component_fts.component_id
        ${where.length ? `WHERE ${where.join(' AND ')} AND` : 'WHERE'}
        component_fts MATCH ?
        ORDER BY score
        LIMIT ?
      `;
      rows = this.db
        .prepare(sql)
        .all(...params, intentClause || '*', limit) as typeof rows;
    } else {
      const sql = `
        SELECT c.id, c.manifest_json, c.thumb_path, 0 as score
        FROM components c
        ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
        LIMIT ?
      `;
      rows = this.db.prepare(sql).all(...params, limit) as typeof rows;
    }

    return rows.map((row) => {
      const manifest = JSON.parse(row.manifest_json) as {
        name: string;
        category: string;
        demographics: Array<{ id: string }>;
        description?: string;
      };
      const demographicIds = manifest.demographics.map((d) => d.id);
      return {
        id: row.id,
        name: manifest.name,
        category: manifest.category,
        demographics: demographicIds,
        summary: manifest.description ?? '',
        thumbPath: row.thumb_path,
        score: row.score,
      };
    });
  }

  getComponent(
    id: string,
  ): { manifest: unknown; sourceTsx: string | null } | null {
    const row = this.db
      .prepare(
        'SELECT manifest_json, source_tsx_path FROM components WHERE id = ?',
      )
      .get(id) as { manifest_json: string; source_tsx_path: string } | undefined;
    if (!row) return null;
    return {
      manifest: JSON.parse(row.manifest_json),
      sourceTsx: null, // TSX source loaded by client from path; or future: inline
    };
  }

  listDemographics(): Array<{ id: string }> {
    return this.db.prepare('SELECT id FROM demographics ORDER BY id').all() as Array<{ id: string }>;
  }

  getPreset(id: string): unknown | null {
    const row = this.db
      .prepare('SELECT preset_json FROM demographics WHERE id = ?')
      .get(id) as { preset_json: string } | undefined;
    if (!row) return null;
    return JSON.parse(row.preset_json);
  }

  listArchetypes(): Array<{ id: string; category: string; name: string }> {
    const rows = this.db
      .prepare('SELECT id, category, manifest_json FROM archetypes ORDER BY id')
      .all() as Array<{ id: string; category: string; manifest_json: string }>;
    return rows.map((r) => ({
      id: r.id,
      category: r.category,
      name: (JSON.parse(r.manifest_json) as { name: string }).name,
    }));
  }
}
