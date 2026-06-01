-- ============================================================
-- Migration 006: Answer-key privacy for practice_questions
--
-- The RLS policy "practice_questions_read_via_item" lets an authenticated
-- user SELECT questions of any published item — including the answer_key
-- column. That lets a determined user fetch the answers before submitting.
--
-- Fix with COLUMN-LEVEL privileges: revoke table-wide SELECT from the
-- anon/authenticated roles and re-grant SELECT on every column EXCEPT
-- answer_key. RLS row policies still apply on top. The deterministic grader
-- reads answer keys via the service-role client, which bypasses both RLS
-- and column grants.
-- ============================================================

REVOKE SELECT ON practice_questions FROM anon, authenticated;

GRANT SELECT (id, practice_item_id, position, question_type, prompt, accept_synonyms)
  ON practice_questions TO anon, authenticated;
