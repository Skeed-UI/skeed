import { createHash } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import Database from 'better-sqlite3';

export interface CachedCall {
  cacheKey: string;
  modelId: string;
  text: string;
  tokenIn: number;
  tokenOut: number;
  createdAt: string;
  hitCount: number;
}

/**
 * Persistent LLM response cache backed by SQLite at `~/.skeed/cache.db`.
 * Pure key/value: hash of (stage, modelId, promptVersion, messages, schemaHash, temperature).
 */
export class LlmCache {
  private readonly db: Database.Database;

  constructor(path?: string) {
    const dbPath = path ?? join(homedir(), '.skeed', 'cache.db');
    mkdirSync(dirname(dbPath), { recursive: true });
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS llm_cache (
        cache_key TEXT PRIMARY KEY,
        stage TEXT NOT NULL,
        model_id TEXT NOT NULL,
        text TEXT NOT NULL,
        token_in INTEGER NOT NULL,
        token_out INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        hit_count INTEGER NOT NULL DEFAULT 0,
        last_hit_at TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_cache_stage ON llm_cache(stage);
      CREATE INDEX IF NOT EXISTS idx_cache_created ON llm_cache(created_at);
    `);
  }

  static keyFor(input: {
    stage: string;
    modelId: string;
    promptVersion: string;
    messages: unknown;
    schemaHash: string;
    temperature: number;
  }): string {
    const canonical = JSON.stringify({
      s: input.stage,
      m: input.modelId,
      pv: input.promptVersion,
      msg: input.messages,
      sh: input.schemaHash,
      t: input.temperature,
    });
    return createHash('sha256').update(canonical).digest('hex');
  }

  get(key: string): CachedCall | undefined {
    const row = this.db
      .prepare(
        'SELECT cache_key, model_id, text, token_in, token_out, created_at, hit_count FROM llm_cache WHERE cache_key = ?',
      )
      .get(key) as
      | {
          cache_key: string;
          model_id: string;
          text: string;
          token_in: number;
          token_out: number;
          created_at: string;
          hit_count: number;
        }
      | undefined;
    if (!row) return undefined;
    this.db
      .prepare(
        'UPDATE llm_cache SET hit_count = hit_count + 1, last_hit_at = ? WHERE cache_key = ?',
      )
      .run(new Date().toISOString(), key);
    return {
      cacheKey: row.cache_key,
      modelId: row.model_id,
      text: row.text,
      tokenIn: row.token_in,
      tokenOut: row.token_out,
      createdAt: row.created_at,
      hitCount: row.hit_count,
    };
  }

  set(
    key: string,
    value: { stage: string; modelId: string; text: string; tokenIn: number; tokenOut: number },
  ): void {
    this.db
      .prepare(
        'INSERT OR REPLACE INTO llm_cache (cache_key, stage, model_id, text, token_in, token_out, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      )
      .run(
        key,
        value.stage,
        value.modelId,
        value.text,
        value.tokenIn,
        value.tokenOut,
        new Date().toISOString(),
      );
  }

  close(): void {
    this.db.close();
  }
}
