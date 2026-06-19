# Phase 1 — Timed + Banded Reading Exam (Design Spec)

**Date:** 2026-06-20
**Phase:** 1 of the [Reading Module Completion Roadmap](../plans/2026-06-20-reading-module-completion-roadmap.md)
**Status:** Approved design; implementation plan to follow.

## 1. Overview

Make the reading **capstone exam** feel like a real IELTS sitting: a countdown
**timer** and an estimated **IELTS band** (0–9) on the results page. Both are
**data-driven from the item's `payload`**, so the same mechanism powers the
future full-length 40-question mock (Phase 6) with no rework. Drills stay
untouched (untimed, raw-score only).

## 2. Goals / Non-goals

**Goals**
- A per-item countdown timer, proportional to question count (~1.5 min/question),
  configurable via `payload`.
- Warn-and-lock behaviour at expiry (inputs lock; student submits manually).
- An estimated IELTS band on mock results, using official Academic/General
  Training raw→band tables, scaled for sets with ≠40 questions.
- Persist time taken + timed-out flag on the submission.
- Pure, unit-tested banding helper reusable by the full mock.

**Non-goals (this phase)**
- Full-length 40-Q / 3-passage assembly, long-test UX (palette, flag, split
  pane) — Phase 6.
- Band **calibration** against examiner data — Phase 7.
- Per-passage timing; listening bands.
- Changing drill behaviour.

## 3. Architecture

```
payload.is_mock / payload.time_limit_seconds
        │
        ▼
[exam page] ──timeLimitSeconds──▶ [QuestionSetRunner]
                                       │ countdown, warn+lock,
                                       │ records time_taken_seconds + timed_out
                                       ▼
                              POST /api/submissions  { answers, time_taken_seconds, timed_out }
                                       │
                              POST .../grade ──▶ [deterministic grader]
                                       │           gradeReadingSet → raw/total/%
                                       │           if payload.is_mock: band_overall = estimateReadingBand(...)
                                       ▼
                              [result page] ──▶ [SetResult] shows band + time when present
```

Data-driven flags on `practice_items.payload`:
- `time_limit_seconds` (number, optional) — explicit limit. When absent and
  `is_mock` is true, the runner computes `questions.length * 90`.
- `is_mock` (boolean, optional) — marks the item as a banded mock. Triggers band
  computation at grade time and band display at result time.

## 4. Components

### 4.1 Banding helper — `lib/ielts/banding.js` (new, pure)

```
estimateReadingBand(rawScore, total, variant = 'academic') -> number | null
```
- Returns `null` when `total <= 0`.
- Scales to a 40-question equivalent: `equiv40 = clamp(round(rawScore/total*40), 0, 40)`.
- Looks up the highest band whose `min` threshold ≤ `equiv40`.
- `variant`: `'academic'` (default) or `'general'`; unknown → `'academic'`.

Tables are descending `{ min, band }` thresholds (raw out of 40). Values follow
commonly published conversions and are **approximate / calibratable in Phase 7**.

**Academic**

| Band | min raw (/40) |
|---|---|
| 9.0 | 39 |
| 8.5 | 37 |
| 8.0 | 35 |
| 7.5 | 33 |
| 7.0 | 30 |
| 6.5 | 27 |
| 6.0 | 23 |
| 5.5 | 19 |
| 5.0 | 15 |
| 4.5 | 13 |
| 4.0 | 10 |
| 3.5 | 8 |
| 3.0 | 6 |
| 2.5 | 4 |
| 2.0 | 0 |

**General Training** (higher raw needed per band)

| Band | min raw (/40) |
|---|---|
| 9.0 | 40 |
| 8.5 | 39 |
| 8.0 | 37 |
| 7.5 | 36 |
| 7.0 | 34 |
| 6.5 | 32 |
| 6.0 | 30 |
| 5.5 | 27 |
| 5.0 | 23 |
| 4.5 | 19 |
| 4.0 | 15 |
| 3.5 | 12 |
| 3.0 | 9 |
| 2.5 | 6 |
| 2.0 | 0 |

Algorithm finds the first row (top-down) where `equiv40 >= min`. A floor row at
`min: 0` guarantees a defined band for any non-empty set.

### 4.2 Grading integration — `lib/grading/deterministic.js`

The grader already receives the full `item` (with `payload` and `variant`) from
the grade route (`app/api/submissions/[id]/grade/route.js` selects them), and the
route persists the top-level **`band_overall`** column from the grader's return.
Today the grader hard-codes `band_overall: null` with a comment that band "needs
a full mock" — this phase populates it for mock items. That is the correct home;
**the band goes in `band_overall`, not `feedback`.**

After `gradeReadingSet` produces `{ perQuestion, rawScore, total, percentage }`:
- If the graded item's `payload.is_mock === true`:
  - `band_overall = estimateReadingBand(rawScore, total, variantOf(item))`
  - add `band_variant` (the resolved variant string) to `feedback` for display.
- `variantOf(item)`: `item.variant === 'general' ? 'general' : 'academic'`.
- Drills (`is_mock` falsy) → `band_overall: null`, no `band_variant` (unchanged).
- `gradeReadingSet` itself is **not** modified — banding lives in the grader that
  already has item context. Update the file's header comment to reflect that a
  mock set now reports a band.

Grader return for a mock:
```json
{ "band_overall": 7.5, "band_per_criterion": null,
  "feedback": { "raw_score": 5, "total": 6, "percentage": 83,
                "per_question": [...], "band_variant": "academic" } }
```

