-- AI-native context graph for Skeed registry retrieval.
-- Embeddings are stored as deterministic quantized vectors so the published
-- registry can answer semantic queries offline without a local model.

CREATE TABLE IF NOT EXISTS context_documents (
  id TEXT PRIMARY KEY,
  subject_type TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  content_hash TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_context_subject ON context_documents(subject_type, subject_id);
CREATE INDEX IF NOT EXISTS idx_context_kind ON context_documents(kind);

CREATE TABLE IF NOT EXISTS context_embeddings (
  document_id TEXT NOT NULL,
  model TEXT NOT NULL,
  dimensions INTEGER NOT NULL,
  vector_blob BLOB NOT NULL,
  source_text_hash TEXT NOT NULL,
  PRIMARY KEY (document_id, model),
  FOREIGN KEY (document_id) REFERENCES context_documents(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_context_embeddings_model ON context_embeddings(model);

CREATE TABLE IF NOT EXISTS context_edges (
  id TEXT PRIMARY KEY,
  from_type TEXT NOT NULL,
  from_id TEXT NOT NULL,
  to_type TEXT NOT NULL,
  to_id TEXT NOT NULL,
  relation TEXT NOT NULL,
  weight REAL NOT NULL DEFAULT 1,
  metadata_json TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_context_edges_from ON context_edges(from_type, from_id);
CREATE INDEX IF NOT EXISTS idx_context_edges_to ON context_edges(to_type, to_id);
CREATE INDEX IF NOT EXISTS idx_context_edges_relation ON context_edges(relation);

CREATE TABLE IF NOT EXISTS retrieval_explanations (
  id TEXT PRIMARY KEY,
  query_hash TEXT NOT NULL,
  component_id TEXT NOT NULL,
  explanation_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (component_id) REFERENCES components(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_retrieval_explanations_query ON retrieval_explanations(query_hash);
CREATE INDEX IF NOT EXISTS idx_retrieval_explanations_component ON retrieval_explanations(component_id);
