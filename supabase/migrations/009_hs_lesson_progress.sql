-- ============================================================
-- Migration 009: high-school lesson progress
--
-- High-school lessons are static content files (content/highschool/*.json),
-- identified by a text id such as "mathematics-fractions-1". This table
-- records each student's best quiz result per lesson.
-- ============================================================

CREATE TABLE IF NOT EXISTS hs_lesson_progress (
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id    TEXT        NOT NULL,
  score        INT         NOT NULL CHECK (score >= 0),
  total        INT         NOT NULL CHECK (total > 0),
  passed       BOOLEAN     NOT NULL DEFAULT false,
  attempts     INT         NOT NULL DEFAULT 1,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, lesson_id)
);

ALTER TABLE hs_lesson_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hs_progress_select_own" ON hs_lesson_progress;
CREATE POLICY "hs_progress_select_own" ON hs_lesson_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "hs_progress_insert_own" ON hs_lesson_progress;
CREATE POLICY "hs_progress_insert_own" ON hs_lesson_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "hs_progress_update_own" ON hs_lesson_progress;
CREATE POLICY "hs_progress_update_own" ON hs_lesson_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE ON hs_lesson_progress TO authenticated;
