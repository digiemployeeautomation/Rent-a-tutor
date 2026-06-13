-- ============================================================
-- Migration 008: skill_lessons (teaching layer) + per-question explanations
--
-- skill_lessons holds IELTS strategy lessons (slide blocks in slides_data),
-- keyed by question_type, rendered by SlideViewer. Each lesson links to a
-- single-question-type drill practice_item via drill_item_id.
--
-- practice_questions.explanation is the per-question rationale shown ONLY on
-- the results page after submitting. Like answer_key (migration 006), it is
-- server-only: table-wide SELECT was already revoked in 006 and grants are
-- per-column, so simply NOT granting `explanation` keeps it unreadable by the
-- anon/authenticated roles. The deterministic grader reads it via the
-- service-role client.
-- ============================================================

CREATE TABLE IF NOT EXISTS skill_lessons (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section         TEXT NOT NULL CHECK (section IN ('reading','listening','writing','speaking')),
  question_type   TEXT,
  slug            TEXT NOT NULL UNIQUE,
  title           TEXT NOT NULL,
  summary         TEXT,
  slides_data     JSONB NOT NULL,
  drill_item_id   UUID REFERENCES practice_items(id) ON DELETE SET NULL,
  position        INT  NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS skill_lessons_section_status_pos_idx
  ON skill_lessons(section, status, position);

ALTER TABLE skill_lessons ENABLE ROW LEVEL SECURITY;

-- Authenticated users read published lessons; writes happen via the
-- service-role client only (no anon/authenticated write policy).
DROP POLICY IF EXISTS "skill_lessons_read_published" ON skill_lessons;
CREATE POLICY "skill_lessons_read_published"
  ON skill_lessons FOR SELECT TO authenticated
  USING (status = 'published');

-- Per-question explanation. Server-only: intentionally NOT granted to
-- anon/authenticated (table-wide SELECT was revoked in migration 006).
ALTER TABLE practice_questions ADD COLUMN IF NOT EXISTS explanation JSONB;

-- Defensive belt-and-braces: explicitly revoke the column from the client
-- roles. This is a no-op today (006 revoked table-wide SELECT and grants are a
-- per-column allowlist that excludes explanation), but it keeps 008
-- self-documenting and guards against a future blanket GRANT re-exposing it.
REVOKE SELECT (explanation) ON practice_questions FROM anon, authenticated;
