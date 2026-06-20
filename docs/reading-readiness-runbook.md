# Reading Module — Apply Runbook (get the DB review-ready)

The app's Supabase project is applied **manually** (not MCP-connected). Run the
steps below in the **Supabase SQL editor** (project ref `sasfhopjvpoklsaptbej`)
to make the Reading module fully testable. Safe to re-run — every file is
idempotent (`DELETE … WHERE id/slug` then re-insert; migrations use
`IF NOT EXISTS`).

## 0. Prerequisites
- Supabase SQL-editor access to the project.
- A **test student account** that has completed onboarding (the dashboard
  redirects to `/onboarding` until a `user_ielts_profile` row exists).

## 1. Migrations (in order; skip any already applied)
Apply `supabase/migrations/` through **008**. `008` is the critical one for
Reading (creates `skill_lessons` + the server-only `explanation` column); if
`/learn/reading` already works, 001–008 are live.
```
001_platform_redesign.sql
002_lesson_blocks.sql
003_ielts_practice_items.sql
004_user_ielts_profile.sql
005_ielts_rls_writes.sql
006_answer_key_privacy.sql
007_practice_question_options.sql
008_skill_lessons_and_explanations.sql
```
> `009_lesson_progress.sql` is **Phase 4 (not built yet)** — do **not** apply.

## 2. Reading seeds (any order — each file is self-contained)
All in `supabase/seed/`. The five **module** files each create a lesson + its
drill; the demo is the **capstone exam**; the four **golden drills** are
standalone extra practice (reachable by URL, not in the path).

**Path modules (drive `/learn/reading`, positions 1–5):**
```
seed_ielts_reading_tfng_lesson.sql                 (pos 1)
seed_ielts_reading_ynng_lesson.sql                 (pos 2)
seed_ielts_reading_sentence_completion_lesson.sql  (pos 3)
seed_ielts_reading_mcq_single_lesson.sql           (pos 4)
seed_ielts_reading_matching_headings_lesson.sql    (pos 5)
```
**Capstone exam (timed + banded):**
```
seed_ielts_reading_demo.sql      → item 11111111-1111-4111-8111-111111111111
```
**Golden drills (one per remaining type family; reach at `/practice/reading/<id>`):**
```
seed_ielts_reading_mcq_multi_drill.sql              → 88888888-8888-4888-8888-888888888888
seed_ielts_reading_matching_family_drill.sql        → 99999999-9999-4999-8999-999999999999
seed_ielts_reading_completion_text_drill.sql        → aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa
seed_ielts_reading_completion_structured_drill.sql  → bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb
```

## 3. Smoke check (SQL editor)
```sql
-- 5 published reading modules, positions 1..5
select position, slug, drill_item_id from skill_lessons
where section='reading' and status='published' order by position;

-- 10 published reading_set items (5 drills + exam + 4 golden)
select count(*) from practice_items where type='reading_set' and status='published';

-- exam is a timed mock
select payload->>'is_mock', payload->>'time_limit_seconds'
from practice_items where id='11111111-1111-4111-8111-111111111111';
```
Expected: 5 module rows (pos 1–5); ≥10 published reading_set items; `is_mock=true`,
`time_limit_seconds=540`.

## 4. Then run the CAO test script
See `docs/reading-cao-test-script.md`.

## Verified before handoff (2026-06-20)
- `npm test` — 114/114 green (grading, banding, timer, mastery/status helpers).
- `npm run build` — clean; all reading routes compile.
- Seed audit — 0 blockers; all types/shapes valid; two over-permissive accepted
  answers tightened to verbatim passage words.
- **Not** verified end-to-end in a running app against this DB (no seeded test
  env here) — that is what the CAO test script confirms.
