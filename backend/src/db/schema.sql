-- CLIS Nigeria — Database Schema
-- Run this first: createdb clis_nigeria

CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  email       VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name        VARCHAR(255) NOT NULL,
  role        VARCHAR(20)  NOT NULL CHECK (role IN ('registrar', 'admin')),
  jurisdiction_state VARCHAR(100),
  user_code   VARCHAR(20)  UNIQUE NOT NULL,
  mfa_secret  TEXT,
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS titles (
  id                 SERIAL PRIMARY KEY,
  title_ref          VARCHAR(30) UNIQUE NOT NULL,
  owner_nin_last4    VARCHAR(4)  NOT NULL,
  owner_name_masked  VARCHAR(100) NOT NULL,
  jurisdiction_state VARCHAR(100) NOT NULL,
  lga                VARCHAR(100),
  latitude           DECIMAL(10,7),
  longitude          DECIMAL(10,7),
  document_ref       VARCHAR(100),
  registration_date  DATE NOT NULL,
  status             VARCHAR(20) NOT NULL DEFAULT 'registered'
                     CHECK (status IN ('registered','disputed','pending','revoked')),
  registered_by      VARCHAR(20),
  dispute_case       VARCHAR(20),
  last_modified      TIMESTAMPTZ DEFAULT NOW(),
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id           SERIAL PRIMARY KEY,
  timestamp    TIMESTAMPTZ DEFAULT NOW(),
  user_code    VARCHAR(20) NOT NULL,
  operation    VARCHAR(20) NOT NULL CHECK (operation IN ('INSERT','UPDATE','FLAG_DISPUTE')),
  record_ref   VARCHAR(30) NOT NULL,
  before_state JSONB,
  after_state  JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_titles_ref    ON titles (title_ref);
CREATE INDEX IF NOT EXISTS idx_titles_status ON titles (status);
CREATE INDEX IF NOT EXISTS idx_audit_ts      ON audit_log (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user    ON audit_log (user_code);
