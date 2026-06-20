# Progress & Mastery — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-question-type mastery (Reading + Listening) on the dashboard, and persist lesson views + resume position, with richer status on the hub and dashboard.

**Architecture:** Two pure helpers (`mastery`, `lesson-progress`) are unit-tested. A new `lesson_progress` table (migration 009, own-row RLS) is written via `POST /api/lesson-progress`. The existing client `SlideViewer` (which already paginates) gains optional `initialIndex` + `onSlideChange`; a thin client `LessonProgress` wrapper posts progress. Hub + dashboard read these. Build order A (mastery) → B (lesson progress + resume) → C (surfaces).

**Tech Stack:** Next.js 14 App Router, React 18, Supabase (Postgres + RLS), Vitest. JS/ESM; `@/` alias in app code, relative imports in tests. Migration applied to the DB by the user (Supabase not MCP-connected).

**Spec:** `docs/superpowers/specs/2026-06-20-reading-progress-mastery-design.md`

**Commit convention:** end every commit message with
`Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>` (omitted below for brevity).

---

## Part A — Mastery

### Task 1: `summarizeMastery` + `masteryLabel`

**Files:**
- Create: `lib/ielts/mastery.js`
- Test: `lib/ielts/__tests__/mastery.test.js`

- [ ] **Step 1: Write the failing test** — create `lib/ielts/__tests__/mastery.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { summarizeMastery, masteryLabel } from '../mastery.js'

describe('summarizeMastery', () => {
  it('aggregates marks per type and sorts weakest first', () => {
    const rows = [
      { question_type: 'tfng', marks: 1, max_marks: 1 },
      { question_type: 'tfng', marks: 0, max_marks: 1 },
      { question_type: 'mcq_single', marks: 1, max_marks: 1 },
    ]
    const out = summarizeMastery(rows)
    expect(out).toEqual([
      { question_type: 'tfng', questions: 2, marks: 1, maxMarks: 2, accuracy: 0.5 },
      { question_type: 'mcq_single', questions: 1, marks: 1, maxMarks: 1, accuracy: 1 },
    ])
  })
  it('credits partial marks (mcq_multi)', () => {
    const out = summarizeMastery([{ question_type: 'mcq_multi', marks: 1, max_marks: 2 }])
    expect(out[0].accuracy).toBe(0.5)
  })
  it('drops types with zero max and ignores rows without a type', () => {
    const out = summarizeMastery([
      { question_type: 'x', marks: 0, max_marks: 0 },
      { marks: 1, max_marks: 1 },
    ])
    expect(out).toEqual([])
  })
  it('returns [] for empty input', () => {
    expect(summarizeMastery()).toEqual([])
  })
})

describe('masteryLabel', () => {
  it('buckets by accuracy', () => {
    expect(masteryLabel(1)).toBe('Strong')
    expect(masteryLabel(0.8)).toBe('Strong')
    expect(masteryLabel(0.79)).toBe('Developing')
    expect(masteryLabel(0.5)).toBe('Developing')
    expect(masteryLabel(0.49)).toBe('Needs work')
    expect(masteryLabel(0)).toBe('Needs work')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/ielts/__tests__/mastery.test.js`
Expected: FAIL — cannot resolve `../mastery.js`.

- [ ] **Step 3: Implement** — create `lib/ielts/mastery.js`:

```js
// lib/ielts/mastery.js
//
// Pure per-question-type mastery aggregation for deterministic-graded sections
// (Reading + Listening). Input rows are flattened grades.feedback.per_question
// entries; output is one summary per question type, weakest first. Uses
// marks/max_marks (not the boolean) so mcq_multi partial marks count.

// rows: [{ question_type, marks, max_marks }]
export function summarizeMastery(rows = []) {
  const byType = new Map()
  for (const r of rows) {
    const type = r?.question_type
    if (!type) continue
    const acc = byType.get(type) ?? { question_type: type, questions: 0, marks: 0, maxMarks: 0 }
    acc.questions += 1
    acc.marks += Number(r.marks) || 0
    acc.maxMarks += Number(r.max_marks) || 0
    byType.set(type, acc)
  }
  return [...byType.values()]
    .filter((t) => t.maxMarks > 0)
    .map((t) => ({ ...t, accuracy: t.marks / t.maxMarks }))
    .sort((a, b) => a.accuracy - b.accuracy)
}

export function masteryLabel(accuracy) {
  if (accuracy >= 0.8) return 'Strong'
  if (accuracy >= 0.5) return 'Developing'
  return 'Needs work'
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/ielts/__tests__/mastery.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/ielts/mastery.js lib/ielts/__tests__/mastery.test.js
git commit -m "feat(reading): summarizeMastery + masteryLabel helpers"
```

