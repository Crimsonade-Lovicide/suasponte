-- 0001_init.sql — genesis schema for suasponte.dev.
--
-- The two triggers at the bottom ARE Canon IV: the governance log is
-- append-only, and the database itself refuses anything else. Do not
-- drop or work around them; that is a governance change (BRIEF rule 8).

CREATE TABLE motions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  filer_hash TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','granted','denied','deferred','stricken')),
  ruled_at TEXT,
  ruling TEXT
);

CREATE INDEX idx_motions_status ON motions(status, id);
CREATE INDEX idx_motions_filed_at ON motions(filed_at);
CREATE INDEX idx_motions_filer ON motions(filer_hash, filed_at);

CREATE TABLE log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  subject TEXT,
  detail TEXT NOT NULL
);

CREATE INDEX idx_log_subject ON log(subject, id);

CREATE TRIGGER log_append_only_update BEFORE UPDATE ON log
BEGIN
  SELECT RAISE(ABORT, 'log is append-only');
END;

CREATE TRIGGER log_append_only_delete BEFORE DELETE ON log
BEGIN
  SELECT RAISE(ABORT, 'log is append-only');
END;
