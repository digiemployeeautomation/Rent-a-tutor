# IELTS Pivot — Demo-State Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pivot Rent-a-Tutor to an IELTS-only product surface and ship a thin end-to-end vertical slice: archive the schools content, re-skin the app as IELTS, ship an onboarding questionnaire, and deliver one fully-automated Writing-Task-2 submission → AI-graded result path.

**Architecture:** Approach B from the design spec — keep the existing lesson-block + track-rules engine, add a Practice Item axis (items / submissions / grades) for the "do it" surface. Demo focuses on the smallest slice that proves the architecture: questionnaire onboarding, one Writing prompt, one LLM-graded result page.

**Tech Stack:** Next.js 14 App Router, Supabase (Postgres + Auth + Storage), Vercel AI Gateway (Claude Sonnet 4.6) for grading, Tailwind, Vitest for pure-function tests.

**Spec reference:** `docs/superpowers/specs/2026-05-20-ielts-pivot-design.md`

---

## Phases

- **Phase 0** — Archive schools content, scrub UI of schools vocabulary.
- **Phase 1** — Database migration: new IELTS tables + topic/track value rename.
- **Phase 2** — IELTS-branded homepage and onboarding questionnaire.
- **Phase 3** — AI grading endpoint (Vercel AI Gateway + rubric prompt) with a stub fallback for local dev.
- **Phase 4** — Writing Task 2 practice flow: pick prompt → submit → grade → results page.
- **Phase 5** — Dashboard skeleton: user's questionnaire answers + a single "Try a Writing Task" CTA.

Stopping point for demo: end of Phase 5. Listening (TTS), Speaking (Whisper + Workflow), Reading question types, mock-test assembly, calibration set, content review queue, recommendation engine — all V2-of-this-pivot.

---

## Phase 0 — Archive schools content

### Task 0.1: Move schools content to `archive/schools-v1/`

**Files:**
- Move: `content/` → `archive/schools-v1/content/`
- Move: `curriculum-materials/` → `archive/schools-v1/curriculum-materials/`
- Move: `supabase/seed/seed_form1_math_fractions.sql` → `archive/schools-v1/supabase/seed/`
- Move: `supabase/seed/seed_curriculum.sql` → `archive/schools-v1/supabase/seed/`
- Move: `docs/superpowers/specs/2026-05-09-form-1-math-personalization-design.md` → `archive/schools-v1/docs/specs/`
- Move: `docs/content-template.md` → `archive/schools-v1/docs/`

- [ ] **Step 1:** Create archive directory and move files with `git mv` so history is preserved.

```bash
mkdir -p archive/schools-v1/content archive/schools-v1/supabase/seed archive/schools-v1/docs/specs archive/schools-v1/docs
git mv content archive/schools-v1/content-data
git mv curriculum-materials archive/schools-v1/curriculum-materials
git mv supabase/seed/seed_form1_math_fractions.sql archive/schools-v1/supabase/seed/
git mv supabase/seed/seed_curriculum.sql archive/schools-v1/supabase/seed/
git mv docs/superpowers/specs/2026-05-09-form-1-math-personalization-design.md archive/schools-v1/docs/specs/
git mv docs/content-template.md archive/schools-v1/docs/
```

- [ ] **Step 2:** Verify nothing imports the moved paths.

```bash
grep -r "content/biology" app/ lib/ components/ 2>&1
grep -r "seed_form1_math_fractions" app/ lib/ components/ supabase/ 2>&1
grep -r "seed_curriculum" app/ lib/ components/ supabase/ 2>&1
```
Expected: no results.

- [ ] **Step 3:** Commit.

```bash
git commit -m "chore: archive schools content under archive/schools-v1/"
```

### Task 0.2: Archive schools-specific routes and components

**Files:**
- Move: `app/learn/[formId]/` → `archive/schools-v1/app/learn/[formId]/`
- Inspect and possibly move: `components/onboarding/PersonalityQuiz.js`, `TierRecommendation.js`
- Inspect and possibly move: `lib/personality.js`

- [ ] **Step 1:** Find every route that mentions schools concepts.

```bash
grep -rln "Form 1\|Mathematics\|Biology\|Physics\|Chemistry\|Geography\|ECZ\|O-Level" app/ components/
```