---

### Task 2: Mastery card on the dashboard

**Files:**
- Modify: `app/dashboard/student/page.js`

Adds a "Mastery by question type" card driven by `summarizeMastery` over the
user's graded Reading + Listening submissions. No new test (server component;
logic is in the tested helper). Verify with lint + the suite.

- [ ] **Step 1: Add imports**

After `import FeedLayout from '@/components/layout/FeedLayout'` add:

```js
import { summarizeMastery, masteryLabel } from '@/lib/ielts/mastery'
import { getQuestionType } from '@/lib/ielts/question-types'
```

- [ ] **Step 2: Compute mastery (server)**

Immediately BEFORE the `const greetingName =` line, insert:

```js
  // Mastery across graded Reading + Listening (per-question-type accuracy).
  const { data: gradedSubs } = await supabase
    .from('submissions')
    .select('id, practice_item_id')
    .eq('user_id', user.id)
    .eq('status', 'graded')

  let mastery = []
  const gradedItemIds = [...new Set((gradedSubs ?? []).map((s) => s.practice_item_id))]
  if (gradedItemIds.length) {
    const { data: detItems } = await supabase
      .from('practice_items')
      .select('id, type')
      .in('id', gradedItemIds)
    const detItemIdSet = new Set(
      (detItems ?? [])
        .filter((it) => it.type === 'reading_set' || it.type === 'listening_set')
        .map((it) => it.id),
    )
    const detSubIds = (gradedSubs ?? [])
      .filter((s) => detItemIdSet.has(s.practice_item_id))
      .map((s) => s.id)
    if (detSubIds.length) {
      const { data: masteryGrades } = await supabase
        .from('grades')
        .select('submission_id, feedback, created_at')
        .in('submission_id', detSubIds)
      const latestBySub = new Map()
      ;(masteryGrades ?? []).forEach((g) => {
        const ex = latestBySub.get(g.submission_id)
        if (!ex || new Date(g.created_at) > new Date(ex.created_at)) latestBySub.set(g.submission_id, g)
      })
      const perQuestion = [...latestBySub.values()].flatMap((g) =>
        Array.isArray(g.feedback?.per_question) ? g.feedback.per_question : [],
      )
      mastery = summarizeMastery(perQuestion)
    }
  }
```

- [ ] **Step 3: Render the card**

Immediately AFTER the closing `</section>` of "Recent submissions" (the
`</section>` just before the `<div className="mt-8 flex justify-center">`), insert:

```jsx
      {/* Mastery by question type (Reading + Listening) */}
      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Mastery by question type
        </h2>
        {mastery.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {mastery.map((m) => {
              const label = getQuestionType(m.question_type)?.label ?? m.question_type
              const pct = Math.round(m.accuracy * 100)
              const tag = masteryLabel(m.accuracy)
              const tagColor =
                tag === 'Strong' ? 'text-green-600'
                : tag === 'Developing' ? 'text-amber-600'
                : 'text-red-600'
              return (
                <li
                  key={m.question_type}
                  className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4"
                >
                  <div>
                    <div className="text-sm font-semibold text-gray-800">{label}</div>
                    <div className="text-xs text-gray-400">{m.questions} question{m.questions === 1 ? '' : 's'} attempted</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-800">{pct}%</div>
                    <div className={`text-[10px] font-semibold uppercase tracking-wide ${tagColor}`}>{tag}</div>
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="mt-3 rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-400">
            Complete some Reading or Listening practice to see your strengths by question type.
          </div>
        )}
      </section>
```

- [ ] **Step 4: Lint + tests**

Run: `npm run lint 2>&1 | tail -30` — no warnings referencing `app/dashboard/student/page.js`.
Run: `npm test` — still green.

- [ ] **Step 5: Commit**

```bash
git add "app/dashboard/student/page.js"
git commit -m "feat(reading): mastery-by-question-type card on the dashboard"
```

---

## Part B — Lesson progress + resume

### Task 3: Migration 009 — `lesson_progress`

**Files:**
- Create: `supabase/migrations/009_lesson_progress.sql`

