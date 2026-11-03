-- Encrypted GitHub OAuth token used only by the KNOT publish endpoint.
CREATE TABLE IF NOT EXISTS cms_github_tokens (
  user_login TEXT PRIMARY KEY,
  encrypted_token TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