- [ ] **Step 2:** Move schools-only routes/components to archive. Keep `app/learn/page.js` (will be rewritten in Phase 4 as the Practice Items landing).

```bash
git mv app/learn/[formId] archive/schools-v1/app/learn-[formId]
git mv components/onboarding/PersonalityQuiz.js archive/schools-v1/components/
git mv components/onboarding/TierRecommendation.js archive/schools-v1/components/
git mv lib/personality.js archive/schools-v1/lib/
```

- [ ] **Step 3:** Re-run grep — verify archived files are not imported by live code.

```bash
grep -rln "PersonalityQuiz\|TierRecommendation\|@/lib/personality" app/ components/ lib/
```
Expected: no results in live code.

- [ ] **Step 4:** Commit.

```bash
git commit -m "chore: archive schools-specific routes and components"
```

### Task 0.3: Update business plan and memory pointers

**Files:**
- Modify: `docs/business-plan.md`
- Modify: `README.md` (if it mentions schools)
- Create: `memory/project_ielts_v1_scope.md` (under `C:\Users\sbula\.claude\projects\C--Users-sbula-OneDrive-Desktop-Claude-Rentatutor\memory\`)
- Modify: `memory/MEMORY.md` (add IELTS pointer)

- [ ] **Step 1:** Edit `docs/business-plan.md` — replace V1 PoC scope with the IELTS pivot summary; mark schools paused. Keep the broader subscription model as TBD.

- [ ] **Step 2:** Edit `README.md` so the top-line description says "IELTS preparation platform" instead of "ECZ subjects."

- [ ] **Step 3:** Write `project_ielts_v1_scope.md` in auto-memory with current pivot decisions, with `[[project_platform_pivot]]` and `[[project_v1_poc_scope]]` links so context is preserved.

- [ ] **Step 4:** Add a line to `memory/MEMORY.md` pointing to the new file.

- [ ] **Step 5:** Commit.

```bash
git add docs/business-plan.md README.md
git commit -m "docs: pivot business plan and README to IELTS-only"
```

---

## Phase 1 — Database migration

### Task 1.1: Write migration 003 — Practice Item axis tables

**Files:**
- Create: `supabase/migrations/003_ielts_practice_items.sql`

- [ ] **Step 1:** Write the migration matching the schema in §3 of the spec.

Migration content (copy verbatim, all CREATE TABLE IF NOT EXISTS for idempotency):

```sql
-- ============================================================
-- Migration 003: IELTS Practice Items axis
-- Adds the "do it" surface for IELTS prep: practice items
-- (reading sets, listening sets, writing tasks, speaking tasks),
-- their questions (for L/R), submissions, grades, mock tests,
-- user track assignment, and the calibration set.
-- ============================================================

CREATE TABLE IF NOT EXISTS practice_items (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type                TEXT NOT NULL CHECK (type IN (
                        'reading_set','listening_set','writing_task','speaking_task'
                      )),
  topic_id            UUID REFERENCES topics(id) ON DELETE SET NULL,
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
CREATE INDEX IF NOT EXISTS practice_items_status_idx ON practice_items(status);
CREATE INDEX IF NOT EXISTS practice_items_type_status_idx ON practice_items(type, status);

CREATE TABLE IF NOT EXISTS practice_questions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_item_id    UUID NOT NULL REFERENCES practice_items(id) ON DELETE CASCADE,
  position            INT  NOT NULL,
  question_type       TEXT NOT NULL,
  prompt              TEXT NOT NULL,
  answer_key          JSONB NOT NULL,
  accept_synonyms     BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS practice_questions_item_idx ON practice_questions(practice_item_id, position);

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
CREATE INDEX IF NOT EXISTS submissions_user_idx ON submissions(user_id, started_at DESC);

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
CREATE INDEX IF NOT EXISTS grades_submission_idx ON grades(submission_id, created_at DESC);

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
  topic_id            UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  track               TEXT NOT NULL CHECK (track IN ('foundation','practice','mock')),
  inferred_from       TEXT NOT NULL CHECK (inferred_from IN ('diagnostic','self_declared','auto_bump','default')),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, topic_id)
);