- [ ] **Step 1: Create the migration with this exact content**

```sql
-- ============================================================
-- Migration 009: lesson_progress
--
-- Per-user lesson view + resume position for the teach-then-test path.
-- Unlike grades, the USER owns these rows (written from the browser via
-- /api/lesson-progress), so authenticated insert/update/select policies are
-- gated on auth.uid() = user_id (same pattern as submissions, migration 005).
-- ============================================================

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

CREATE INDEX IF NOT EXISTS lesson_progress_user_idx ON lesson_progress(user_id);

ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lesson_progress_read_own" ON lesson_progress;
CREATE POLICY "lesson_progress_read_own"
  ON lesson_progress FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "lesson_progress_insert_own" ON lesson_progress;
CREATE POLICY "lesson_progress_insert_own"
  ON lesson_progress FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "lesson_progress_update_own" ON lesson_progress;
CREATE POLICY "lesson_progress_update_own"
  ON lesson_progress FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

- [ ] **Step 2: Sanity check**

Run: `ls -l supabase/migrations/009_lesson_progress.sql`
Confirm it exists and follows the 008 style (CREATE TABLE IF NOT EXISTS, ENABLE RLS, three own-row policies). It is applied to the DB by the user.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/009_lesson_progress.sql
git commit -m "feat(reading): migration 009 — lesson_progress table + own-row RLS"
```

---

### Task 4: `SlideViewer` — optional `initialIndex` + `onSlideChange`

**Files:**
- Modify: `components/lesson/SlideViewer.js`

Backward-compatible: existing call sites pass neither prop and behave exactly as before.

- [ ] **Step 1: Update the import**

Change line 3 from:

```js
import { useState } from 'react'
```

to:

```js
import { useState, useEffect } from 'react'
```

- [ ] **Step 2: Add the props, resume index, and change callback**

Change:

```js
export default function SlideViewer({ slidesData }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!slidesData || slidesData.length === 0) {
```

to:

```js
export default function SlideViewer({ slidesData, initialIndex = 0, onSlideChange }) {
  const total = slidesData?.length ?? 0
  const [currentIndex, setCurrentIndex] = useState(() =>
    Math.min(Math.max(0, initialIndex), Math.max(0, total - 1)),
  )

  useEffect(() => {
    if (onSlideChange) onSlideChange(currentIndex, total)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex])

  if (!slidesData || slidesData.length === 0) {
```

- [ ] **Step 3: Remove the now-duplicate `total` declaration**

Change:

```js
  const slide = slidesData[currentIndex]
  const total = slidesData.length
```

to:

```js
  const slide = slidesData[currentIndex]
```

- [ ] **Step 4: Lint**

Run: `npm run lint 2>&1 | tail -30` — no warnings referencing `components/lesson/SlideViewer.js`.

- [ ] **Step 5: Commit**

```bash
git add components/lesson/SlideViewer.js
git commit -m "feat(reading): SlideViewer optional initialIndex + onSlideChange"
```

---

### Task 5: `POST /api/lesson-progress`

**Files:**
- Create: `app/api/lesson-progress/route.js`

- [ ] **Step 1: Create the route with this exact content**

```js
// app/api/lesson-progress/route.js
//
// Upserts the current user's lesson progress (view + resume slide). The user
// owns their own rows (RLS), so this uses the authenticated server client, not
// the service role. Read-then-write preserves first_viewed_at and keeps
// completed_at sticky once set.
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseServer'

export async function POST(request) {
  const supabase = createServerClient()

  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  let body
  try { body = await request.json() } catch { body = {} }
  const lessonId = body.lesson_id
  const slideCount = Number.isInteger(body.slide_count) ? body.slide_count : null
  const incomingIndex = Number.isInteger(body.last_slide_index) ? Math.max(0, body.last_slide_index) : 0
  if (!lessonId) {
    return NextResponse.json({ error: 'lesson_id required' }, { status: 400 })
  }

  // RLS already limits skill_lessons to published rows; confirm it exists.
  const { data: lesson } = await supabase
    .from('skill_lessons')
    .select('id')
    .eq('id', lessonId)
    .maybeSingle()
  if (!lesson) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
  }

  const { data: existing } = await supabase
    .from('lesson_progress')
    .select('id, last_slide_index, completed_at')
    .eq('user_id', user.id)
    .eq('lesson_id', lessonId)
    .maybeSingle()

  const reachedEnd = slideCount != null && incomingIndex >= slideCount - 1
  const nowIso = new Date().toISOString()

  if (!existing) {
    const { data, error } = await supabase
      .from('lesson_progress')
      .insert({
        user_id: user.id,
        lesson_id: lessonId,
        first_viewed_at: nowIso,
        last_viewed_at: nowIso,
        last_slide_index: incomingIndex,
        slide_count: slideCount,
        completed_at: reachedEnd ? nowIso : null,
      })
      .select('*')
      .single()
    if (error) {
      return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 })
    }
    return NextResponse.json({ progress: data })
  }

  const { data, error } = await supabase
    .from('lesson_progress')
    .update({
      last_viewed_at: nowIso,
      last_slide_index: Math.max(existing.last_slide_index ?? 0, incomingIndex),
      slide_count: slideCount,
      completed_at: existing.completed_at ?? (reachedEnd ? nowIso : null),
    })
    .eq('id', existing.id)
    .select('*')
    .single()
  if (error) {
    return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 })
  }
  return NextResponse.json({ progress: data })
}
```

