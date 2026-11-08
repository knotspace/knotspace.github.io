-- Run once on an existing D1 database.
ALTER TABLE visits ADD COLUMN gps_lat REAL;
ALTER TABLE visits ADD COLUMN gps_lon REAL;
ALTER TABLE visits ADD COLUMN gps_at TEXT;
