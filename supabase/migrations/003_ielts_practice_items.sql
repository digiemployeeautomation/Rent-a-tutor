-- ============================================================
-- Migration 003: IELTS Practice Items axis
-- Adds the "do it" surface for IELTS prep: practice items
-- (reading sets, listening sets, writing tasks, speaking tasks),
-- their questions (for L/R), submissions, grades, mock tests,
-- per-sub-skill user track assignment, and the calibration set.
--
-- Sub-skills are TEXT values (not FKs to topics), because the
-- existing topics table is coupled to the schools Forms→Terms→
-- Units→Topics hierarchy. The 8 IELTS sub-skills are a fixed,
-- enumerated set; CHECK constraints keep them honest.
-- ============================================================

-- ----------------------------------------------------------------------
-- Domain CHECK helpers (inlined into each table for clarity)
-- Allowed sub_skill values:
--   'listening', 'reading',
--   'writing-task-1-academic', 'writing-task-1-general',
--   'writing-task-2',
--   'speaking-part-1', 'speaking-part-2', 'speaking-part-3'
-- ----------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS practice_items (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type                TEXT NOT NULL CHECK (type IN (
                        'reading_set','listening_set','writing_task','speaking_task'
                      )),
  sub_skill           TEXT NOT NULL CHECK (sub_skill IN (
                        'listening','reading',
                        'writing-task-1-academic','writing-task-1-general','writing-task-2',
                        'speaking-part-1','speaking-part-2','speaking-part-3'
                      )),
  variant             TEXT NOT NULL CHECK (variant IN ('academic','general','both')),
  difficulty_band     NUMERIC(2,1) NOT NULL,
  criterion_tags      JSONB NOT NULL DEFAULT '[]'::jsonb,
  payload             JSONB NOT NULL,
  status              TEXT NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft','in_review','published')),
  generator_version   TEXT,
  created_by          UUID,
  reviewed_by         UUID,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at        TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS practice_items_status_idx
  ON practice_items(status);
CREATE INDEX IF NOT EXISTS practice_items_type_status_idx
  ON practice_items(type, status);
CREATE INDEX IF NOT EXISTS practice_items_sub_skill_status_idx
  ON practice_items(sub_skill, status);

CREATE TABLE IF NOT EXISTS practice_questions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_item_id    UUID NOT NULL REFERENCES practice_items(id) ON DELETE CASCADE,
  position            INT  NOT NULL,
  question_type       TEXT NOT NULL,
  prompt              TEXT NOT NULL,
  answer_key          JSONB NOT NULL,
  accept_synonyms     BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS practice_questions_item_idx
  ON practice_questions(practice_item_id, position);

CREATE TABLE IF NOT EXISTS submissions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  practice_item_id    UUID NOT NULL REFERENCES practice_items(id) ON DELETE CASCADE,
  started_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at        TIMESTAMPTZ,
  payload             JSONB NOT NULL DEFAULT '{}'::jsonb,
  status              TEXT NOT NULL DEFAULT 'pending_grade'
                        CHECK (status IN ('pending_grade','graded','error','blocked')),
  workflow_id         TEXT
);
CREATE INDEX IF NOT EXISTS submissions_user_idx
  ON submissions(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS submissions_status_idx
  ON submissions(status);

CREATE TABLE IF NOT EXISTS grades (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id         UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  band_overall          NUMERIC(3,1),
  band_per_criterion    JSONB,
  feedback              JSONB,
  graded_by             TEXT NOT NULL CHECK (graded_by IN ('auto-llm','auto-stt-llm','deterministic','stub')),
  model_version         TEXT,
  cost_cents            INT,
  latency_ms            INT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS grades_submission_idx
  ON grades(submission_id, created_at DESC);

CREATE TABLE IF NOT EXISTS mock_tests (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  variant             TEXT NOT NULL CHECK (variant IN ('academic','general')),
  sections            JSONB NOT NULL,
  curated             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mock_test_attempts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mock_test_id        UUID NOT NULL REFERENCES mock_tests(id) ON DELETE CASCADE,
  started_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at        TIMESTAMPTZ,
  band_overall        NUMERIC(3,1),
  band_per_section    JSONB
);

CREATE TABLE IF NOT EXISTS user_tracks (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sub_skill           TEXT NOT NULL CHECK (sub_skill IN (
                        'listening','reading',
                        'writing-task-1-academic','writing-task-1-general','writing-task-2',
                        'speaking-part-1','speaking-part-2','speaking-part-3'
                      )),
  track               TEXT NOT NULL CHECK (track IN ('foundation','practice','mock')),
  inferred_from       TEXT NOT NULL CHECK (inferred_from IN ('diagnostic','self_declared','auto_bump','default')),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, sub_skill)
);

CREATE TABLE IF NOT EXISTS calibration_set (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type                   TEXT NOT NULL CHECK (item_type IN ('writing_task','speaking_task')),
  payload                     JSONB NOT NULL,
  examiner_band_overall       NUMERIC(3,1) NOT NULL,
  examiner_band_per_criterion JSONB NOT NULL,
  notes                       TEXT
);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE practice_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades             ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_tests         ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tracks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE calibration_set    ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read published practice items
DROP POLICY IF EXISTS "practice_items_read_published" ON practice_items;
CREATE POLICY "practice_items_read_published"
  ON practice_items FOR SELECT TO authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS "practice_questions_read_via_item" ON practice_questions;
CREATE POLICY "practice_questions_read_via_item"
  ON practice_questions FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM practice_items pi
    WHERE pi.id = practice_questions.practice_item_id
      AND pi.status = 'published'
  ));

-- A user reads/writes only their own submissions
DROP POLICY IF EXISTS "submissions_read_own" ON submissions;
CREATE POLICY "submissions_read_own"
  ON submissions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "submissions_insert_own" ON submissions;
CREATE POLICY "submissions_insert_own"
  ON submissions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Grades read-only via own submissions; writes happen via service role only
DROP POLICY IF EXISTS "grades_read_via_own_submission" ON grades;
CREATE POLICY "grades_read_via_own_submission"
  ON grades FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM submissions s
    WHERE s.id = grades.submission_id
      AND s.user_id = auth.uid()
  ));

-- Mock tests visible to everyone authenticated
DROP POLICY IF EXISTS "mock_tests_read_all" ON mock_tests;
CREATE POLICY "mock_tests_read_all"
  ON mock_tests FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "mock_test_attempts_read_own" ON mock_test_attempts;
CREATE POLICY "mock_test_attempts_read_own"
  ON mock_test_attempts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_tracks_read_own" ON user_tracks;
CREATE POLICY "user_tracks_read_own"
  ON user_tracks FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
