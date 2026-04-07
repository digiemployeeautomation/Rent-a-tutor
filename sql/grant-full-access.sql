-- =============================================================
-- Grant a specific user access to ALL lessons (existing + future)
-- =============================================================
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
--
-- USAGE: Replace 'USER_EMAIL_HERE' with the target user's email
--        before running each block.
--
-- Step 1: Look up the user's auth ID by email
-- Step 2: Insert lesson_purchases for all existing active lessons
-- Step 3: Create a trigger that auto-grants access on new lessons

-- ── CONFIG: Set the target email here ──────────────────────────
-- Change this value before running:
\set target_email 'USER_EMAIL_HERE'

-- ── Step 1: Find the user ID ────────────────────────────────────
-- Run this first to confirm the user exists:
SELECT id, email FROM auth.users WHERE email = :'target_email';

-- ── Step 2 & 3: Grant access ────────────────────────────────────
DO $$
DECLARE
  target_user_id uuid;
  target_email_param text := :'target_email';
BEGIN
  -- Look up the user
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = target_email_param;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', target_email_param;
  END IF;

  -- ── Grant access to all existing active lessons ──────────────
  INSERT INTO lesson_purchases (student_id, lesson_id, amount_paid, purchased_at, transaction_id)
  SELECT
    target_user_id,
    l.id,
    0,                              -- free grant
    now(),
    'ADMIN-GRANT-' || l.id         -- unique reference per lesson
  FROM lessons l
  WHERE l.status = 'active'
  ON CONFLICT (student_id, lesson_id) DO NOTHING;  -- skip if already purchased

  RAISE NOTICE 'Granted access to all existing lessons for user %', target_user_id;
END $$;

-- ── Step 3: Auto-grant access to future lessons ─────────────────
-- This trigger fires whenever a new lesson is inserted or set to 'active',
-- and automatically creates a purchase record for the target user.
--
-- NOTE: This trigger uses a hardcoded user ID. To set it up, first run
-- Step 1 above to get the user UUID, then replace TARGET_USER_UUID below.

CREATE OR REPLACE FUNCTION auto_grant_lesson_access()
RETURNS trigger AS $$
DECLARE
  target_user_id uuid := 'TARGET_USER_UUID';  -- Replace with actual UUID from Step 1
BEGIN
  -- Only fire when lesson becomes active
  IF NEW.status <> 'active' THEN
    RETURN NEW;
  END IF;

  IF target_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO lesson_purchases (student_id, lesson_id, amount_paid, purchased_at, transaction_id)
  VALUES (
    target_user_id,
    NEW.id,
    0,
    now(),
    'ADMIN-GRANT-' || NEW.id
  )
  ON CONFLICT (student_id, lesson_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any, then create
DROP TRIGGER IF EXISTS trg_auto_grant_lesson_access ON lessons;

CREATE TRIGGER trg_auto_grant_lesson_access
  AFTER INSERT OR UPDATE ON lessons
  FOR EACH ROW
  EXECUTE FUNCTION auto_grant_lesson_access();

-- ── Verify ──────────────────────────────────────────────────────
-- Run this to confirm it worked (replace email):
-- SELECT count(*) as lessons_granted
-- FROM lesson_purchases
-- WHERE student_id = (SELECT id FROM auth.users WHERE email = :'target_email');