CREATE TABLE IF NOT EXISTS calibration_set (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type                   TEXT NOT NULL CHECK (item_type IN ('writing_task','speaking_task')),
  payload                     JSONB NOT NULL,
  examiner_band_overall       NUMERIC(3,1) NOT NULL,
  examiner_band_per_criterion JSONB NOT NULL,
  notes                       TEXT
);

-- RLS: a user reads their own submissions and grades; everyone reads
-- published practice items; nobody writes directly (server-side service
-- role only).
ALTER TABLE practice_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades             ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_tests         ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tracks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE calibration_set    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "practice_items_read_published"
  ON practice_items FOR SELECT TO authenticated
  USING (status = 'published');

CREATE POLICY "practice_questions_read_via_item"
  ON practice_questions FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM practice_items pi
    WHERE pi.id = practice_questions.practice_item_id
      AND pi.status = 'published'
  ));

CREATE POLICY "submissions_read_own"
  ON submissions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "grades_read_via_own_submission"
  ON grades FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM submissions s
    WHERE s.id = grades.submission_id
      AND s.user_id = auth.uid()
  ));

CREATE POLICY "mock_tests_read_all"
  ON mock_tests FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "mock_test_attempts_read_own"
  ON mock_test_attempts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "user_tracks_read_own"
  ON user_tracks FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
```

- [ ] **Step 2:** Apply the migration via Supabase MCP `apply_migration`.

- [ ] **Step 3:** Verify with `list_tables` that all 8 new tables exist.

- [ ] **Step 4:** Commit.

```bash
git add supabase/migrations/003_ielts_practice_items.sql
git commit -m "feat(db): add IELTS practice item axis (items, submissions, grades, mock tests, user_tracks)"
```

### Task 1.2: Write migration 004 — IELTS topics + tracks rename

**Files:**
- Create: `supabase/migrations/004_ielts_topics_tracks.sql`

- [ ] **Step 1:** Write migration that:
  - Inserts IELTS sub-skill topics (idempotent UPSERT by name).
  - Inserts/updates `tracks` rows for `foundation`/`practice`/`mock`.
  - Does **not** delete legacy math/biology topics (they remain in the DB; they're just unreferenced — keeps the data side aligned with the "schools archive, not delete" stance).

```sql
-- ============================================================
-- Migration 004: IELTS topics + tracks
-- ============================================================

-- Track value rename for IELTS. The existing rows for math tracks remain
-- but are unreferenced by IELTS user_tracks rows.
INSERT INTO tracks (slug, name) VALUES
  ('foundation', 'Foundation'),
  ('practice',   'Practice'),
  ('mock',       'Mock')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

-- IELTS sub-skill topics
INSERT INTO topics (slug, name, ordering) VALUES
  ('listening',                'Listening',                  10),
  ('reading',                  'Reading',                    20),
  ('writing-task-1-academic',  'Writing Task 1 (Academic)',  30),
  ('writing-task-1-general',   'Writing Task 1 (General)',   31),
  ('writing-task-2',           'Writing Task 2',             40),
  ('speaking-part-1',          'Speaking Part 1',            50),
  ('speaking-part-2',          'Speaking Part 2',            51),
  ('speaking-part-3',          'Speaking Part 3',            52)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, ordering = EXCLUDED.ordering;
