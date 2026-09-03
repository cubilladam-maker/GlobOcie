CREATE TABLE IF NOT EXISTS visitors (
  site_id TEXT NOT NULL,
  visitor_hash TEXT NOT NULL,
  first_seen TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (site_id, visitor_hash)
);

CREATE TABLE IF NOT EXISTS owner_browsers (
  site_id TEXT NOT NULL,
  visitor_hash TEXT NOT NULL,
  claimed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (site_id, visitor_hash)
);

CREATE TABLE IF NOT EXISTS daily_ip_limits (
  day TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  registrations INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, ip_hash)
);

CREATE INDEX IF NOT EXISTS visitors_site_id_idx ON visitors(site_id);
