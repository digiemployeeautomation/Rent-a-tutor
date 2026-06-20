# Phase 4 — Progress & Mastery (Design Spec)

**Date:** 2026-06-20
**Phase:** 4 of the [Reading Module Completion Roadmap](../plans/2026-06-20-reading-module-completion-roadmap.md)
**Status:** Approved design; implementation plan to follow.

## 1. Overview

Give learners a sense of progress and where they stand:
- **Mastery** — per-question-type accuracy across graded Reading + Listening
  practice, surfaced on the dashboard (weakest-first, to guide study).
- **Lesson progress + resume** — persist that a lesson was opened and the last
  slide reached, so the lesson viewer paginates and resumes where the user left
  off.
- **Richer status** — the Reading hub shows lesson-viewed vs drill-done per
  module and overall progress; the dashboard shows path progress + "continue".

Built in order **A (mastery) → B (lesson progress + resume) → C (surfaces)**; A
ships value with zero schema risk.

## 2. Decisions (locked)

| Fork | Decision |
|---|---|
| Lesson-viewed recording | **Auto-log on lesson open**; **additive** — the exam unlock stays gated on drill-graded (no regression). |
| Resume / bookmark | **Included** — paginate lessons, persist last slide, resume on open. |
| Mastery scope | **Reading + Listening** (both use the deterministic per-question grader). |

## 3. Current state (what we build on)

- Completion is *derived* in `app/learn/reading/page.js` from `submissions`
  (`status='graded'`) for each module's `drill_item_id`. No lesson-view storage.
- `app/learn/reading/[slug]/page.js` renders `SlideViewer` with all blocks at
  once; opening a lesson records nothing.
- `grades.feedback.per_question` stores `{question_type, correct, marks,
  max_marks, …}` per question and is client-readable via RLS (users read their
  own grades) — so mastery needs **no new data**.
- RLS convention (migrations 003/005): `user_id UUID NOT NULL REFERENCES
  auth.users(id) ON DELETE CASCADE`; per-user policies `auth.uid() = user_id`
  for SELECT/INSERT/UPDATE `TO authenticated`. Latest migration is **008**.

## 4. Part A — Per-type mastery

### 4.1 Pure helper — `lib/ielts/mastery.js`
```
summarizeMastery(rows) -> [{ question_type, questions, marks, maxMarks, accuracy }]
masteryLabel(accuracy) -> 'Strong' | 'Developing' | 'Needs work'
```
- `rows`: flattened `per_question` entries `{ question_type, marks, max_marks }`.
- Aggregate per `question_type`: `questions` = count, `marks`/`maxMarks` = sums,
  `accuracy` = `maxMarks > 0 ? marks / maxMarks : 0`. Using marks/maxMarks (not
  the boolean) credits `mcq_multi` partial marks correctly.
- Output sorted by `accuracy` ascending (weakest first); drop types with
  `maxMarks === 0`.
- `masteryLabel`: `>= 0.8 → Strong`, `>= 0.5 → Developing`, else `Needs work`.
- Pure, no I/O; unit-tested.

### 4.2 Data flow (dashboard, server)
Load the user's graded submissions for `reading_set` + `listening_set` items and
their latest grade per submission; flatten `feedback.per_question` across all;
call `summarizeMastery`. Reuses existing reads (no new tables, no new RLS).

### 4.3 Surface
A "Mastery by question type" card on `/dashboard/student`: each in-scope type
with its `masteryLabel`, accuracy %, and `questions` count, weakest first. Type
display names come from `getQuestionType(type).label` (registry). Empty state
when the user has no graded Reading/Listening practice yet.

## 5. Part B — Lesson progress + resume

### 5.1 Migration 009 — `lesson_progress`
```sql
CREATE TABLE IF NOT EXISTS lesson_progress (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id        UUID NOT NULL REFERENCES skill_lessons(id) ON DELETE CASCADE,
  first_viewed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_viewed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_slide_index INT NOT NULL DEFAULT 0,
  slide_count      INT,
  completed_at     TIMESTAMPTZ,
  UNIQUE (user_id, lesson_id)
);
CREATE INDEX lesson_progress_user_idx ON lesson_progress(user_id);
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
-- own-row read/insert/update (auth.uid() = user_id), TO authenticated
```
The user owns their rows (written from the browser via the API below), so unlike
`grades` this table **does** get authenticated insert/update policies.

### 5.2 Write path — `POST /api/lesson-progress`
Body `{ lesson_id, last_slide_index, slide_count }`. Auth-gated. Validates the
lesson exists and is published. Upsert semantics (read-then-write to preserve
fields):
- No row → insert with `first_viewed_at = last_viewed_at = now()`,
  `last_slide_index`, `slide_count`, and `completed_at = now()` if
  `last_slide_index >= slide_count - 1`.
- Existing row → update `last_viewed_at = now()`,
  `last_slide_index = max(existing, incoming)`, `slide_count`; set
  `completed_at = now()` once the last slide is reached and it is not already set
  (never clear it). `first_viewed_at` preserved.
Returns the saved row. Mirrors the `/api/submissions` route's auth/ownership shape.