```

> Note: actual column names depend on the existing `tracks` and `topics` table schemas — check with `list_tables` before applying. If columns differ, adjust the migration accordingly.

- [ ] **Step 2:** Inspect existing `topics` and `tracks` schemas before applying.

- [ ] **Step 3:** Apply migration.

- [ ] **Step 4:** Commit.

```bash
git add supabase/migrations/004_ielts_topics_tracks.sql
git commit -m "feat(db): seed IELTS topics and rename tracks to foundation/practice/mock"
```

### Task 1.3: User profile extension for IELTS onboarding answers

**Files:**
- Create: `supabase/migrations/005_user_ielts_profile.sql`

- [ ] **Step 1:** Add a small `user_ielts_profile` table to hold questionnaire answers (variant, target band, test date, weakest section, hours/week, first language). Separate from any existing `profiles`/`users` so we don't break those.

```sql
CREATE TABLE IF NOT EXISTS user_ielts_profile (
  user_id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  variant          TEXT CHECK (variant IN ('academic','general')),
  target_band      NUMERIC(2,1),
  per_section_target JSONB,
  test_date        DATE,
  current_band_self NUMERIC(2,1),
  weakest_section  TEXT,
  hours_per_week   INT,
  first_language   TEXT,
  completed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE user_ielts_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_ielts_profile_read_own"
  ON user_ielts_profile FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "user_ielts_profile_write_own"
  ON user_ielts_profile FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

- [ ] **Step 2:** Apply migration.

- [ ] **Step 3:** Commit.

```bash
git add supabase/migrations/005_user_ielts_profile.sql
git commit -m "feat(db): add user_ielts_profile for onboarding answers"
```

---

## Phase 2 — IELTS-branded homepage and onboarding questionnaire

### Task 2.1: Rewrite homepage as IELTS-only

**Files:**
- Modify: `app/page.js`

- [ ] **Step 1:** Replace homepage hero/copy. Headline focuses on IELTS prep. Remove `SUBJECTS` grid entirely. Remove pricing plan tiers if they exist (or keep as TBD placeholders with no prices). CTAs: "Start free" and "How it works."

- [ ] **Step 2:** Remove all schools references (Mathematics, Biology, ECZ, "subjects you are studying", etc.). Replace `HOW_IT_WORKS` items with IELTS-relevant steps:
  1. Sign up
  2. Tell us your target band
  3. Take a short placement check
  4. Practice with AI-graded Writing & Speaking
  5. Track your band over time

- [ ] **Step 3:** Manual smoke test: `npm run dev`, visit `/`, verify no schools references.

- [ ] **Step 4:** Commit.

```bash
git commit -m "feat(ui): rewrite homepage as IELTS prep landing"
```

### Task 2.2: Build the onboarding questionnaire UI

**Files:**
- Modify: `app/onboarding/page.js`
- Create: `components/onboarding/IELTSQuestionnaire.js`
- Create: `lib/ielts/onboarding.js` (pure utilities + types)

- [ ] **Step 1:** Define pure helpers in `lib/ielts/onboarding.js`:

```js
// lib/ielts/onboarding.js
export const VARIANTS = ['academic', 'general']
export const SECTIONS = ['listening', 'reading', 'writing', 'speaking']

export function isValidProfile(answers) {
  if (!VARIANTS.includes(answers.variant)) return false
  if (typeof answers.target_band !== 'number') return false
  if (answers.target_band < 4 || answers.target_band > 9) return false
  if (typeof answers.hours_per_week !== 'number' || answers.hours_per_week < 1) return false
  return true
}

export function inferTrackFromBand(band) {
  if (band == null) return 'practice'
  if (band <= 5.5) return 'foundation'
  if (band >= 7.0) return 'mock'
  return 'practice'
}
```

- [ ] **Step 2:** Write a unit test for `isValidProfile` and `inferTrackFromBand`.

```js
// lib/ielts/__tests__/onboarding.test.js
import { describe, it, expect } from 'vitest'
import { isValidProfile, inferTrackFromBand } from '../onboarding.js'

describe('isValidProfile', () => {
  it('accepts a complete academic profile', () => {
    expect(isValidProfile({ variant: 'academic', target_band: 7.0, hours_per_week: 5 })).toBe(true)
  })
  it('rejects missing variant', () => {
    expect(isValidProfile({ target_band: 7.0, hours_per_week: 5 })).toBe(false)
  })
  it('rejects out-of-range band', () => {
    expect(isValidProfile({ variant: 'academic', target_band: 3.0, hours_per_week: 5 })).toBe(false)
  })
})

describe('inferTrackFromBand', () => {
  it('foundation for ≤5.5', () => {
    expect(inferTrackFromBand(5.0)).toBe('foundation')
    expect(inferTrackFromBand(5.5)).toBe('foundation')
  })
  it('practice for 6.0–6.5', () => {
    expect(inferTrackFromBand(6.0)).toBe('practice')
    expect(inferTrackFromBand(6.5)).toBe('practice')
  })
  it('mock for ≥7.0', () => {
    expect(inferTrackFromBand(7.0)).toBe('mock')
    expect(inferTrackFromBand(8.5)).toBe('mock')
  })
})
```

- [ ] **Step 3:** Run `npm test` to confirm green.

- [ ] **Step 4:** Build `IELTSQuestionnaire.js` as a stepped form (7 fields, one per step or grouped — designer's call), submitting to `/api/onboarding/ielts`. Persists via the same Supabase client pattern as elsewhere in the codebase.

- [ ] **Step 5:** Rewrite `app/onboarding/page.js` to render the questionnaire. Auth guard: redirect to `/auth/signin` if no session.

- [ ] **Step 6:** Build the persistence endpoint `app/api/onboarding/ielts/route.js`. POST validates with `isValidProfile`, upserts into `user_ielts_profile`, seeds `user_tracks` rows for the four sections using `inferTrackFromBand(current_band_self)` (or default `practice` if not declared), returns `{ ok: true, redirect: '/dashboard' }`.

- [ ] **Step 7:** Manual smoke test end-to-end: signup → onboarding → submit → row in `user_ielts_profile` → land on dashboard placeholder.

- [ ] **Step 8:** Commit.

```bash
git commit -m "feat(onboarding): IELTS questionnaire with profile persistence and initial track seeding"
```

---

## Phase 3 — Writing grading endpoint

### Task 3.1: Vercel AI Gateway env var scaffolding

**Files:**
- Modify: `.env.example`
- Create: `lib/ai/gateway.js`

- [ ] **Step 1:** Add to `.env.example`:

```
# Vercel AI Gateway
AI_GATEWAY_API_KEY=
AI_GATEWAY_BASE_URL=https://gateway.ai.vercel.app/v1
# Set USE_STUB_GRADER=true to bypass the gateway and return a deterministic stub grade
USE_STUB_GRADER=true
```

- [ ] **Step 2:** Build `lib/ai/gateway.js` as a thin client. Uses `fetch` (no SDK), reads env at module load, exposes `gradeWriting(taskPrompt, response_text, opts)` that returns the structured grade JSON.

- [ ] **Step 3:** Commit.

### Task 3.2: Writing rubric prompt template

**Files:**
- Create: `lib/content/prompts/writing-grader-v1.md`
- Modify: `lib/ai/gateway.js` to load the prompt at module load and use it for `gradeWriting`

- [ ] **Step 1:** Author the prompt: 4 IELTS Writing criteria, 0–9 band, 0.5 increments, structured JSON output schema specifying overall band, per-criterion bands with feedback, inline corrections (offset + length + suggestion), and a `model_rewrite` field.

- [ ] **Step 2:** Wire the prompt into `gateway.js`. Stamp `writing-grader-v1` as `model_version` on grades produced.

- [ ] **Step 3:** Commit.

### Task 3.3: Stub grader for local dev and CI

**Files:**
- Create: `lib/ai/stub-grader.js`

- [ ] **Step 1:** Implement `stubGradeWriting(taskPrompt, response_text)` returning a plausible-shaped grade derived from `response_text.length` (longer = higher band, capped at 7.5, floored at 4.0) — purely deterministic, zero cost. Used when `USE_STUB_GRADER=true`.

- [ ] **Step 2:** Unit test the stub grader's monotonicity (longer text → equal-or-higher band).

- [ ] **Step 3:** Commit.

### Task 3.4: Grading API route

**Files:**
- Create: `app/api/submissions/[id]/grade/route.js`

- [ ] **Step 1:** POST endpoint:
  - Loads the submission via service-role Supabase client.
  - Resolves the `practice_item` and confirms `type='writing_task'`.
  - Picks `stubGradeWriting` if `USE_STUB_GRADER==='true'` else `gradeWriting` from gateway.
  - Inserts a `grades` row.
  - Updates `submissions.status='graded'`.
  - Returns the grade JSON.
- [ ] **Step 2:** Error path: on grading error, inserts `grades` with feedback explaining the error and `graded_by='auto-llm'`, sets `submissions.status='error'`.
- [ ] **Step 3:** Manual test via `curl` against a fixture submission.
- [ ] **Step 4:** Commit.

---

## Phase 4 — Writing Task 2 practice flow end-to-end

### Task 4.1: Seed one published Writing Task 2 practice item

**Files:**
- Create: `supabase/seed/seed_ielts_writing_demo.sql`

- [ ] **Step 1:** Insert one `practice_items` row of type `writing_task`, variant `both`, status `published`, with a clear Task 2 essay prompt as the payload (e.g. agree/disagree opinion question on a familiar topic).
- [ ] **Step 2:** Apply seed.
- [ ] **Step 3:** Commit.

### Task 4.2: Practice item viewing/submission page

**Files:**
- Create: `app/practice/writing/[itemId]/page.js`
- Create: `app/practice/writing/[itemId]/SubmissionForm.js` (client component)
- Create: `app/api/submissions/route.js` (POST creates submission)

- [ ] **Step 1:** Server component `page.js` loads the practice item from Supabase, renders the prompt + a `SubmissionForm`.
- [ ] **Step 2:** `SubmissionForm.js` is a textarea + word-count + Submit button. Submit POSTs to `/api/submissions` with `{practice_item_id, response_text}`, receives `{submission_id}`, then POSTs to `/api/submissions/:id/grade`, then navigates to the results page.
- [ ] **Step 3:** Results page `app/practice/writing/[itemId]/result/[submissionId]/page.js` shows overall band, per-criterion bands, feedback, model rewrite.
- [ ] **Step 4:** Manual smoke test full flow with the stub grader enabled.
- [ ] **Step 5:** Commit.

---

## Phase 5 — Dashboard skeleton

### Task 5.1: Re-skin dashboard to IELTS context

**Files:**
- Modify: `app/dashboard/student/page.js` (or whatever the existing dashboard entry is)

- [ ] **Step 1:** Replace any subject grid / form picker with an IELTS-themed summary card showing the user's profile answers (target band, test date, hours/week).
- [ ] **Step 2:** Add a single CTA card linking to the seeded Writing Task 2 practice item (hardcoded for demo).
- [ ] **Step 3:** Add a placeholder "Recent submissions" section that lists the user's most recent submissions with grade summaries (links to results pages).
- [ ] **Step 4:** Manual smoke test: signup → onboarding → dashboard → Writing CTA → submit → see grade → return to dashboard → see the submission listed.
- [ ] **Step 5:** Commit.

### Task 5.2: Top nav and route cleanup

**Files:**
- Modify: `components/layout/*` (navbar files)
- Possibly delete: any link to legacy `/learn/[formId]` or subject pages

- [ ] **Step 1:** Remove nav links to schools-era routes.
- [ ] **Step 2:** Verify no broken links by clicking through every page in the live app.
- [ ] **Step 3:** Commit.

---

## Demo state checklist

After Phase 5, the demo should support:

- [ ] New user can sign up.
- [ ] New user goes through the IELTS questionnaire and lands on a dashboard.
- [ ] Dashboard shows their profile and offers a Writing Task 2 CTA.
- [ ] User submits a Writing Task 2 response.
- [ ] Submission is graded (stub grader OR live AI Gateway, depending on env).
- [ ] User sees a graded result page with overall band + per-criterion feedback.
- [ ] No schools references appear anywhere in the live UI.

---

## Self-review

- **Spec coverage** — covers: archive (§2 of spec), data model (§3), onboarding questionnaire (§4 step 1), grading pipeline for Writing (§5), one Practice Item flow (§3 + §5). Not covered, deliberately deferred: Listening/Speaking grading, mock tests, content production loop, recommendation engine, calibration set wiring, cost guardrails enforcement, audio production. These map to spec §5 (Speaking pipeline), §6, §7 — they remain in the spec and are tracked as future work after the demo.
- **Placeholder scan** — every code-bearing step shows complete code. The `tracks`/`topics` schema specifics in Task 1.2 depend on inspection of the live DB; the migration body is provided and the inspection step is explicit.
- **Type consistency** — `practice_items.id`, `submissions.practice_item_id`, `grades.submission_id` consistent. `tracks` slugs (`foundation`/`practice`/`mock`) consistent across migration, helper, and onboarding endpoint. `user_ielts_profile` referenced consistently in §3 and Task 2.2.
