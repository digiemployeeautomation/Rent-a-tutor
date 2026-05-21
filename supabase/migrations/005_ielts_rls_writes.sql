-- ============================================================
-- Migration 005: missing RLS write policies
-- Migration 003 only created SELECT policies on user_tracks and
-- grades, and only SELECT/INSERT on submissions. The onboarding
-- endpoint and the grader need to be able to write — without these
-- policies the inserts are silently blocked by RLS and the API
-- returns 500.
-- ============================================================

-- user_tracks: the user owns their own rows (onboarding seeds them,
-- auto-bumps update them later). Insert + update gated by the user_id.

DROP POLICY IF EXISTS "user_tracks_insert_own" ON user_tracks;
CREATE POLICY "user_tracks_insert_own"
  ON user_tracks FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_tracks_update_own" ON user_tracks;
CREATE POLICY "user_tracks_update_own"
  ON user_tracks FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- submissions: users can update their own row's status/payload after
-- the grader runs (the grader runs server-side and sets status='graded').

DROP POLICY IF EXISTS "submissions_update_own" ON submissions;
CREATE POLICY "submissions_update_own"
  ON submissions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- grades: NO authenticated write policy on purpose. Writes happen
-- only via the service role key (server-side grading endpoint) so
-- users cannot forge their own band scores. Read remains gated on
-- owning the underlying submission (already created in 003).
