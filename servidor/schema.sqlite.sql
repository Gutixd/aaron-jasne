-- Misma estructura que schema.mysql.sql, para probar en local con SQLite.
CREATE TABLE IF NOT EXISTS confirmaciones (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre        TEXT NOT NULL,
  telefono      TEXT NULL,
  asiste        INTEGER NOT NULL,
  acompanantes  INTEGER NOT NULL DEFAULT 0,
  alimentacion  TEXT NULL,
  mensaje       TEXT NULL,
  creado        TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_creado ON confirmaciones (creado);

CREATE TABLE IF NOT EXISTS intentos (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  ip_hash  TEXT NOT NULL,
  creado   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ip ON intentos (ip_hash, creado);
