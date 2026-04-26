-- FTS5 lexical search over component name + keywords + intent phrases.
-- This migration is lazy on populated rows: we rebuild via `INSERT INTO component_fts ... SELECT ...`
-- in the indexer when components exist. Empty registries get the schema only.
--
-- The vector index is intentionally left out until the embedding model is bundled
-- (see 0003_vector_index.sql, applied when bge-small-en ships in @skeed/indexer).

CREATE VIRTUAL TABLE IF NOT EXISTS component_fts USING fts5(
  component_id UNINDEXED,
  name,
  keywords,
  ai_intent_phrases,
  example_intents,
  tokenize='porter'
);
