-- ============================================================
-- Migration 004: user_ielts_profile
-- Holds answers from the IELTS onboarding questionnaire.
-- One row per user; written by the questionnaire submit endpoint.
-- ============================================================

CREATE TABLE IF NOT EXISTS user_ielts_profile (
  user_id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  variant            TEXT CHECK (variant IN ('academic','general')),
  target_band        NUMERIC(2,1),
  per_section_target JSONB,
  test_date          DATE,
  current_band_self  NUMERIC(2,1),
  weakest_section    TEXT CHECK (weakest_section IN ('listening','reading','writing','speaking')),
  hours_per_week     INT,
  first_language     TEXT,
  completed_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE user_ielts_profile ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_ielts_profile_read_own" ON user_ielts_profile;
CREATE POLICY "user_ielts_profile_read_own"
  ON user_ielts_profile FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_ielts_profile_write_own" ON user_ielts_profile;
CREATE POLICY "user_ielts_profile_write_own"
  ON user_ielts_profile FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
