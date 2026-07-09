-- SoundWeave Database Schema
-- Run this once against your PostgreSQL instance

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Scenes ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scenes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script       TEXT        NOT NULL,
  parsed_data  JSONB,
  status       VARCHAR(20) NOT NULL DEFAULT 'queued',   -- queued | processing | complete | failed
  audio_url    TEXT,
  duration     FLOAT,
  error_message TEXT,
  created_at   TIMESTAMP   NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scenes_status     ON scenes(status);
CREATE INDEX IF NOT EXISTS idx_scenes_created_at ON scenes(created_at DESC);

-- ── Audio Layers ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audio_layers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id         UUID        NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  layer_type       VARCHAR(20) NOT NULL,           -- voice | ambience | effect
  character_name   VARCHAR(100),
  description      TEXT,
  file_url         TEXT        NOT NULL,
  duration         FLOAT,
  volume           FLOAT       NOT NULL DEFAULT 0.0,   -- dB
  spatial_position JSONB,                              -- {x, y, z, distance}
  loop             BOOLEAN     NOT NULL DEFAULT FALSE,
  start_time       FLOAT       NOT NULL DEFAULT 0.0,   -- seconds on scene timeline
  created_at       TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audio_layers_scene_id   ON audio_layers(scene_id);
CREATE INDEX IF NOT EXISTS idx_audio_layers_layer_type ON audio_layers(layer_type);

-- ── Jobs ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS jobs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id      UUID        REFERENCES scenes(id) ON DELETE SET NULL,
  job_type      VARCHAR(20) NOT NULL,   -- generate | refine
  status        VARCHAR(20) NOT NULL DEFAULT 'queued',
  step          VARCHAR(50),
  progress      JSONB,                  -- {current, total}
  input_data    JSONB,
  result_data   JSONB,
  error_message TEXT,
  started_at    TIMESTAMP,
  completed_at  TIMESTAMP,
  created_at    TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_scene_id ON jobs(scene_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status   ON jobs(status);

-- ── Refinements ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refinements (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id            UUID        NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  command             TEXT        NOT NULL,
  interpreted_changes JSONB,
  applied             BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refinements_scene_id ON refinements(scene_id);