- [ ] **Step 2: Confirm the client helper name**

Run: `grep -n "export function createServerClient" lib/supabaseServer.js`
Expected: a match (the same helper `app/api/submissions/[id]/grade/route.js` imports). If the export name differs, use that name instead.

- [ ] **Step 3: Lint**

Run: `npm run lint 2>&1 | tail -30` — no warnings referencing `app/api/lesson-progress/route.js`.

- [ ] **Step 4: Commit**

```bash
git add "app/api/lesson-progress/route.js"
git commit -m "feat(reading): POST /api/lesson-progress upsert endpoint"
```

---

### Task 6: `LessonProgress` wrapper + lesson page wiring

**Files:**
- Create: `components/lesson/LessonProgress.js`
- Modify: `app/learn/reading/[slug]/page.js`

- [ ] **Step 1: Create `components/lesson/LessonProgress.js`**

```js
'use client'
// components/lesson/LessonProgress.js
//
// Thin client wrapper that renders the (already self-paginating) SlideViewer and
// records the user's view + slide position to /api/lesson-progress. A server
// component cannot pass a function to a client component, so the progress
// callback lives here. Posting is best-effort (fire-and-forget).
import { useRef } from 'react'
import SlideViewer from '@/components/lesson/SlideViewer'

export default function LessonProgress({ lessonId, blocks = [], resumeIndex = 0 }) {
  const lastSent = useRef(null)

  function save(index, total) {
    if (lastSent.current === index) return
    lastSent.current = index
    fetch('/api/lesson-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lesson_id: lessonId, last_slide_index: index, slide_count: total }),
    }).catch(() => {})
  }

  return <SlideViewer slidesData={blocks} initialIndex={resumeIndex} onSlideChange={save} />
}
```

- [ ] **Step 2: Wire it into the lesson page**

In `app/learn/reading/[slug]/page.js`:

(a) Change the import line:

```js
import SlideViewer from '@/components/lesson/SlideViewer'
```

to:

```js
import LessonProgress from '@/components/lesson/LessonProgress'
```

(b) Add `id` to the lesson select — change:

```js
    .select('slug, title, summary, slides_data, drill_item_id, status')
```

to:

```js
    .select('id, slug, title, summary, slides_data, drill_item_id, status')
```

(c) After `const blocks = lesson.slides_data?.blocks ?? []`, add the resume lookup:

```js
  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('last_slide_index')
    .eq('user_id', user.id)
    .eq('lesson_id', lesson.id)
    .maybeSingle()
  const resumeIndex = progress?.last_slide_index ?? 0
```

(d) Replace the viewer element — change:

```jsx
      <div className="mt-8">
        <SlideViewer slidesData={blocks} />
      </div>
```

to:

```jsx
      <div className="mt-8">
        <LessonProgress lessonId={lesson.id} blocks={blocks} resumeIndex={resumeIndex} />
      </div>
```

- [ ] **Step 3: Lint**

Run: `npm run lint 2>&1 | tail -30` — no warnings referencing the two files.

- [ ] **Step 4: Commit**

```bash
git add components/lesson/LessonProgress.js "app/learn/reading/[slug]/page.js"
git commit -m "feat(reading): lesson view logging + resume via LessonProgress"
```

---

## Part C — Richer status surfaces

### Task 7: `deriveModuleStatus` + `countDrillsDone`