### 5.3 Resume + progress via `SlideViewer` + a thin client wrapper
`SlideViewer` is **already a client component with internal pagination**
(Prev/Next, progress dots, "N / total") — so we reuse it, not reinvent it.
Enhance it with two optional, backward-compatible props:
- `initialIndex = 0` — the starting slide (clamped to range), for resume.
- `onSlideChange(index, total)` — optional callback fired on mount and on each
  navigation.
Existing call sites (which pass neither prop) are unaffected.

New client wrapper `components/lesson/LessonProgress.js`, props
`{ lessonId, blocks, resumeIndex }`: renders
`<SlideViewer slidesData={blocks} initialIndex={resumeIndex} onSlideChange={save} />`,
where `save(index, total)` POSTs `{ lesson_id, last_slide_index: index,
slide_count: total }` to `/api/lesson-progress` (fire-and-forget; failures
non-blocking). The mount-time `onSlideChange` is the auto-log of "viewed". A
server component cannot pass a function to a client component, so this wrapper
owns the callback.

### 5.4 Lesson page — `app/learn/reading/[slug]/page.js`
Also select `skill_lessons.id`; load the user's `lesson_progress` row for this
lesson to get `last_slide_index`; render `<LessonProgress lessonId={lesson.id}
blocks={blocks} resumeIndex={…} />` in place of the direct `SlideViewer`. The
"Now try it →" drill CTA stays below, always visible.

## 6. Part C — Richer status surfaces

### 6.1 Pure helper — `lib/ielts/lesson-progress.js`
```
deriveModuleStatus(module, viewedLessonIds, completedDrillIds)
  -> { lessonViewed: boolean, drillDone: boolean }
countDrillsDone(modules, completedDrillIds) -> number
```
- `lessonViewed` = `viewedLessonIds.includes(module.id)`.
- `drillDone` = `module.drill_item_id && completedDrillIds.includes(module.drill_item_id)`.
- Pure, unit-tested.

### 6.2 Hub — `app/learn/reading/page.js`
Select `id` too; load `lesson_progress` for the user (viewed lesson ids). For
each module show lesson-viewed and drill-done states (e.g. "Lesson read ✓ ·
Drill done ✓", or "Lesson read · drill pending", or "Start"). Show "X of N
modules complete" (drills done). The locked-exam card shows progress
("3 of 5 drills done — complete all to unlock"). **Unlock logic unchanged**
(`isExamUnlocked` on drill-graded).

### 6.3 Dashboard — `app/dashboard/student/page.js`
Add a "Reading & Listening" progress block: reading modules complete / total
(drills graded), a "Continue learning →" link to the most recently viewed
*incomplete* lesson (from `lesson_progress`, `completed_at IS NULL`, ordered by
`last_viewed_at`), and the mastery card from Part A.

## 7. Error handling / edge cases

- Progress POST failure → silently ignored client-side (progress is best-effort,
  never blocks reading the lesson).
- `resumeIndex` out of range (lesson edited, fewer blocks) → clamp to
  `[0, blocks.length - 1]`.
- `slide_count` changes between sessions → stored value updated on next POST;
  `completed_at` is sticky once set.
- No graded practice yet → mastery card shows an empty state.
- Lesson with no blocks → LessonRunner renders nothing but still logs a view.

## 8. Testing

- `lib/ielts/__tests__/mastery.test.js`: aggregation across multiple types,
  partial-credit (`mcq_multi`) accuracy, sort order (weakest first), drop
  zero-max types, `masteryLabel` bucket boundaries (0.8, 0.5), empty input.
- `lib/ielts/__tests__/lesson-progress.test.js`: `deriveModuleStatus`
  (viewed/not, drill done/not, drill-less module), `countDrillsDone`.
- Existing suite stays green.
- API route, `LessonRunner`, and page edits: lint + manual checklist (migration
  applied to the DB by the user).

## 9. File list

| File | Change |
|---|---|
| `lib/ielts/mastery.js` | **new** pure helper |
| `lib/ielts/__tests__/mastery.test.js` | **new** tests |
| `lib/ielts/lesson-progress.js` | **new** pure helper |
| `lib/ielts/__tests__/lesson-progress.test.js` | **new** tests |
| `supabase/migrations/009_lesson_progress.sql` | **new** table + RLS |
| `app/api/lesson-progress/route.js` | **new** upsert endpoint |
| `components/lesson/SlideViewer.js` | **modify** — optional `initialIndex` + `onSlideChange` props |
| `components/lesson/LessonProgress.js` | **new** thin client wrapper (posts progress) |
| `app/learn/reading/[slug]/page.js` | load progress, render LessonProgress |
| `app/learn/reading/page.js` | load views, richer per-module + exam status |
| `app/dashboard/student/page.js` | mastery card + reading/listening progress + continue |

## 10. Out of scope

Changing the exam-unlock rule; Writing/Speaking mastery (band-based, not
per-question); cross-device conflict handling beyond last-write-wins on the
single `lesson_progress` row; analytics dashboards beyond the learner's own view.
