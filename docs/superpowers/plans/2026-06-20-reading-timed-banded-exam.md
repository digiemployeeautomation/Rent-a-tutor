# Timed + Banded Reading Exam — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the reading capstone exam a countdown timer and an estimated IELTS band on results, driven by item `payload` flags, without changing drill behaviour.

**Architecture:** A pure banding helper and pure timer helpers hold all logic (unit-tested). The deterministic grader fills the existing `band_overall` column for `payload.is_mock` items. `QuestionSetRunner` gains an optional `timeLimitSeconds` prop (countdown + warn-and-lock); the exam page derives it from `payload`; the result page surfaces the band + time via `SetResult`. Untimed sets and drills are unchanged.

**Tech Stack:** Next.js 14 (App Router), React 18, Supabase (Postgres + RLS), Vitest. JavaScript (ESM, `.js`, relative imports in tests, `@/` alias in app code).

**Spec:** `docs/superpowers/specs/2026-06-20-reading-timed-banded-exam-design.md`

**Commit convention:** end every commit message with the trailer
`Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>` (omitted from the short commands below for brevity).

---

### Task 1: Banding helper (`estimateReadingBand`)

**Files:**
- Create: `lib/ielts/banding.js`
- Test: `lib/ielts/__tests__/banding.test.js`

- [ ] **Step 1: Write the failing test**

Create `lib/ielts/__tests__/banding.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { estimateReadingBand } from '../banding.js'

describe('estimateReadingBand — academic (40-question)', () => {
  it('maps top of each band boundary', () => {
    expect(estimateReadingBand(40, 40)).toBe(9.0)
    expect(estimateReadingBand(39, 40)).toBe(9.0)
    expect(estimateReadingBand(38, 40)).toBe(8.5)
    expect(estimateReadingBand(37, 40)).toBe(8.5)
    expect(estimateReadingBand(36, 40)).toBe(8.0)
    expect(estimateReadingBand(30, 40)).toBe(7.0)
    expect(estimateReadingBand(29, 40)).toBe(6.5)
    expect(estimateReadingBand(23, 40)).toBe(6.0)
    expect(estimateReadingBand(13, 40)).toBe(4.5)
  })
  it('floors to 2.0 at zero', () => {
    expect(estimateReadingBand(0, 40)).toBe(2.0)
  })
})

describe('estimateReadingBand — scaling for short sets', () => {
  it('scales a 6-question set to a /40 equivalent', () => {
    expect(estimateReadingBand(6, 6)).toBe(9.0)   // 40/40
    expect(estimateReadingBand(5, 6)).toBe(7.5)   // round(33.3)=33 -> 7.5
    expect(estimateReadingBand(3, 6)).toBe(5.5)   // 20 -> 5.5
    expect(estimateReadingBand(0, 6)).toBe(2.0)
  })
})

describe('estimateReadingBand — general training', () => {
  it('needs more correct per band than academic', () => {
    expect(estimateReadingBand(40, 40, 'general')).toBe(9.0)
    expect(estimateReadingBand(39, 40, 'general')).toBe(8.5)
    expect(estimateReadingBand(5, 6, 'general')).toBe(6.5) // 33 -> 6.5 (vs 7.5 academic)
  })
})

describe('estimateReadingBand — edges', () => {
  it('returns null when there are no questions', () => {
    expect(estimateReadingBand(0, 0)).toBeNull()
    expect(estimateReadingBand(3, 0)).toBeNull()
  })
  it('clamps a raw score above total', () => {
    expect(estimateReadingBand(99, 40)).toBe(9.0)
  })
  it('treats an unknown variant as academic', () => {
    expect(estimateReadingBand(38, 40, 'nonsense')).toBe(8.5)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/ielts/__tests__/banding.test.js`
Expected: FAIL — `Failed to resolve import "../banding.js"` / `estimateReadingBand is not a function`.

- [ ] **Step 3: Write minimal implementation**

Create `lib/ielts/banding.js`:

