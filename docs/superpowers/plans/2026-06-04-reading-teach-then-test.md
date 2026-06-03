# Reading Teach-then-Test Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Reading module teach before it tests — an interleaved Lesson→Test path per question type, gating a capstone exam, shipping one fully-worked True/False/Not Given module as the format template.

**Architecture:** A new `skill_lessons` table holds strategy lessons rendered by the reused `SlideViewer`. Each lesson links to a single-question-type drill (`practice_item`) graded by the existing deterministic grader, now surfacing a new server-only `practice_questions.explanation` column on the results page. A pure `reading-modules` helper module drives a `/learn/reading` hub that sequences modules and gates the exam using existing submissions.

**Tech Stack:** Next.js App Router (JS, no semicolons, 2-space indent), Supabase (Postgres + RLS), Vitest. Spec: `docs/superpowers/specs/2026-06-04-reading-teach-then-test-design.md`.

---

## File Structure

**Create:**
- `supabase/migrations/008_skill_lessons_and_explanations.sql` — `skill_lessons` table + `practice_questions.explanation` column
- `lib/ielts/reading-modules.js` — pure helpers + exam-item constant
- `lib/ielts/__tests__/reading-modules.test.js` — helper tests
- `app/learn/reading/page.js` — the path hub (server component)
- `app/learn/reading/[slug]/page.js` — the lesson page (server component)
- `supabase/seed/seed_ielts_reading_tfng_lesson.sql` — TFNG lesson row + TFNG drill item + drill questions (with explanations)

**Modify:**
- `lib/ielts/answer-grading.js` — include `explanation` in each `per_question`
- `lib/ielts/__tests__/answer-grading.test.js` — test the passthrough
- `lib/grading/deterministic.js` — select the `explanation` column
- `lib/grading/__tests__/deterministic.test.js` — NEW test file for the grader passthrough (create)
- `components/lesson/SlideViewer.js` — optional `answer` callout + tag chip (backward-compatible)
- `components/practice/SetResult.js` — render explanation; accept path-nav props
- `app/practice/reading/[itemId]/result/[submissionId]/page.js` — compute path nav for known drills
- `app/practice/page.js` — "Learn Reading" entry link
- `supabase/seed/seed_ielts_reading_demo.sql` — add explanations to the existing demo questions

---

## Task 1: Migration 008 — skill_lessons table + explanation column

**Files:**
- Create: `supabase/migrations/008_skill_lessons_and_explanations.sql`

This migration is applied manually in the Supabase SQL editor (the app project is not on the MCP-connected account). It cannot be run from here, so verification is a careful read.

- [ ] **Step 1: Write the migration SQL**

Create `supabase/migrations/008_skill_lessons_and_explanations.sql`:

```sql
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
```

- [ ] **Step 2: Verify by review**