**Files:**
- Create: `lib/ielts/lesson-progress.js`
- Test: `lib/ielts/__tests__/lesson-progress.test.js`

> Note: this is the **pure UI-status helper** (`lib/ielts/lesson-progress.js`),
> distinct from the API route `app/api/lesson-progress/route.js` in Task 5.

- [ ] **Step 1: Write the failing test** — create `lib/ielts/__tests__/lesson-progress.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { deriveModuleStatus, countDrillsDone } from '../lesson-progress.js'

const MODS = [
  { id: 'L1', drill_item_id: 'D1' },
  { id: 'L2', drill_item_id: 'D2' },
  { id: 'L3', drill_item_id: null }, // lesson-only module
]

describe('deriveModuleStatus', () => {
  it('reports lesson viewed and drill done independently', () => {
    expect(deriveModuleStatus(MODS[0], ['L1'], ['D1'])).toEqual({ lessonViewed: true, drillDone: true })
    expect(deriveModuleStatus(MODS[1], ['L1'], ['D1'])).toEqual({ lessonViewed: false, drillDone: false })
  })
  it('a drill-less module is never drillDone', () => {
    expect(deriveModuleStatus(MODS[2], ['L3'], ['D1', 'D2'])).toEqual({ lessonViewed: true, drillDone: false })
  })
})

describe('countDrillsDone', () => {
  it('counts modules whose drill is completed', () => {
    expect(countDrillsDone(MODS, ['D1'])).toBe(1)
    expect(countDrillsDone(MODS, ['D1', 'D2'])).toBe(2)
    expect(countDrillsDone(MODS, [])).toBe(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/ielts/__tests__/lesson-progress.test.js`
Expected: FAIL — cannot resolve `../lesson-progress.js`.

- [ ] **Step 3: Implement** — create `lib/ielts/lesson-progress.js`:

```js
// lib/ielts/lesson-progress.js
//
// Pure helpers for deriving Reading-path module status from the user's lesson
// views and graded drills. No I/O.

// module: { id, drill_item_id }; viewedLessonIds/completedDrillIds: string[]
export function deriveModuleStatus(module, viewedLessonIds = [], completedDrillIds = []) {
  return {
    lessonViewed: viewedLessonIds.includes(module.id),
    drillDone: !!module.drill_item_id && completedDrillIds.includes(module.drill_item_id),
  }
}

export function countDrillsDone(modules = [], completedDrillIds = []) {
  return modules.filter(
    (m) => m.drill_item_id && completedDrillIds.includes(m.drill_item_id),
  ).length
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/ielts/__tests__/lesson-progress.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/ielts/lesson-progress.js lib/ielts/__tests__/lesson-progress.test.js
git commit -m "feat(reading): deriveModuleStatus + countDrillsDone helpers"
```

---

### Task 8: Hub richer status

**Files:**
- Modify: `app/learn/reading/page.js`

- [ ] **Step 1: Add imports**

Change:

```js
import { READING_EXAM_ITEM_ID, isExamUnlocked } from '@/lib/ielts/reading-modules'
```

to:

```js
import { READING_EXAM_ITEM_ID, isExamUnlocked } from '@/lib/ielts/reading-modules'
import { deriveModuleStatus, countDrillsDone } from '@/lib/ielts/lesson-progress'
```

- [ ] **Step 2: Select `id` and load viewed lessons**

Change the modules select:

```js
    .select('slug, title, summary, drill_item_id, position')
```

to:

```js
    .select('id, slug, title, summary, drill_item_id, position')
```

After the block that computes `completedDrillIds` (the `if (drillIds.length > 0) { … }`), add:

```js
  const { data: views } = await supabase
    .from('lesson_progress')
    .select('lesson_id')
    .eq('user_id', user.id)
  const viewedLessonIds = [...new Set((views ?? []).map((v) => v.lesson_id))]
  const drillsDone = countDrillsDone(mods, completedDrillIds)
```

- [ ] **Step 3: Show per-module status + counts**

Replace the module `<li>` body — change:

