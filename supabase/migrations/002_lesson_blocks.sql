-- ============================================================
-- Migration 002: lesson_blocks
-- Tagged-block pool per lesson. The student's track selects
-- which blocks render, in what order. Coexists with the
-- legacy lesson_sections table; the lesson page falls back
-- to lesson_sections when no blocks exist for a lesson.
-- ============================================================

CREATE TABLE IF NOT EXISTS lesson_blocks (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id          UUID        NOT NULL REFERENCES lessons_new(id) ON DELETE CASCADE,
  tag                TEXT        NOT NULL CHECK (tag IN (
                       'foundational',
                       'core-full',
                       'core-summary',
                       'worked-easy',
                       'worked-medium',
                       'worked-hard',
                       'practice',
                       'common-mistakes',
                       'recap'
                     )),
  order_within_tag   INTEGER     NOT NULL DEFAULT 0,
  slides_data        JSONB       NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lesson_blocks_lesson_id_idx
  ON lesson_blocks (lesson_id);

CREATE INDEX IF NOT EXISTS lesson_blocks_lesson_tag_idx
  ON lesson_blocks (lesson_id, tag, order_within_tag);

-- RLS: students can read; only admins can write.
ALTER TABLE lesson_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lesson_blocks_read_authenticated"
  ON lesson_blocks
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "lesson_blocks_write_admin_only"
  ON lesson_blocks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );
