-- ============================================================
-- Migration 007: client-visible options for practice_questions
--
-- Single/multi-select questions (MCQ, matching) need their selectable
-- choices visible to the browser, while answer_key stays server-only
-- (migration 006). Add an `options` JSONB column and grant SELECT on it to
-- the client roles.
--
-- Convention (options column):
--   single_select / multi_select : { "choices": [{ "value": "A", "label": "..." }, ...] }
--   text_fill                    : null  (no choices)
--   tfng / ynng                  : null  (the question-type registry supplies fixedOptions)
-- ============================================================

ALTER TABLE practice_questions ADD COLUMN IF NOT EXISTS options JSONB;

GRANT SELECT (options) ON practice_questions TO anon, authenticated;
