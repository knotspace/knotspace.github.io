CREATE TABLE IF NOT EXISTS links (
 id TEXT PRIMARY KEY,
 mode TEXT NOT NULL CHECK(mode IN ('surprise','redirect')),
 destination TEXT,
 created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS visits (
 id TEXT PRIMARY KEY,
 link_id TEXT NOT NULL,
 ip TEXT NOT NULL,
 country TEXT,
 region TEXT,
 city TEXT,
 isp TEXT,
 org TEXT,
 asn TEXT,
 created_at TEXT NOT NULL,
 FOREIGN KEY(link_id) REFERENCES links(id)
);
CREATE INDEX IF NOT EXISTS visits_created_at ON visits(created_at);
CREATE INDEX IF NOT EXISTS visits_link_id ON visits(link_id);