```js
// lib/ielts/banding.js
//
// Pure IELTS Reading raw-score → band estimation. Tables map a raw score out of
// 40 to an approximate band; sets with a different question count are scaled to a
// 40-question equivalent first. Values follow commonly published conversions and
// are APPROXIMATE — calibration against examiner-scored samples is a later phase.

// Descending {min, band}: the band is the first row whose `min` (raw out of 40)
// is <= the scaled score. A floor row at min:0 guarantees a defined band.
export const BAND_TABLE_ACADEMIC = [
  { min: 39, band: 9.0 },
  { min: 37, band: 8.5 },
  { min: 35, band: 8.0 },
  { min: 33, band: 7.5 },
  { min: 30, band: 7.0 },
  { min: 27, band: 6.5 },
  { min: 23, band: 6.0 },
  { min: 19, band: 5.5 },
  { min: 15, band: 5.0 },
  { min: 13, band: 4.5 },
  { min: 10, band: 4.0 },
  { min: 8, band: 3.5 },
  { min: 6, band: 3.0 },
  { min: 4, band: 2.5 },
  { min: 0, band: 2.0 },
]

export const BAND_TABLE_GENERAL = [
  { min: 40, band: 9.0 },
  { min: 39, band: 8.5 },
  { min: 37, band: 8.0 },
  { min: 36, band: 7.5 },
  { min: 34, band: 7.0 },
  { min: 32, band: 6.5 },
  { min: 30, band: 6.0 },
  { min: 27, band: 5.5 },
  { min: 23, band: 5.0 },
  { min: 19, band: 4.5 },
  { min: 15, band: 4.0 },
  { min: 12, band: 3.5 },
  { min: 9, band: 3.0 },
  { min: 6, band: 2.5 },
  { min: 0, band: 2.0 },
]

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n))
}

// Estimate an IELTS Reading band from a raw score. Returns null when there are
// no questions. variant: 'academic' (default) | 'general'.
export function estimateReadingBand(rawScore, total, variant = 'academic') {
  if (!total || total <= 0) return null
  const table = variant === 'general' ? BAND_TABLE_GENERAL : BAND_TABLE_ACADEMIC
  const raw = clamp(Number(rawScore) || 0, 0, total)
  const equiv40 = clamp(Math.round((raw / total) * 40), 0, 40)
  const row = table.find((r) => equiv40 >= r.min)
  return row ? row.band : null
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/ielts/__tests__/banding.test.js`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add lib/ielts/banding.js lib/ielts/__tests__/banding.test.js
git commit -m "feat(reading): estimateReadingBand helper + tables"
```

---

### Task 2: Exam timer helpers

**Files:**
- Create: `lib/ielts/exam-timer.js`
- Test: `lib/ielts/__tests__/exam-timer.test.js`

- [ ] **Step 1: Write the failing test**

Create `lib/ielts/__tests__/exam-timer.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { computeRemaining, formatClock, proportionalLimit } from '../exam-timer.js'

describe('computeRemaining', () => {
  it('is the full limit at start', () => {
    expect(computeRemaining(1000, 60, 1000)).toBe(60)
  })
  it('decreases by elapsed whole seconds', () => {
    expect(computeRemaining(1000, 60, 11000)).toBe(50)
  })
  it('never goes negative', () => {
    expect(computeRemaining(1000, 60, 100000)).toBe(0)
  })
})

describe('formatClock', () => {
  it('formats mm:ss with zero padding', () => {
    expect(formatClock(0)).toBe('00:00')
    expect(formatClock(9)).toBe('00:09')
    expect(formatClock(540)).toBe('09:00')
  })
  it('supports over an hour', () => {
    expect(formatClock(3661)).toBe('61:01')
  })
  it('clamps negatives to 00:00', () => {
    expect(formatClock(-5)).toBe('00:00')
  })
})