```jsx
          {mods.map((m, i) => {
            const done = m.drill_item_id && completedDrillIds.includes(m.drill_item_id)
            return (
              <li key={m.slug}>
                <Link
                  href={`/learn/reading/${m.slug}`}
                  className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
                >
                  <span>
                    <span className="text-xs uppercase tracking-wide text-gray-400">Module {i + 1}</span>
                    <span className="mt-1 block text-base font-semibold text-gray-800">{m.title}</span>
                    {m.summary ? <span className="mt-1 block text-sm text-gray-500">{m.summary}</span> : null}
                  </span>
                  <span className={`shrink-0 text-sm font-semibold ${done ? 'text-green-600' : 'text-gray-300'}`}>
                    {done ? '✓ Done' : 'Start'}
                  </span>
                </Link>
              </li>
            )
          })}
```

to:

```jsx
          {mods.map((m, i) => {
            const { lessonViewed, drillDone } = deriveModuleStatus(m, viewedLessonIds, completedDrillIds)
            const statusText = drillDone
              ? '✓ Done'
              : lessonViewed
              ? 'Lesson read'
              : 'Start'
            const statusColor = drillDone
              ? 'text-green-600'
              : lessonViewed
              ? 'text-blue-600'
              : 'text-gray-300'
            return (
              <li key={m.slug}>
                <Link
                  href={`/learn/reading/${m.slug}`}
                  className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
                >
                  <span>
                    <span className="text-xs uppercase tracking-wide text-gray-400">Module {i + 1}</span>
                    <span className="mt-1 block text-base font-semibold text-gray-800">{m.title}</span>
                    {m.summary ? <span className="mt-1 block text-sm text-gray-500">{m.summary}</span> : null}
                  </span>
                  <span className={`shrink-0 text-sm font-semibold ${statusColor}`}>{statusText}</span>
                </Link>
              </li>
            )
          })}
```

- [ ] **Step 4: Show progress on the exam card**

Change the locked-exam branch:

```jsx
          <div className="flex items-center justify-between rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 opacity-70">
            <span className="text-base font-semibold text-gray-500">Final exam — full reading set</span>
            <span className="shrink-0 text-sm text-gray-400">Complete all modules to unlock</span>
          </div>
```

to:

```jsx
          <div className="flex items-center justify-between rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 opacity-70">
            <span className="text-base font-semibold text-gray-500">Final exam — full reading set</span>
            <span className="shrink-0 text-sm text-gray-400">
              {drillsDone} of {mods.length} drills done — complete all to unlock
            </span>
          </div>
```

- [ ] **Step 5: Lint**

Run: `npm run lint 2>&1 | tail -30` — no warnings referencing `app/learn/reading/page.js`.

- [ ] **Step 6: Commit**

```bash
git add "app/learn/reading/page.js"
git commit -m "feat(reading): hub shows lesson-read/drill-done + exam progress"
```

---

### Task 9: Dashboard reading progress + continue

**Files:**
- Modify: `app/dashboard/student/page.js`

Adds a small "Reading path" block: modules complete and a "Continue learning"
link to the most recent incomplete lesson. Reuses queries from Task 2 where
possible.

- [ ] **Step 1: Add the import**

After the imports added in Task 2, add:

```js
import { countDrillsDone } from '@/lib/ielts/lesson-progress'
```

- [ ] **Step 2: Compute reading-path progress (server)**

