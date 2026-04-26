-- Initial schema for the Skeed Tier-2 registry index.
-- This file is the source-of-truth schema. Migrations are forward-only
-- and applied in lexical order by `packages/indexer/src/migrate.ts`.

CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS demographics (
  id TEXT PRIMARY KEY,
  preset_json TEXT NOT NULL,
  source_path TEXT NOT NULL,
  content_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS psychology_profiles (
  demographic_id TEXT NOT NULL,
  niche TEXT NOT NULL,
  profile_json TEXT NOT NULL,
  PRIMARY KEY (demographic_id, niche),
  FOREIGN KEY (demographic_id) REFERENCES demographics(id)
);

CREATE TABLE IF NOT EXISTS pain_points (
  demographic_id TEXT NOT NULL,
  niche TEXT NOT NULL,
  point_id TEXT NOT NULL,
  point_json TEXT NOT NULL,
  PRIMARY KEY (demographic_id, niche, point_id)
);

CREATE TABLE IF NOT EXISTS archetypes (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  manifest_json TEXT NOT NULL,
  source_path TEXT NOT NULL,
  source_tsx TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS components (
  id TEXT PRIMARY KEY,
  archetype_id TEXT NOT NULL,
  demographic_id TEXT NOT NULL,
  density TEXT NOT NULL,
  manifest_json TEXT NOT NULL,
  source_tsx_path TEXT NOT NULL,
  thumb_path TEXT,
  category TEXT NOT NULL,
  wcag_level TEXT NOT NULL,
  age_min INTEGER,
  age_max INTEGER,
  cognitive_load TEXT NOT NULL,
  reduced_motion_safe INTEGER NOT NULL,
  framework TEXT NOT NULL,
  license TEXT NOT NULL,
  attribution_source TEXT,
  attribution_url TEXT,
  content_hash TEXT NOT NULL,
  registry_version TEXT NOT NULL,
  FOREIGN KEY (archetype_id) REFERENCES archetypes(id),
  FOREIGN KEY (demographic_id) REFERENCES demographics(id)
);
CREATE INDEX IF NOT EXISTS idx_components_demo ON components(demographic_id);
CREATE INDEX IF NOT EXISTS idx_components_arch ON components(archetype_id);
CREATE INDEX IF NOT EXISTS idx_components_cat ON components(category);
CREATE INDEX IF NOT EXISTS idx_components_density ON components(density);
CREATE INDEX IF NOT EXISTS idx_components_wcag ON components(wcag_level);

CREATE TABLE IF NOT EXISTS component_demographics (
  component_id TEXT NOT NULL,
  demographic_id TEXT NOT NULL,
  weight REAL NOT NULL,
  PRIMARY KEY (component_id, demographic_id)
);

CREATE TABLE IF NOT EXISTS component_psychology_signals (
  component_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  PRIMARY KEY (component_id, key)
);

CREATE TABLE IF NOT EXISTS component_trust_cues (
  component_id TEXT NOT NULL,
  cue TEXT NOT NULL,
  PRIMARY KEY (component_id, cue)
);

CREATE TABLE IF NOT EXISTS component_anti_patterns (
  component_id TEXT NOT NULL,
  demographic_id TEXT NOT NULL,
  PRIMARY KEY (component_id, demographic_id)
);

CREATE TABLE IF NOT EXISTS component_asset_slots (
  component_id TEXT NOT NULL,
  slot_role TEXT NOT NULL,
  slot_type TEXT NOT NULL,
  required INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (component_id, slot_role)
);

CREATE TABLE IF NOT EXISTS component_keywords (
  component_id TEXT NOT NULL,
  keyword TEXT NOT NULL,
  PRIMARY KEY (component_id, keyword)
);

CREATE TABLE IF NOT EXISTS component_intent_phrases (
  component_id TEXT NOT NULL,
  phrase TEXT NOT NULL,
  ord INTEGER NOT NULL,
  PRIMARY KEY (component_id, ord)
);

CREATE TABLE IF NOT EXISTS logo_primitives (
  id TEXT NOT NULL,
  demographic_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  source_path TEXT NOT NULL,
  contents TEXT NOT NULL,
  PRIMARY KEY (demographic_id, kind, id)
);

CREATE TABLE IF NOT EXISTS icon_packs (
  id TEXT PRIMARY KEY,
  style TEXT NOT NULL,
  count INTEGER NOT NULL,
  base_path TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS build_meta (
  registry_version TEXT PRIMARY KEY,
  built_at TEXT NOT NULL,
  built_from_commit TEXT NOT NULL,
  embedding_model TEXT NOT NULL,
  schema_version INTEGER NOT NULL
);
