CREATE TABLE IF NOT EXISTS together_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  expires_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS together_state_expiry ON together_state (expires_at)
  WHERE expires_at IS NOT NULL;