Immediately AFTER the mastery computation block (added in Task 2, ending with
`mastery = summarizeMastery(perQuestion)`'s closing braces), insert:

```js
  // Reading path progress + "continue learning".
  const { data: readingMods } = await supabase
    .from('skill_lessons')
    .select('id, slug, drill_item_id')
    .eq('section', 'reading')
    .eq('status', 'published')
  const rMods = readingMods ?? []
  const rDrillIds = rMods.map((m) => m.drill_item_id).filter(Boolean)
  let rCompletedDrillIds = []
  if (rDrillIds.length) {
    const { data: rSubs } = await supabase
      .from('submissions')
      .select('practice_item_id')
      .eq('user_id', user.id)
      .in('practice_item_id', rDrillIds)
      .eq('status', 'graded')
    rCompletedDrillIds = [...new Set((rSubs ?? []).map((s) => s.practice_item_id))]
  }
  const readingDone = countDrillsDone(rMods, rCompletedDrillIds)

  const { data: continueRow } = await supabase
    .from('lesson_progress')
    .select('lesson_id, last_viewed_at')
    .eq('user_id', user.id)
    .is('completed_at', null)
    .order('last_viewed_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  const continueSlug = continueRow
    ? (rMods.find((m) => m.id === continueRow.lesson_id)?.slug ?? null)
    : null
```

- [ ] **Step 3: Render the progress block**

Immediately BEFORE the mastery `<section>` added in Task 2, insert:

```jsx
      {/* Reading path progress */}
      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Reading path</h2>
        <div className="mt-3 flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4">
          <div>
            <div className="text-sm font-semibold text-gray-800">
              {readingDone} of {rMods.length} modules complete
            </div>
            <div className="text-xs text-gray-400">Lessons with a graded drill</div>
          </div>
          {continueSlug ? (
            <Link href={`/learn/reading/${continueSlug}`} className="shrink-0 text-sm font-semibold text-blue-600 hover:underline">
              Continue learning →
            </Link>
          ) : (
            <Link href="/learn/reading" className="shrink-0 text-sm font-semibold text-blue-600 hover:underline">
              Go to Reading →
            </Link>
          )}
        </div>
      </section>
```

- [ ] **Step 4: Lint + tests**

Run: `npm run lint 2>&1 | tail -30` — no warnings referencing `app/dashboard/student/page.js`.
Run: `npm test` — green.

- [ ] **Step 5: Commit**

```bash
git add "app/dashboard/student/page.js"
git commit -m "feat(reading): dashboard reading-path progress + continue link"
```

---

### Task 10: Verification

**Files:** none.

- [ ] **Step 1: Full suite**

Run: `npm test`
Expected: PASS — 114 prior + new `mastery` (5) and `lesson-progress` (3) tests.

- [ ] **Step 2: Full lint**

Run: `npm run lint`
Expected: no new warnings in any of the changed files (pre-existing warnings in unrelated `components/lesson/Quiz*`, `lib/ai/*` are fine).

- [ ] **Step 3: Manual checklist (after the user applies migration 009)**

1. Apply `supabase/migrations/009_lesson_progress.sql`.
2. Open a reading lesson, advance a few slides, leave; reopen → it **resumes** at the last slide. (Confirms `/api/lesson-progress` + resume.)
3. `/learn/reading` shows "Lesson read" on a viewed-but-undrilled module, "✓ Done" once its drill is graded, and "N of M drills done" on the locked exam card; the exam still unlocks only when all drills are graded (unchanged rule).
4. `/dashboard/student` shows the "Reading path" block (modules complete + Continue) and the "Mastery by question type" card (weakest first; correct % and Strong/Developing/Needs-work labels) after some graded Reading/Listening practice.

- [ ] **Step 4: Final commit (only if verification required fixes)**

```bash
git add -A
git commit -m "fix(reading): progress/mastery corrections from verification"
```

---

## Self-Review

**Spec coverage:**
- Part A mastery helper (spec §4.1) → Task 1; dashboard surface (§4.2–4.3) → Task 2. ✔
- Migration 009 (spec §5.1) → Task 3. ✔
- API route (spec §5.2) → Task 5. ✔
- SlideViewer props + LessonProgress wrapper + lesson page (spec §5.3–5.4) → Tasks 4, 6. ✔
- Part C helper (spec §6.1) → Task 7; hub (§6.2) → Task 8; dashboard progress/continue (§6.3) → Task 9. ✔
- Testing (spec §8) → Tasks 1, 7 (unit) + Tasks 2/9/10 (lint + manual). ✔
- File list (spec §9) → all files across Tasks 1–9. ✔
- Edge cases (spec §7): resumeIndex clamp (Task 4 `Math.min/max`), sticky completed_at + max() index (Task 5), best-effort POST (Task 6 `.catch(()=>{})`), empty mastery state (Task 2), unlock unchanged (Task 8 keeps `isExamUnlocked`). ✔

**Placeholder scan:** none — every step has complete code.

**Consistency:** `summarizeMastery`/`masteryLabel` (Tasks 1→2), `deriveModuleStatus`/`countDrillsDone` (Tasks 7→8→9), `lesson_progress` columns identical across migration (T3), API (T5), lesson page (T6), hub (T8), dashboard (T9): `user_id`, `lesson_id`, `last_slide_index`, `slide_count`, `completed_at`, `last_viewed_at`. API request keys `lesson_id`/`last_slide_index`/`slide_count` match between `LessonProgress` (T6) and the route (T5). `SlideViewer` props `initialIndex`/`onSlideChange` match between T4 and T6. Two files named `lesson-progress` are distinct (pure helper `lib/ielts/lesson-progress.js` vs route `app/api/lesson-progress/route.js`) and called out in Task 7.