### 4.3 Timer — `components/practice/QuestionSetRunner.js`

New prop `timeLimitSeconds: number | null` (null/absent ⇒ untimed, today's
behaviour, no visual change).

When set:
- Capture `startedAt = Date.now()` on mount; tick a `remaining` countdown every
  second; render `mm:ss` in the header (turns amber ≤ 60s).
- At `remaining === 0` → `timeUp = true`:
  - Show a banner: **"⏰ Time's up — submit your answers now."**
  - Lock interaction: question list wrapper gets `pointer-events-none opacity-60`
    and `setAnswer` becomes a no-op (defence in depth). Inputs untouched
    structurally — no per-primitive `disabled` plumbing needed.
  - **Submit stays enabled** (warn-and-lock, not auto-submit).
- On submit, include in the POST payload:
  `time_taken_seconds = round((Date.now() - startedAt)/1000)` and
  `timed_out = timeUp`.

Submission payload contract becomes:
```json
{ "answers": { ... }, "time_taken_seconds": 312, "timed_out": false }
```
Existing consumers read `payload.answers` only, so this is backwards-compatible;
untimed sets simply omit the two new keys.

Timer uses a single `setInterval` cleared on unmount and on submit. `Date.now()`
is browser client code (the workflow-script restriction does not apply here).

### 4.4 Exam page — `app/practice/reading/[itemId]/page.js`

Compute and pass the limit:
```
const timeLimitSeconds =
  payload.time_limit_seconds ??
  (payload.is_mock ? (questions?.length ?? 0) * 90 : null)
```
Pass `timeLimitSeconds` into `QuestionSetRunner`. No other change; the route
stays generic for drills (which have neither flag → untimed).

### 4.5 Result page + `SetResult.js`

`app/practice/reading/[itemId]/result/[submissionId]/page.js`:
- Already loads `submission` and `grade` (`select('*')` → includes `band_overall`).
  Pass through to `SetResult`:
  - `band = grade.band_overall` (may be null),
  - `bandVariant = grade.feedback.band_variant`,
  - `timeTakenSeconds = submission.payload.time_taken_seconds`,
  - `timedOut = submission.payload.timed_out`.

`components/practice/SetResult.js`:
- When `band != null`, render an **estimated band** block above the raw-score
  card: large `band.toFixed(1)`, label "Estimated IELTS band", and caveat:
  *"Estimated from a short set — full-length mocks give a more reliable band."*
- When `timeTakenSeconds != null`, show a line: "Completed in mm:ss" or, if
  `timedOut`, "⏰ Ran out of time (mm:ss)".
- Raw-score card, answer review, and navigation stay as-is. The existing footer
  line ("A full band score is estimated only across a complete mock test") is
  removed when a band is shown (it would contradict the band block).

### 4.6 Seed — demo exam

`supabase/seed/seed_ielts_reading_demo.sql` (the `11111111-…` item): set
`payload.is_mock = true` and `payload.time_limit_seconds = 540` (9 min for the
6-question set). Idempotent update consistent with existing seed style.

## 5. Error handling / edge cases

- `total = 0` (no questions) → band `null`, no band block.
- Perfect score on a short set → `equiv40 = 40` → band 9.0 (acceptable; the
  caveat communicates the coarseness).
- Untimed item → no timer, no band, identical to today.
- Timer drift / tab backgrounded → countdown is derived from `Date.now()` each
  tick (not by decrementing a counter), so it stays accurate after a sleep.
- Submitting before expiry → `timed_out = false`, `time_taken_seconds` recorded.
- Band present but submission lacks time fields (older mock submissions) → time
  line omitted; band still shows.

## 6. Testing

- `lib/ielts/__tests__/banding.test.js` (new): table boundaries (each threshold
  and threshold−1), scaling for total ≠ 40 (e.g. 6, 13, 40), both variants,
  `total = 0 → null`, clamp at perfect and zero, unknown variant → academic.
- Extend `lib/grading/__tests__/deterministic.test.js`: `band_overall` (number)
  + `feedback.band_variant` present for an `is_mock` item; `band_overall: null`
  and no `band_variant` for a drill.
- QuestionSetRunner timer logic: if a pure helper is extracted
  (`formatClock(seconds)` and/or `computeRemaining(startedAt, limit, now)`),
  unit-test it; full component timing behaviour verified manually.
- Regression: existing reading/grading suites stay green.

## 7. File-by-file change list

| File | Change |
|---|---|
| `lib/ielts/banding.js` | **new** — `estimateReadingBand` + tables |
| `lib/grading/deterministic.js` | set `band_overall` (+ `feedback.band_variant`) for mocks; update header comment |
| `components/practice/QuestionSetRunner.js` | `timeLimitSeconds` prop, countdown, warn+lock, time fields in payload |
| `app/practice/reading/[itemId]/page.js` | derive + pass `timeLimitSeconds` |
| `app/practice/reading/[itemId]/result/[submissionId]/page.js` | pass band + time props |
| `components/practice/SetResult.js` | band block + time line; drop stale footer when band shown |
| `supabase/seed/seed_ielts_reading_demo.sql` | `is_mock` + `time_limit_seconds` on demo exam |
| `lib/ielts/__tests__/banding.test.js` | **new** tests |
| `lib/grading/__tests__/deterministic.test.js` | band presence/absence tests |

## 8. Out of scope

Full-length mock assembly, long-test UX, band calibration, General Training
*content* (the helper supports the variant; no GT items are added here),
listening bands. All tracked in the roadmap.
