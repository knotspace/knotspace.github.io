-- Run once against an existing TRACE LAB D1 database.
ALTER TABLE links ADD COLUMN mode TEXT NOT NULL DEFAULT 'redirect';