Re-read the file. Confirm: `skill_lessons` columns match the spec §4.1; RLS read-published policy present; no write policy (service-role only); `explanation` column added and NOT in any `GRANT` (so it stays server-only). Confirm there is no `GRANT ... (explanation)` anywhere.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/008_skill_lessons_and_explanations.sql
git commit -m "feat(reading): migration 008 — skill_lessons + server-only question explanations"
```

---

## Task 2: Explanation passthrough in answer-grading (pure, TDD)

**Files:**
- Modify: `lib/ielts/answer-grading.js`
- Test: `lib/ielts/__tests__/answer-grading.test.js`

`gradeReadingSet` builds each per-question review object. Add the question's `explanation` to it so the grader can return it.

- [ ] **Step 1: Write the failing test**

Append the following to `lib/ielts/__tests__/answer-grading.test.js`. Do **not** re-add `import { describe, it, expect } from 'vitest'` or the `gradeReadingSet` import — that file already imports both (re-importing causes a "already declared" syntax error). Append only the `describe` block:

```js
describe('gradeReadingSet explanation passthrough', () => {
  it('includes each question explanation in per_question', () => {
    const questions = [
      {
        id: 'q1',
        position: 1,
        prompt: 'The statement is supported.',
        question_type: 'tfng',
        answer_key: { value: 'TRUE' },
        explanation: { rationale: 'Para A states it directly.', evidence: 'Para A: "..."' },
      },
    ]
    const { perQuestion } = gradeReadingSet(questions, { q1: 'TRUE' })
    expect(perQuestion[0].explanation).toEqual({
      rationale: 'Para A states it directly.',
      evidence: 'Para A: "..."',
    })
  })

  it('uses null when a question has no explanation', () => {
    const questions = [
      { id: 'q1', position: 1, prompt: 'x', question_type: 'tfng', answer_key: { value: 'TRUE' } },
    ]
    const { perQuestion } = gradeReadingSet(questions, { q1: 'TRUE' })
    expect(perQuestion[0].explanation).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/ielts/__tests__/answer-grading.test.js -t "explanation passthrough"`
Expected: FAIL — `perQuestion[0].explanation` is `undefined`.

- [ ] **Step 3: Add the explanation field**

In `lib/ielts/answer-grading.js`, inside `gradeReadingSet`, the `.map((q) => { ... return { ... } })` returns the per-question object. Add the `explanation` line (place it after `question_type: q.question_type,`):

```js
        question_type: q.question_type,
        explanation: q.explanation ?? null,
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/ielts/__tests__/answer-grading.test.js`
Expected: PASS (all existing + the two new tests).

- [ ] **Step 5: Commit**

```bash
git add lib/ielts/answer-grading.js lib/ielts/__tests__/answer-grading.test.js
git commit -m "feat(reading): pass per-question explanation through gradeReadingSet"
```

---

## Task 3: Deterministic grader selects explanation (TDD with a fake admin client)

**Files:**
- Modify: `lib/grading/deterministic.js`
- Test: `lib/grading/__tests__/deterministic.test.js` (create)

The grader queries `practice_questions` via the service-role client. Add `explanation` to the selected columns so it flows into `gradeReadingSet`.

- [ ] **Step 1: Write the failing test**

Create `lib/grading/__tests__/deterministic.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { gradeDeterministicSubmission } from '../deterministic.js'

// Fake of the service-role client's query chain that HONORS the select column
// list (projects each row to only the requested columns). This makes the test
// genuinely fail until the grader's select string includes `explanation`:
// admin.from('practice_questions').select(cols).eq(...).order(...) -> { data, error }
function fakeAdmin(questions) {
  return {
    from() {
      return {
        select(cols) {
          const fields = cols.split(',').map((c) => c.trim())
          const project = (q) => Object.fromEntries(
            fields.filter((f) => f in q).map((f) => [f, q[f]]),
          )
          return {
            eq() {
              return {
                order: async () => ({ data: questions.map(project), error: null }),
              }
            },
          }
        },
      }
    },
  }
}

describe('gradeDeterministicSubmission', () => {
  it('returns per-question explanations in feedback', async () => {
    const questions = [
      {
        id: 'q1', position: 1, prompt: 'x', question_type: 'tfng',
        answer_key: { value: 'TRUE' },
        explanation: { rationale: 'because' },
      },
    ]
    const item = { id: 'item1' }
    const submission = { payload: { answers: { q1: 'TRUE' } } }

    const fields = await gradeDeterministicSubmission(item, submission, { admin: fakeAdmin(questions) })

    expect(fields.feedback.per_question[0].explanation).toEqual({ rationale: 'because' })
    expect(fields.feedback.raw_score).toBe(1)
    expect(fields.band_overall).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/grading/__tests__/deterministic.test.js`
Expected: FAIL — the grader's current `select` string omits `explanation`, so the projecting fake strips it from the returned rows and `per_question[0].explanation` is `null`, not `{ rationale: 'because' }`.

- [ ] **Step 3: Add explanation to the select**

In `lib/grading/deterministic.js`, change the select string:

```js
  const { data: questions, error } = await admin
    .from('practice_questions')
    .select('id, position, prompt, question_type, answer_key, explanation')
    .eq('practice_item_id', item.id)
    .order('position', { ascending: true })
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/grading/__tests__/deterministic.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/grading/deterministic.js lib/grading/__tests__/deterministic.test.js
git commit -m "feat(reading): deterministic grader selects question explanation"
```

---

## Task 4: reading-modules registry + pure helpers (TDD)

**Files:**
- Create: `lib/ielts/reading-modules.js`
- Test: `lib/ielts/__tests__/reading-modules.test.js`

- [ ] **Step 1: Write the failing test**

Create `lib/ielts/__tests__/reading-modules.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { nextModule, moduleForDrill, isExamUnlocked } from '../reading-modules.js'

const MODULES = [
  { slug: 'reading-tfng', position: 1, drill_item_id: 'drill-1' },
  { slug: 'reading-headings', position: 2, drill_item_id: 'drill-2' },
  { slug: 'reading-skim', position: 3, drill_item_id: null },
]

describe('moduleForDrill', () => {
  it('finds the module a drill item belongs to', () => {
    expect(moduleForDrill(MODULES, 'drill-2').slug).toBe('reading-headings')
  })
  it('returns null for an unknown drill', () => {
    expect(moduleForDrill(MODULES, 'nope')).toBeNull()
  })
})

describe('nextModule', () => {
  it('returns the next module by position', () => {
    expect(nextModule(MODULES, 'drill-1').slug).toBe('reading-headings')
  })
  it('returns null after the last module', () => {
    expect(nextModule(MODULES, 'drill-2')).toBeNull()
  })
})

describe('isExamUnlocked', () => {
  it('is false when not all drills are completed', () => {
    expect(isExamUnlocked(MODULES, ['drill-1'])).toBe(false)
  })
  it('is true when every module-with-a-drill is completed', () => {
    expect(isExamUnlocked(MODULES, ['drill-1', 'drill-2'])).toBe(true)
  })
  it('is false when there are no drillable modules', () => {
    expect(isExamUnlocked([{ slug: 'x', position: 1, drill_item_id: null }], [])).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/ielts/__tests__/reading-modules.test.js`
Expected: FAIL — module not found / functions undefined.

- [ ] **Step 3: Implement the registry**

Create `lib/ielts/reading-modules.js`:

```js
// lib/ielts/reading-modules.js
//
// Pure helpers for the Reading "teach-then-test" path. The modules themselves
// are loaded from the skill_lessons table at request time (ordered by
// position) and passed into these helpers; this module holds only fixed config
// and logic so it can be unit-tested without I/O.

// The capstone exam is the existing mixed Academic reading demo set.
export const READING_EXAM_ITEM_ID = '11111111-1111-4111-8111-111111111111'

function byPosition(modules) {
  return [...modules].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
}

// The module a given practice item is the drill for, or null.
export function moduleForDrill(modules, drillItemId) {
  if (!drillItemId) return null
  return modules.find((m) => m.drill_item_id === drillItemId) ?? null
}

// The next module after the one whose drill matches, or null if last/unknown.
export function nextModule(modules, currentDrillItemId) {
  const sorted = byPosition(modules)
  const idx = sorted.findIndex((m) => m.drill_item_id === currentDrillItemId)
  if (idx === -1 || idx === sorted.length - 1) return null
  return sorted[idx + 1]
}

// True when every module that has a drill has a completed (graded) submission.
// False when there are no drillable modules (nothing to complete yet).
export function isExamUnlocked(modules, completedDrillIds) {
  const drills = modules.map((m) => m.drill_item_id).filter(Boolean)
  if (drills.length === 0) return false
  const done = new Set(completedDrillIds)
  return drills.every((id) => done.has(id))
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/ielts/__tests__/reading-modules.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/ielts/reading-modules.js lib/ielts/__tests__/reading-modules.test.js
git commit -m "feat(reading): reading-modules registry helpers (next/forDrill/examUnlocked)"
```

---

## Task 5: SlideViewer — optional answer callout + tag chip

**Files:**
- Modify: `components/lesson/SlideViewer.js`

Backward-compatible: both additions render only when the field is present, so legacy usage is unaffected. There is no React test harness in this repo (Vitest runs in node), so verification is the production build + manual QA.

- [ ] **Step 1: Add the tag chip and answer callout**

In `components/lesson/SlideViewer.js`, inside the slide content `<div className="px-8 py-10 min-h-64">`, add a tag chip as the first child (before the `slide.title` block):

```js
        {slide.tag && (
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-blue-500">
            {slide.tag.replace(/-/g, ' ')}
          </p>
        )}
```

Then, after the `slide.image` block (still inside the content div), add the answer callout:

```js
        {slide.answer && (
          <div className="mt-4 rounded-xl border-l-4 border-green-400 bg-green-50 px-4 py-3 text-sm text-green-900">
            <span className="font-semibold">Answer: </span>{slide.answer}
          </div>
        )}
```

- [ ] **Step 2: Verify the build**

Run: `npm run build`
Expected: compiles successfully (the change is additive JSX).

- [ ] **Step 3: Commit**

```bash
git add components/lesson/SlideViewer.js
git commit -m "feat(reading): SlideViewer optional tag chip + answer callout"
```

---

## Task 6: SetResult — render explanations + path-nav props

**Files:**
- Modify: `components/practice/SetResult.js`

- [ ] **Step 1: Add the explanation block**

In `components/practice/SetResult.js`, inside the `perQuestion.map((q) => ( ... ))` card, after the closing `</dl>`, add:

```js
            {q.explanation && (
              <div className="mt-3 rounded-xl bg-blue-50 px-4 py-3 text-sm text-gray-700">
                {q.explanation.rationale && (
                  <p><span className="font-semibold text-blue-700">Why: </span>{q.explanation.rationale}</p>
                )}
                {q.explanation.evidence && (
                  <p className="mt-1 text-gray-600"><span className="font-medium">In the text: </span>{q.explanation.evidence}</p>
                )}
                {q.explanation.distractors && (
                  <ul className="mt-1 space-y-0.5 text-gray-600">
                    {Object.entries(q.explanation.distractors).map(([opt, note]) => (
                      <li key={opt}><span className="font-medium">{opt}: </span>{note}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
```

- [ ] **Step 2: Add path-nav props**

Change the `SetResult` function signature to accept three optional props and render them in the button row. Update the destructured props:

```js
export default function SetResult({
  grade,
  backHref,
  retryHref,
  dashboardHref = '/dashboard/student',
  pathHref,
  nextHref,
  nextLabel,
  title = 'Your score',
}) {
```

Then in the final button row (the `<div className="mt-10 flex flex-col gap-3 sm:flex-row">`), add these links before the existing `retryHref` link:

```js
        {pathHref ? (
          <Link
            href={pathHref}
            className="rounded-xl border border-gray-200 px-6 py-3 text-center font-semibold text-gray-600 transition-colors hover:bg-gray-50"
          >
            Back to Reading path
          </Link>
        ) : null}
        {nextHref ? (
          <Link
            href={nextHref}
            className="rounded-xl bg-blue-600 px-6 py-3 text-center font-semibold text-white transition-colors hover:bg-blue-700"
          >
            {nextLabel || 'Next module'} →
          </Link>
        ) : null}
```

- [ ] **Step 3: Verify the build**

Run: `npm run build`
Expected: compiles successfully.

- [ ] **Step 4: Commit**

```bash
git add components/practice/SetResult.js
git commit -m "feat(reading): SetResult renders explanations + path navigation"
```

---

## Task 7: Lesson page `/learn/reading/[slug]`

**Files:**
- Create: `app/learn/reading/[slug]/page.js`

- [ ] **Step 1: Implement the lesson page**

Create `app/learn/reading/[slug]/page.js`:

```js
// app/learn/reading/[slug]/page.js
//
// Renders a single Reading strategy lesson (skill_lessons row) via SlideViewer,
// then a CTA to the linked drill (the "Test"). Auth-gated.
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerComponentClientFor } from '@/lib/supabaseServer'
import SlideViewer from '@/components/lesson/SlideViewer'

export default async function ReadingLessonPage({ params }) {
  const supabase = createServerComponentClientFor()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/auth/login?next=/learn/reading/${params.slug}`)

  const { data: lesson } = await supabase
    .from('skill_lessons')
    .select('slug, title, summary, slides_data, drill_item_id, status')
    .eq('slug', params.slug)
    .single()

  if (!lesson || lesson.status !== 'published') {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-800">Lesson not found</h1>
        <p className="mt-2 text-gray-500">This lesson does not exist or is not available yet.</p>
        <Link href="/learn/reading" className="mt-4 inline-block text-sm text-blue-600">← Back to Reading path</Link>
      </main>
    )
  }

  const blocks = lesson.slides_data?.blocks ?? []

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/learn/reading" className="text-xs text-gray-400 hover:text-gray-600">← Reading path</Link>
      <h1 className="mt-4 text-3xl font-bold text-gray-800">{lesson.title}</h1>
      {lesson.summary ? <p className="mt-2 text-gray-500">{lesson.summary}</p> : null}

      <div className="mt-8">
        <SlideViewer slidesData={blocks} />
      </div>

      <div className="mt-8 flex justify-end">
        {lesson.drill_item_id ? (
          <Link
            href={`/practice/reading/${lesson.drill_item_id}`}
            className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Now try it →
          </Link>
        ) : (
          <span className="text-sm text-gray-400">Practice for this lesson is coming soon.</span>
        )}
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Verify the build**

Run: `npm run build`
Expected: route `/learn/reading/[slug]` compiles (listed as `ƒ` dynamic).

- [ ] **Step 3: Commit**

```bash
git add app/learn/reading/[slug]/page.js
git commit -m "feat(reading): lesson page /learn/reading/[slug]"
```

---

## Task 8: Path hub `/learn/reading`

**Files:**
- Create: `app/learn/reading/page.js`

- [ ] **Step 1: Implement the hub**

Create `app/learn/reading/page.js`:

```js
// app/learn/reading/page.js
//
// The Reading "teach-then-test" path hub. Lists published reading lessons
// (modules) in order with completion status, then a capstone exam card gated
// until every module's drill has a graded submission. Auth-gated.
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerComponentClientFor } from '@/lib/supabaseServer'
import { READING_EXAM_ITEM_ID, isExamUnlocked } from '@/lib/ielts/reading-modules'

export default async function ReadingPathPage() {
  const supabase = createServerComponentClientFor()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/learn/reading')

  const { data: modules } = await supabase
    .from('skill_lessons')
    .select('slug, title, summary, drill_item_id, position')
    .eq('section', 'reading')
    .eq('status', 'published')
    .order('position', { ascending: true })

  const mods = modules ?? []
  const drillIds = mods.map((m) => m.drill_item_id).filter(Boolean)

  let completedDrillIds = []
  if (drillIds.length > 0) {
    const { data: subs } = await supabase
      .from('submissions')
      .select('practice_item_id, status')
      .eq('user_id', user.id)
      .in('practice_item_id', drillIds)
      .eq('status', 'graded')
    completedDrillIds = [...new Set((subs ?? []).map((s) => s.practice_item_id))]
  }

  const examUnlocked = isExamUnlocked(mods, completedDrillIds)

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-800">Learn Reading</h1>
      <p className="mt-2 text-gray-500">Work through each lesson and its practice in order, then take the exam.</p>

      {mods.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center text-gray-500">
          Lessons are coming soon.
        </div>
      ) : (
        <ol className="mt-8 space-y-3">
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
        </ol>
      )}

      <div className="mt-8">
        {examUnlocked ? (
          <Link
            href={`/practice/reading/${READING_EXAM_ITEM_ID}`}
            className="flex items-center justify-between rounded-2xl border-2 border-blue-600 bg-blue-50 p-5"
          >
            <span className="text-base font-semibold text-blue-800">Final exam — full reading set</span>
            <span className="shrink-0 text-sm font-semibold text-blue-700">Start →</span>
          </Link>
        ) : (
          <div className="flex items-center justify-between rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 opacity-70">
            <span className="text-base font-semibold text-gray-500">Final exam — full reading set</span>
            <span className="shrink-0 text-sm text-gray-400">Complete all modules to unlock</span>
          </div>
        )}
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Verify the build**

Run: `npm run build`
Expected: route `/learn/reading` compiles (`ƒ` dynamic).

- [ ] **Step 3: Commit**

```bash
git add app/learn/reading/page.js
git commit -m "feat(reading): path hub /learn/reading with module status + gated exam"
```

---

## Task 9: Result-page path navigation for known drills

**Files:**
- Modify: `app/practice/reading/[itemId]/result/[submissionId]/page.js`

When the graded item is a known drill, show "Back to Reading path" and "Next module".

- [ ] **Step 1: Wire path nav into the result page**

In `app/practice/reading/[itemId]/result/[submissionId]/page.js`, add imports at the top (after the existing imports):

```js
import { nextModule, moduleForDrill } from '@/lib/ielts/reading-modules'
```

Before the `return (`, load the reading modules and compute nav (the item id is `params.itemId`):

```js
  const { data: modules } = await supabase
    .from('skill_lessons')
    .select('slug, title, drill_item_id, position')
    .eq('section', 'reading')
    .eq('status', 'published')
    .order('position', { ascending: true })

  const mods = modules ?? []
  const isDrill = !!moduleForDrill(mods, params.itemId)
  const next = isDrill ? nextModule(mods, params.itemId) : null
  const pathHref = isDrill ? '/learn/reading' : undefined
  const nextHref = next ? `/learn/reading/${next.slug}` : undefined
  const nextLabel = next ? next.title : undefined
```

Then pass them to `SetResult`:

```js
      <SetResult
        grade={grade}
        retryHref={backHref}
        pathHref={pathHref}
        nextHref={nextHref}
        nextLabel={nextLabel}
        title="Your raw score"
      />
```

- [ ] **Step 2: Verify the build**

Run: `npm run build`
Expected: compiles successfully.

- [ ] **Step 3: Commit**

```bash
git add app/practice/reading/[itemId]/result/[submissionId]/page.js
git commit -m "feat(reading): results page links back to path + next module for drills"
```

---

## Task 10: "Learn Reading" entry point on /practice

**Files:**
- Modify: `app/practice/page.js`

- [ ] **Step 1: Add the entry link**

In `app/practice/page.js`, add an import for `Link` if not already present (it is). Immediately after the intro `<p>` (the "Pick a task..." paragraph), insert:

```js
      <Link
        href="/learn/reading"
        className="mt-6 flex items-center justify-between rounded-2xl border-2 border-blue-600 bg-blue-50 px-6 py-4"
      >
        <span>
          <span className="block text-base font-semibold text-blue-800">Learn Reading — step by step</span>
          <span className="mt-0.5 block text-sm text-blue-700">Strategy lessons, guided practice, then a full exam.</span>
        </span>
        <span className="shrink-0 text-sm font-semibold text-blue-700">Start →</span>
      </Link>
```

- [ ] **Step 2: Verify the build**

Run: `npm run build`
Expected: compiles successfully.

- [ ] **Step 3: Commit**

```bash
git add app/practice/page.js
git commit -m "feat(reading): add Learn Reading entry point on practice index"
```

---

## Task 11: Seeds — TFNG lesson, TFNG drill, demo-set explanations

**Files:**
- Create: `supabase/seed/seed_ielts_reading_tfng_lesson.sql`
- Modify: `supabase/seed/seed_ielts_reading_demo.sql`

Applied manually in the Supabase SQL editor after migration 008.

- [ ] **Step 1: Write the TFNG lesson + drill seed**

Create `supabase/seed/seed_ielts_reading_tfng_lesson.sql`:

```sql
-- ============================================================
-- Seed: the worked True/False/Not Given module — a skill_lessons row
-- (the lesson) plus a single-type tfng drill practice_item (the test) whose
-- questions carry explanations. The lesson links to the drill via
-- drill_item_id. Idempotent via fixed UUIDs.
-- ============================================================

-- The drill practice_item (fixed id so the lesson can reference it).
DELETE FROM practice_items WHERE id = '33333333-3333-4333-8333-333333333333';

INSERT INTO practice_items (
  id, type, sub_skill, variant, difficulty_band, criterion_tags, payload, status,
  generator_version, published_at
) VALUES (
  '33333333-3333-4333-8333-333333333333',
  'reading_set', 'reading', 'academic', 6.0,
  '["reading"]'::jsonb,
  jsonb_build_object(
    'demo_key', 'drill-tfng',
    'title', 'True / False / Not Given — practice',
    'passage',
      'The Aldabra giant tortoise lives on a coral atoll in the Indian Ocean. ' ||
      'Adults can weigh more than 250 kilograms, and the species is among the longest-lived animals on Earth. ' ||
      E'\n\n' ||
      'The atoll has no permanent human population, which has helped the tortoises survive. ' ||
      'Researchers visit on a seasonal basis to monitor the colony, but they do not stay through the wet season.',
    'minimum_reading_minutes', 8
  ),
  'published', 'seed-v1', now()
);

INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key, explanation) VALUES
('33333333-3333-4333-8333-333333333333', 1, 'tfng',
 'Adult Aldabra giant tortoises can weigh over 250 kilograms.',
 NULL, '{"value": "TRUE"}'::jsonb,
 jsonb_build_object(
   'rationale', 'The passage states adults can weigh more than 250 kg, which matches the statement.',
   'evidence', 'Paragraph 1: "Adults can weigh more than 250 kilograms."'
 )),
('33333333-3333-4333-8333-333333333333', 2, 'tfng',
 'Researchers live on the atoll all year round.',
 NULL, '{"value": "FALSE"}'::jsonb,
 jsonb_build_object(
   'rationale', 'The passage says researchers visit seasonally and do NOT stay through the wet season, which contradicts living there all year.',
   'evidence', 'Paragraph 2: "they do not stay through the wet season."',
   'distractors', jsonb_build_object('NOT GIVEN', 'Tempting, but the text actively contradicts it, so it is False, not Not Given.')
 )),
('33333333-3333-4333-8333-333333333333', 3, 'tfng',
 'The Aldabra giant tortoise is the longest-lived animal on Earth.',
 NULL, '{"value": "NOT GIVEN"}'::jsonb,
 jsonb_build_object(
   'rationale', 'The passage says it is among the longest-lived animals — not that it is THE longest-lived. The superlative is never confirmed.',
   'evidence', 'Paragraph 1: "among the longest-lived animals on Earth."',
   'distractors', jsonb_build_object('TRUE', 'It says "among the", not "the longest", so the claim is not supported.')
 )),
('33333333-3333-4333-8333-333333333333', 4, 'tfng',
 'The atoll has a large permanent human population.',
 NULL, '{"value": "FALSE"}'::jsonb,
 jsonb_build_object(
   'rationale', 'The passage states the atoll has no permanent human population, the opposite of the statement.',
   'evidence', 'Paragraph 2: "The atoll has no permanent human population."'
 )),
('33333333-3333-4333-8333-333333333333', 5, 'tfng',
 'The tortoises are hunted by visitors to the atoll.',
 NULL, '{"value": "NOT GIVEN"}'::jsonb,
 jsonb_build_object(
   'rationale', 'Hunting is never mentioned anywhere in the passage, so there is no information to confirm or deny it.',
   'evidence', 'No sentence in the passage refers to hunting.'
 ));

-- The lesson (skill_lessons row), linked to the drill above.
DELETE FROM skill_lessons WHERE slug = 'reading-tfng';

INSERT INTO skill_lessons (
  section, question_type, slug, title, summary, slides_data, drill_item_id, position, status, published_at
) VALUES (
  'reading', 'tfng', 'reading-tfng',
  'True / False / Not Given',
  'Learn how to tell a contradicted statement (False) from one the passage never mentions (Not Given).',
  jsonb_build_object('blocks', jsonb_build_array(
    jsonb_build_object(
      'tag', 'foundational',
      'title', 'What this question asks',
      'content', 'You decide how each statement relates to the passage.',
      'bullets', jsonb_build_array(
        'TRUE — the statement agrees with the information in the passage.',
        'FALSE — the statement contradicts the information in the passage.',
        'NOT GIVEN — the passage does not say; you cannot tell either way.'
      )
    ),
    jsonb_build_object(
      'tag', 'core-full',
      'title', 'A 4-step method',
      'bullets', jsonb_build_array(
        '1. Read the statement and underline the keywords.',
        '2. Answers come in passage order — scan forward from the last one.',
        '3. Find the matching part of the passage and read it closely.',
        '4. Decide: agrees = True, contradicts = False, cannot tell = Not Given.'
      )
    ),
    jsonb_build_object(
      'tag', 'worked-medium',
      'title', 'Worked example',
      'content', 'Passage: "The festival began in 1990. It now attracts thousands of visitors each summer." Statement: "The festival has been held every year since 1990."',
      'bullets', jsonb_build_array(
        'The passage gives the start year (1990).',
        'It never says the festival ran in every single year.',
        'So we cannot confirm "every year" — and nothing contradicts it either.'
      ),
      'answer', 'NOT GIVEN — the passage gives the start year but never claims it ran every year.'
    ),
    jsonb_build_object(
      'tag', 'common-mistakes',
      'title', 'The traps',
      'bullets', jsonb_build_array(
        'Choosing False when nothing actually contradicts the statement — absence of information means Not Given.',
        'Using your own knowledge instead of only what the passage says.',
        'Ignoring qualifiers like some / all / always / may that change the meaning.'
      )
    ),
    jsonb_build_object(
      'tag', 'recap',
      'title', 'Quick checklist',
      'bullets', jsonb_build_array(
        'Keywords -> find it in order -> compare only to what is written.',
        'Contradicted = False. Silent = Not Given. Agrees = True.'
      )
    )
  )),
  '33333333-3333-4333-8333-333333333333',
  1, 'published', now()
);
```

- [ ] **Step 2: Add explanations to the existing demo set (so the exam teaches too)**

In `supabase/seed/seed_ielts_reading_demo.sql`, replace the six `INSERT INTO practice_questions` statements with the following (each adds the `explanation` column and value; prompts/options/answer keys are unchanged):

```sql
-- Q1 — matching_headings (single_select with options.choices)
INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key, explanation) VALUES
('11111111-1111-4111-8111-111111111111', 1, 'matching_headings',
 'Choose the correct heading for paragraph B.',
 jsonb_build_object('choices', jsonb_build_array(
   jsonb_build_object('value', 'i',   'label', 'i. A wider choice of food'),
   jsonb_build_object('value', 'ii',  'label', 'ii. The dangers of traffic'),
   jsonb_build_object('value', 'iii', 'label', 'iii. Warmer city temperatures')
 )),
 '{"value": "i"}'::jsonb,
 jsonb_build_object(
   'rationale', 'Paragraph B is about the unusually varied diet city bees enjoy — hundreds of flowering plants — which is "a wider choice of food".',
   'evidence', 'Paragraph B: "a city block can contain hundreds of different flowering plants".'
 ));

-- Q2 — tfng
INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key, explanation) VALUES
('11111111-1111-4111-8111-111111111111', 2, 'tfng',
 'City bees usually have less food available to them than bees on farmland.',
 NULL, '{"value": "FALSE"}'::jsonb,
 jsonb_build_object(
   'rationale', 'The passage says urban variety means bees rarely run short of food — the opposite of the statement, so it is False (not Not Given).',
   'evidence', 'Paragraph B: "urban bees rarely run short of food."'
 ));

-- Q3 — tfng (Not Given)
INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key, explanation) VALUES
('11111111-1111-4111-8111-111111111111', 3, 'tfng',
 'More bee species live in cities than in the countryside.',
 NULL, '{"value": "NOT GIVEN"}'::jsonb,
 jsonb_build_object(
   'rationale', 'The passage says many species thrive in cities but never compares the number of city species with the countryside, so we cannot tell.',
   'evidence', 'No sentence compares city and countryside species counts.'
 ));

-- Q4 — mcq_single (single_select with options.choices)
INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key, explanation) VALUES
('11111111-1111-4111-8111-111111111111', 4, 'mcq_single',
 'According to the passage, the urban heat island effect allows bees to',
 jsonb_build_object('choices', jsonb_build_array(
   jsonb_build_object('value', 'A', 'label', 'A. produce more honey.'),
   jsonb_build_object('value', 'B', 'label', 'B. forage over a longer season.'),
   jsonb_build_object('value', 'C', 'label', 'C. avoid the use of pesticides.'),
   jsonb_build_object('value', 'D', 'label', 'D. travel between cities more easily.')
 )),
 '{"value": "B"}'::jsonb,
 jsonb_build_object(
   'rationale', 'Warmer cities let bees start foraging earlier and stay active later into autumn — a longer foraging season.',
   'evidence', 'Paragraph C: "begin foraging earlier in the year and to remain active later into the autumn."',
   'distractors', jsonb_build_object('A', 'Honey production is never mentioned.')
 ));

-- Q5 — sentence_completion (text_fill)
INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key, explanation) VALUES
('11111111-1111-4111-8111-111111111111', 5, 'sentence_completion',
 'Conservationists suggest planting connected ____ of flowers to keep bee numbers stable.',
 jsonb_build_object('word_limit', 1),
 '{"accepted": ["corridors", "corridor"], "word_limit": 1}'::jsonb,
 jsonb_build_object(
   'rationale', 'The passage uses the exact phrase "connected corridors of flowers".',
   'evidence', 'Paragraph D: "planting connected corridors of flowers would help".'
 ));

-- Q6 — short_answer (text_fill, numeric)
INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key, explanation) VALUES
('11111111-1111-4111-8111-111111111111', 6, 'short_answer',
 'How many wild bee species were counted in the survey of one European capital?',
 jsonb_build_object('word_limit', 2),
 '{"accepted": ["50", "more than 50", "fifty"], "word_limit": 2}'::jsonb,
 jsonb_build_object(
   'rationale', 'The final sentence reports the survey counted more than 50 wild bee species.',
   'evidence', 'Paragraph D: "more than 50 wild bee species in a single survey of one large European capital."'
 ));
```

- [ ] **Step 3: Commit**

```bash
git add supabase/seed/seed_ielts_reading_tfng_lesson.sql supabase/seed/seed_ielts_reading_demo.sql
git commit -m "feat(reading): seed TFNG lesson + drill, add explanations to demo set"
```

---

## Task 12: Full verification + status update

**Files:**
- Modify: `docs/superpowers/plans/2026-06-01-ielts-full-build-roadmap.md` (note the Reading teaching layer)

- [ ] **Step 1: Run the full unit suite**

Run: `npm test`
Expected: all tests pass (the 73 existing + the new answer-grading, deterministic, and reading-modules tests).

- [ ] **Step 2: Run the production build**

Run: `npm run build`
Expected: EXIT 0; routes `/learn/reading` and `/learn/reading/[slug]` listed. (If a stale `.next` causes an `EINVAL readlink` on this OneDrive path, delete `.next` and rebuild — that is an environment artifact, not a code failure.)

- [ ] **Step 3: Note the manual go-live steps**

The following must be done by the user on the app's Supabase (not MCP-connected):
1. Apply `supabase/migrations/008_skill_lessons_and_explanations.sql`.
2. Run `supabase/seed/seed_ielts_reading_tfng_lesson.sql` and the updated `supabase/seed/seed_ielts_reading_demo.sql`.

Then manual QA: `/practice` → "Learn Reading" → TFNG lesson → "Now try it" → drill → results show explanations + "Back to Reading path" → exam card unlocks → exam set. Confirm (via browser devtools) the `explanation` field is NOT present in the `practice_questions` payload before submitting.

- [ ] **Step 4: Update the roadmap note + commit**

Add a line under Wave 2 Reading in `docs/superpowers/plans/2026-06-01-ielts-full-build-roadmap.md` noting the teach-then-test layer shipped (engine + TFNG worked module; bulk lessons deferred to the CAO). Then:

```bash
git add docs/superpowers/plans/2026-06-01-ielts-full-build-roadmap.md
git commit -m "docs(plan): note Reading teach-then-test layer (engine + TFNG module)"
```

---

## Notes for the implementer

- **Style:** no semicolons, single quotes, 2-space indent — match surrounding files.
- **No React test harness:** Vitest runs in node here, so UI components (`SlideViewer`, `SetResult`, pages) are verified by `npm run build` + manual QA, not unit tests. Only pure logic (`answer-grading`, `reading-modules`, the deterministic grader via a fake admin) is unit-tested. This is intentional and called out in the spec.
- **Migrations/seeds are applied manually** by the user; nothing here runs them.
- **`explanation` is server-only** — never add it to a client `select` or a column `GRANT`.
