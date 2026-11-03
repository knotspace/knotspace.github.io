-- KNOT CMS D1 schema — initial bootstrap.
-- This migration only creates storage tables; the bootstrap Worker does not write to them.

CREATE TABLE IF NOT EXISTS cms_documents (
  document_id TEXT PRIMARY KEY,
  collection TEXT NOT NULL CHECK (collection IN ('blog', 'pages')),
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  content_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'scheduled')),
  scheduled_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  published_at TEXT,
  UNIQUE (collection, slug)
);

CREATE INDEX IF NOT EXISTS idx_cms_documents_status_updated
  ON cms_documents (status, updated_at DESC);

CREATE TABLE IF NOT EXISTS cms_revisions (
  revision_id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  snapshot_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  author_label TEXT,
  FOREIGN KEY (document_id) REFERENCES cms_documents(document_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_cms_revisions_document_created
  ON cms_revisions (document_id, created_at DESC);