describe('proportionalLimit', () => {
  it('is ~1.5 min per question by default', () => {
    expect(proportionalLimit(6)).toBe(540)
    expect(proportionalLimit(40)).toBe(3600)
  })
  it('is zero for no questions', () => {
    expect(proportionalLimit(0)).toBe(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/ielts/__tests__/exam-timer.test.js`
Expected: FAIL — cannot resolve `../exam-timer.js`.

- [ ] **Step 3: Write minimal implementation**

Create `lib/ielts/exam-timer.js`:

```js
// lib/ielts/exam-timer.js
//
// Pure helpers for the timed-exam countdown. Kept out of the React component so
// the time math is unit-testable. The caller passes the current time in (no
// Date.now() here) so results are deterministic.

// Seconds remaining given when the clock started (ms), the limit (seconds), and
// "now" (ms). Never negative.
export function computeRemaining(startedAtMs, limitSeconds, nowMs) {
  const elapsed = Math.floor((nowMs - startedAtMs) / 1000)
  return Math.max(0, limitSeconds - elapsed)
}

// Format a second count as mm:ss (supports >59 minutes; clamps negatives).
export function formatClock(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds))
  const mm = Math.floor(s / 60)
  const ss = s % 60
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
}

// Proportional time limit: ~1.5 min (90s) per question.
export function proportionalLimit(questionCount, perQuestionSeconds = 90) {
  const n = Math.max(0, Math.floor(questionCount) || 0)
  return n * perQuestionSeconds
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/ielts/__tests__/exam-timer.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/ielts/exam-timer.js lib/ielts/__tests__/exam-timer.test.js
git commit -m "feat(reading): pure exam-timer helpers (countdown, clock, limit)"
```

---

### Task 3: Grader fills `band_overall` for mocks

**Files:**
- Modify: `lib/grading/deterministic.js`
- Test: `lib/grading/__tests__/deterministic.test.js`

- [ ] **Step 1: Write the failing test**

Append these two tests inside the existing `describe('gradeDeterministicSubmission', ...)` block in `lib/grading/__tests__/deterministic.test.js` (the `fakeAdmin` helper already exists at the top of that file):

```js
  it('adds an estimated band for a mock item', async () => {
    const questions = [
      { id: 'q1', position: 1, prompt: 'x', question_type: 'tfng', answer_key: { value: 'TRUE' }, explanation: null },
    ]
    const item = { id: 'exam1', variant: 'academic', payload: { is_mock: true } }
    const submission = { payload: { answers: { q1: 'TRUE' } } }

    const fields = await gradeDeterministicSubmission(item, submission, { admin: fakeAdmin(questions) })

    // 1/1 correct -> /40 equivalent 40 -> band 9.0
    expect(fields.band_overall).toBe(9.0)
    expect(fields.feedback.band_variant).toBe('academic')
  })

  it('leaves band null for a non-mock drill', async () => {
    const questions = [
      { id: 'q1', position: 1, prompt: 'x', question_type: 'tfng', answer_key: { value: 'TRUE' }, explanation: null },
    ]
    const item = { id: 'drill1', variant: 'academic', payload: {} }
    const submission = { payload: { answers: { q1: 'TRUE' } } }

    const fields = await gradeDeterministicSubmission(item, submission, { admin: fakeAdmin(questions) })

    expect(fields.band_overall).toBeNull()
    expect(fields.feedback.band_variant).toBeUndefined()
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/grading/__tests__/deterministic.test.js`
Expected: FAIL — `band_overall` is `null` for the mock case (current grader hard-codes null); `band_variant` undefined.

- [ ] **Step 3: Write minimal implementation**

In `lib/grading/deterministic.js`:

(a) Update the header comment block (lines 8–10) from the "band_overall is left null" note to:

```js
// Per the scoring decision, a single drill reports raw score + per-question
// review only. A mock set (payload.is_mock) additionally reports an estimated
// band via the official raw→band tables (lib/ielts/banding).
```

(b) Add the import under the existing one:

```js
import { gradeReadingSet } from '@/lib/ielts/answer-grading'
import { estimateReadingBand } from '@/lib/ielts/banding'
```

(c) Replace the block from `const answersById = ...` through the `return { ... }` with:

```js
  const answersById = submission.payload?.answers ?? {}
  const { perQuestion, rawScore, total, percentage } = gradeReadingSet(questions, answersById)

  // A drill reports raw score only; a mock also reports an estimated band.
  const isMock = item.payload?.is_mock === true
  const variant = item.variant === 'general' ? 'general' : 'academic'
  const band = isMock ? estimateReadingBand(rawScore, total, variant) : null

  const feedback = {
    per_question: perQuestion,
    raw_score: rawScore,
    total,
    percentage,
  }
  if (isMock) feedback.band_variant = variant

  return {
    band_overall: band,
    band_per_criterion: null,
    feedback,
    graded_by: 'deterministic',
    model_version: DETERMINISTIC_GRADER_VERSION,
    cost_cents: 0,
    latency_ms: null,
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/grading/__tests__/deterministic.test.js`
Expected: PASS — including the pre-existing "returns per-question explanations" test (still `band_overall` null for its `{ id: 'item1' }` non-mock item).

- [ ] **Step 5: Commit**

```bash
git add lib/grading/deterministic.js lib/grading/__tests__/deterministic.test.js
git commit -m "feat(reading): grader sets band_overall for mock items"
```

---

### Task 4: Countdown timer in `QuestionSetRunner`

**Files:**
- Modify: `components/practice/QuestionSetRunner.js`

No unit test (no component-test harness in this repo); verified via lint + manual dev run in Task 8.

- [ ] **Step 1: Update imports**

Change line 19 from:

```js
import { useState } from 'react'
```

to:

```js
import { useState, useEffect, useRef } from 'react'
```

And add, after the `import TextFill ...` line:

```js
import { computeRemaining, formatClock } from '@/lib/ielts/exam-timer'
```

- [ ] **Step 2: Add the `timeLimitSeconds` prop + timer state**

Change the function signature from:

```js
export default function QuestionSetRunner({ item, questions = [], resultBase }) {
  const router = useRouter()
  const [answers, setAnswers] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
```

to:

```js
export default function QuestionSetRunner({ item, questions = [], resultBase, timeLimitSeconds = null }) {
  const router = useRouter()
  const [answers, setAnswers] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const timed = typeof timeLimitSeconds === 'number' && timeLimitSeconds > 0
  const startedAtRef = useRef(null)
  const [remaining, setRemaining] = useState(timed ? timeLimitSeconds : null)
  const [timeUp, setTimeUp] = useState(false)

  useEffect(() => {
    if (!timed) return
    startedAtRef.current = Date.now()
    const tick = () => {
      const left = computeRemaining(startedAtRef.current, timeLimitSeconds, Date.now())
      setRemaining(left)
      if (left <= 0) setTimeUp(true)
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [timed, timeLimitSeconds])
```

- [ ] **Step 3: Lock answers after time is up**

Change `setAnswer` from:

```js
  function setAnswer(questionId, value) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }
```

to:

```js
  function setAnswer(questionId, value) {
    if (timeUp) return
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }
```

- [ ] **Step 4: Record time fields on submit**

In `handleSubmit`, change the submission POST body from:

```js
        body: JSON.stringify({
          practice_item_id: item.id,
          payload: { answers },
        }),
```

to:

```js
        body: JSON.stringify({
          practice_item_id: item.id,
          payload: {
            answers,
            ...(timed
              ? {
                  time_taken_seconds: Math.round((Date.now() - (startedAtRef.current ?? Date.now())) / 1000),
                  timed_out: timeUp,
                }
              : {}),
          },
        }),
```

- [ ] **Step 5: Render the countdown + banner, and lock the list**

Change the header block from:

```jsx
      <div>
        <div className="mb-1 text-xs uppercase tracking-wider text-gray-400">
          {subSkillLabel(item.sub_skill)}
        </div>
        <h2 className="text-2xl font-bold text-gray-800">
          {payload.title || 'Practice set'}
        </h2>
      </div>
```

to:

```jsx
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-1 text-xs uppercase tracking-wider text-gray-400">
            {subSkillLabel(item.sub_skill)}
          </div>
          <h2 className="text-2xl font-bold text-gray-800">
            {payload.title || 'Practice set'}
          </h2>
        </div>
        {timed && remaining != null ? (
          <div
            className={`shrink-0 rounded-lg px-3 py-1 font-mono text-sm font-semibold ${
              remaining <= 60 ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600'
            }`}
            aria-live="polite"
          >
            ⏱ {formatClock(remaining)}
          </div>
        ) : null}
      </div>

      {timeUp ? (
        <div className="rounded-lg bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800">
          ⏰ Time&apos;s up — submit your answers now.
        </div>
      ) : null}
```

Change the questions list opening tag from:

```jsx
      <ol className="space-y-6">
```

to:

```jsx
      <ol className={`space-y-6 ${timeUp ? 'pointer-events-none opacity-60' : ''}`}>
```

- [ ] **Step 6: Lint**

Run: `npm run lint`
Expected: no new errors for `components/practice/QuestionSetRunner.js`.

- [ ] **Step 7: Commit**

```bash
git add components/practice/QuestionSetRunner.js
git commit -m "feat(reading): countdown timer + warn-and-lock in QuestionSetRunner"
```

---

### Task 5: Exam page passes `timeLimitSeconds`

**Files:**
- Modify: `app/practice/reading/[itemId]/page.js`

- [ ] **Step 1: Import the helper**

Add after the `import QuestionSetRunner ...` line:

```js
import { proportionalLimit } from '@/lib/ielts/exam-timer'
```

- [ ] **Step 2: Derive the limit and pass it**

Change:

```js
  const payload = item.payload ?? {}

  return (
```

to:

```js
  const payload = item.payload ?? {}
  const timeLimitSeconds =
    payload.time_limit_seconds ??
    (payload.is_mock ? proportionalLimit((questions ?? []).length) : null)

  return (
```

Change the runner element from:

```jsx
        <QuestionSetRunner
          item={item}
          questions={questions ?? []}
          resultBase={`/practice/reading/${item.id}/result`}
        />
```

to:

```jsx
        <QuestionSetRunner
          item={item}
          questions={questions ?? []}
          resultBase={`/practice/reading/${item.id}/result`}
          timeLimitSeconds={timeLimitSeconds}
        />
```

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no new errors for `app/practice/reading/[itemId]/page.js`.

- [ ] **Step 4: Commit**

```bash
git add "app/practice/reading/[itemId]/page.js"
git commit -m "feat(reading): exam page derives timed limit from payload"
```

---

### Task 6: Result page + `SetResult` show band & time

**Files:**
- Modify: `app/practice/reading/[itemId]/result/[submissionId]/page.js`
- Modify: `components/practice/SetResult.js`

- [ ] **Step 1: Pass band + time props from the result page**

In `app/practice/reading/[itemId]/result/[submissionId]/page.js`, change the `<SetResult ... />` element from:

```jsx
      <SetResult
        grade={grade}
        retryHref={backHref}
        pathHref={pathHref}
        nextHref={nextHref}
        nextLabel={nextLabel}
        title="Your raw score"
      />
```

to:

```jsx
      <SetResult
        grade={grade}
        retryHref={backHref}
        pathHref={pathHref}
        nextHref={nextHref}
        nextLabel={nextLabel}
        title="Your raw score"
        band={grade?.band_overall ?? null}
        bandVariant={grade?.feedback?.band_variant ?? null}
        timeTakenSeconds={submission?.payload?.time_taken_seconds ?? null}
        timedOut={submission?.payload?.timed_out ?? false}
      />
```

- [ ] **Step 2: Add the band block + time line to `SetResult`**

In `components/practice/SetResult.js`:

(a) Add the import after `import Link from 'next/link'`:

```js
import { formatClock } from '@/lib/ielts/exam-timer'
```

(b) Change the component signature from:

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

to:

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
  band = null,
  bandVariant = null,
  timeTakenSeconds = null,
  timedOut = false,
}) {
```

(c) Insert the band block immediately before the raw-score card (the `<div className="mt-6 rounded-3xl bg-gradient-to-br from-blue-600 ...">` block). Add:

```jsx
      {band != null ? (
        <div className="mt-6 rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-800 px-8 py-10 text-center text-white">
          <div className="text-sm uppercase tracking-wide text-emerald-100">Estimated IELTS band</div>
          <div className="mt-2 text-7xl font-bold">{band.toFixed(1)}</div>
          <div className="mt-2 text-xs text-emerald-100">
            {bandVariant === 'general' ? 'General Training' : 'Academic'} · estimated from a short set —
            full-length mocks give a more reliable band.
          </div>
          {timeTakenSeconds != null ? (
            <div className="mt-3 text-sm text-emerald-50">
              {timedOut
                ? `⏰ Ran out of time (${formatClock(timeTakenSeconds)})`
                : `Completed in ${formatClock(timeTakenSeconds)}`}
            </div>
          ) : null}
        </div>
      ) : null}
```

(d) Replace the trailing footer paragraph from:

```jsx
      <p className="mt-8 text-xs text-gray-400">
        Raw score for this set. A full band score is estimated only across a complete mock test.
      </p>
```

to (hide it once a band is shown, since it would contradict the band block):

```jsx
      {band == null ? (
        <p className="mt-8 text-xs text-gray-400">
          Raw score for this set. A full band score is estimated only across a complete mock test.
        </p>
      ) : null}
```

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no new errors for the two modified files.

- [ ] **Step 4: Commit**

```bash
git add "app/practice/reading/[itemId]/result/[submissionId]/page.js" components/practice/SetResult.js
git commit -m "feat(reading): show estimated band + time taken on results"
```

---

### Task 7: Seed the demo exam as a timed mock

**Files:**
- Modify: `supabase/seed/seed_ielts_reading_demo.sql`

> **Note:** this project's Supabase is not MCP-connected — the seed SQL is committed here but **applied to the database by the user** through their normal migration/seed process.

- [ ] **Step 1: Add the mock flags to the payload**

In `supabase/seed/seed_ielts_reading_demo.sql`, change:

```sql
    'minimum_reading_minutes', 20
  ),
```

to:

```sql
    'minimum_reading_minutes', 20,
    'is_mock', true,
    'time_limit_seconds', 540
  ),
```

- [ ] **Step 2: Sanity-check the SQL is well-formed**

Run: `node --check supabase/seed/seed_ielts_reading_demo.sql 2>/dev/null || true` is NOT valid (it's SQL, not JS). Instead visually confirm the `jsonb_build_object(...)` argument list still has an even number of key/value arguments and the closing `)` is intact (the two new keys add two key/value pairs).

- [ ] **Step 3: Commit**

```bash
git add supabase/seed/seed_ielts_reading_demo.sql
git commit -m "feat(reading): seed demo exam as a timed mock (9 min, banded)"
```

---

### Task 8: Full verification

**Files:** none (verification only).

- [ ] **Step 1: Run the whole unit suite**

Run: `npm test`
Expected: PASS — all prior tests plus the new banding, exam-timer, and grader band tests. No regressions.

- [ ] **Step 2: Lint the whole project**

Run: `npm run lint`
Expected: no new warnings/errors introduced by this change.

- [ ] **Step 3: Manual smoke test (dev)**

Apply the updated seed to the database (user step), then:

Run: `npm run dev`

Verify, signed in, after completing the 5 module drills so the exam unlocks:
1. Open the exam at `/practice/reading/11111111-1111-4111-8111-111111111111`. A `⏱ 09:00` countdown shows in the header and ticks down.
2. Let it hit `00:00` (or temporarily set `time_limit_seconds` low for the test): the "⏰ Time's up" banner appears, the questions dim and stop accepting input, but **Submit is still clickable**.
3. Submit. On the result page an **emerald "Estimated IELTS band X.X"** card appears above the raw score, with the Academic caveat and a "Completed in mm:ss" / "Ran out of time" line.
4. Open any **drill** result (e.g. the TFNG drill): **no** band card, **no** timer on the drill runner — unchanged behaviour.

- [ ] **Step 4: Final commit (if any verification fixes were needed)**

```bash
git add -A
git commit -m "test(reading): verify timed + banded exam end-to-end"
```

---

## Self-Review

**Spec coverage:**
- Banding helper (spec §4.1) → Task 1. ✔
- Grader fills `band_overall` for mocks (spec §4.2) → Task 3. ✔
- Timer prop + countdown + warn-and-lock + time fields (spec §4.3) → Tasks 2 (helpers) + 4. ✔
- Exam page derives limit (spec §4.4) → Task 5. ✔
- Result page + `SetResult` band & time (spec §4.5) → Task 6. ✔
- Seed mock flags (spec §4.6) → Task 7. ✔
- Tests (spec §6): banding boundaries/scaling/variants/edge → Task 1; grader presence/absence → Task 3; timer pure helpers → Task 2. ✔
- Edge cases (spec §5): `total=0`→null (Task 1), perfect→9 (Task 1), untimed unchanged (Tasks 4–6 guard on `timed`/`band`), tab-sleep accuracy (Task 2 `computeRemaining` from `Date.now()` each tick), older submissions without time fields (Task 6 `timeTakenSeconds != null` guard). ✔

**Placeholder scan:** none — every code/step is concrete.

**Type/name consistency:** `estimateReadingBand(rawScore, total, variant)`, `computeRemaining(startedAtMs, limitSeconds, nowMs)`, `formatClock(totalSeconds)`, `proportionalLimit(questionCount)`, prop `timeLimitSeconds`, grade field `band_overall`, feedback key `band_variant`, submission keys `time_taken_seconds`/`timed_out`, `SetResult` props `band`/`bandVariant`/`timeTakenSeconds`/`timedOut` — used identically across tasks.
