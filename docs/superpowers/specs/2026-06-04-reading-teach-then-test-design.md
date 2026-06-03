# Reading — Teach-then-Test Design

**Date:** 2026-06-04
**Status:** Draft for review
**References:**
- Roadmap: `docs/superpowers/plans/2026-06-01-ielts-full-build-roadmap.md` (Wave 2 Reading shipped; this refines it)
- IELTS pivot spec: `docs/superpowers/specs/2026-05-20-ielts-pivot-design.md` (§ "same engine, IELTS content — strategies, vocab, model answers, common mistakes")
- Current Reading module: `app/practice/reading/**`, `components/practice/QuestionSetRunner.js`, `SetResult.js`, `lib/grading/deterministic.js`, `lib/ielts/answer-grading.js`, `question-types.js`

## 1. Goal & motivation

The Reading module today is an accurate **assessment** engine but not a **teaching** one: it marks answers and shows the correct answer, but never explains *why*, teaches *technique*, or builds a skill progressively. (See the effectiveness review: no strategy content exists anywhere in the repo; results show "correct answer: X" with no rationale.)

This design makes Reading **teach as well as test**, via an interleaved learning path:

> **Lesson → Test → Lesson → Test → … (per question type) → final Exam.**

Each module teaches one IELTS question type's strategy, then immediately drills it with explained feedback. Only after every module is complete does the capstone **exam** (a full mixed reading set) open.

This build is a **vertical slice**: it builds the engine + the content format and ships **one** complete worked module (True / False / Not Given) plus the exam link. Bulk lesson authoring for the other types is a follow-up owned by the Chief Academic Officer (Kripa).

## 2. The learning journey

```
  Module 1        Module 2        Module N            Capstone
 ┌─────────┐     ┌─────────┐     ┌─────────┐         ┌──────────────┐
 │ Lesson  │     │ Lesson  │     │ Lesson  │         │    EXAM      │
 │   ↓     │ ──▶ │   ↓     │ ──▶ │   ↓     │  ──...──▶│ mixed reading│
 │ Test    │     │ Test    │     │ Test    │         │ set (gated   │
 │ (type A)│     │ (type B)│     │ (type N)│         │ until all ✓) │
 └─────────┘     └─────────┘     └─────────┘         └──────────────┘
```

- An **ordered sequence of modules**; each module is **Lesson → Test** for one question type.
- The **final exam** (the existing mixed reading set) is **gated** — it opens only once **all modules are complete**.
- **Completion signal (no new table):** a module is complete when its drill `practice_item` has a `graded` submission for the user. The hub reads submissions to show ✓ per module and to unlock the exam. Lesson-viewed is not separately persisted yet (reaching the Test implies the Lesson was shown).

## 3. Architecture & reuse

| Stage | Mechanism | New or reused |
|---|---|---|
| **Learn** | `skill_lessons` row rendered via `SlideViewer` | NEW table; reused renderer |
| **Test** | single-question-type `practice_item` (`reading_set`) → `QuestionSetRunner` → deterministic grader → `SetResult`, now with explanations | REUSED + explanation upgrade |
| **Exam** | existing **mixed** `reading_set` (full-length / timed / banded is a later enhancement) | REUSED |
| **Path** | `reading-modules` registry (ordered) + `/learn/reading` hub | NEW |

New surface is deliberately small: **one table** (`skill_lessons`), **one column** (`practice_questions.explanation`), **two routes** (hub + lesson), a **registry module**, and an **explanation upgrade** to grader + results.

## 4. Data model

### 4.1 New table `skill_lessons`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK default gen_random_uuid() | |
| `section` | text NOT NULL CHECK in ('reading','listening','writing','speaking') | `'reading'` for now; extensible |
| `question_type` | text NULL | the type taught (e.g. `'tfng'`), matching the question-type registry keys; NULL = cross-cutting skill lesson (skimming, timing) |
| `slug` | text NOT NULL UNIQUE | stable URL id, e.g. `reading-tfng` |
| `title` | text NOT NULL | e.g. "True / False / Not Given" |
| `summary` | text | one-line "what you'll learn" |
| `slides_data` | jsonb NOT NULL | lesson blocks (§5) |
| `drill_item_id` | uuid NULL REFERENCES practice_items(id) ON DELETE SET NULL | the Test for this module |
| `position` | int NOT NULL DEFAULT 0 | order in the path |
| `status` | text NOT NULL DEFAULT 'draft' CHECK in ('draft','published') | mirrors `practice_items` |
| `created_at` | timestamptz NOT NULL DEFAULT now() | |
| `published_at` | timestamptz NULL | |

Indexes: `(section, status, position)`, unique `(slug)`.

**RLS** (mirrors `practice_items`): enable RLS; authenticated users `SELECT` rows where `status='published'`; writes happen via the **service role** (no `profiles` dependency — `profiles` was deprecated in the pivot).

### 4.2 New column `practice_questions.explanation`

- `explanation jsonb NULL`.
- Shape: `{ "rationale": "...", "evidence": "Paragraph C: '…'", "distractors": { "A": "why it's wrong" } }` (all fields optional except `rationale`).
- **Server-only**, like `answer_key` (migration 006). Migration 008 must `REVOKE SELECT (explanation) ON practice_questions FROM anon, authenticated;` so it cannot be read by the browser (it would leak answers pre-submission). The deterministic grader reads it via the service role and returns it inside `per_question` feedback — so it surfaces **only on the results page after submitting**.

### 4.3 Migration 008

Carries the `skill_lessons` table (+ RLS, indexes) and the `practice_questions.explanation` column (+ the column-level REVOKE). Delivered as a `008_*.sql` file to run **manually** in the Supabase SQL editor (the app's project is not on the MCP-connected account).

## 5. Content format

### 5.1 `slides_data` shape

An array of tagged blocks (reusing the existing block-tag taxonomy). `SlideViewer` already renders `title` / `content` / `bullets` / `image`; the only addition is an optional `answer` callout (a highlighted "Answer: … because …" box) for worked-example slides.

```json
{
  "blocks": [
    { "tag": "foundational",  "title": "...", "content": "...", "bullets": ["..."] },
    { "tag": "core-full",     "title": "...", "content": "...", "bullets": ["..."] },
    { "tag": "worked-medium", "title": "...", "content": "<excerpt>", "bullets": ["step…"], "answer": "NOT GIVEN — because…" },
    { "tag": "common-mistakes","title": "...", "bullets": ["..."] },
    { "tag": "recap",         "title": "...", "bullets": ["..."] }
  ]
}
```

Block tags reuse the existing vocabulary (`foundational`, `core-full`, `core-summary`, `worked-easy|medium|hard`, `practice`, `common-mistakes`, `recap`). The renderer ignores the tag for now (renders blocks in array order); tags are stored so track-aware ordering can be added later via the existing `track-rules` logic.

### 5.2 Worked example — the True / False / Not Given lesson

Ships as one `skill_lessons` row (`slug='reading-tfng'`). Blocks:

1. **`foundational` — "What this question asks":** TRUE = the statement *agrees* with the passage; FALSE = the statement *contradicts* the passage; NOT GIVEN = the passage *doesn't say*. The whole skill is separating "contradicted" (False) from "not mentioned" (Not Given).
2. **`core-full` — "A 4-step method":** (1) read the statement, underline keywords; (2) answers come in passage order — scan forward; (3) find the matching part, read closely; (4) decide: agrees → True, contradicts → False, can't tell → Not Given.
3. **`worked-medium` — "Worked example":** a 3-sentence excerpt + statement *"The festival has been held every year since 1990."* → reasoning bullets (passage says it *began* in 1990 but never says *every year*) → answer callout: **"NOT GIVEN — the passage gives the start year but never claims it ran every year."**
4. **`common-mistakes` — "The traps":** choosing **False** when nothing contradicts (absence of info = Not Given); using **outside knowledge**; ignoring **qualifiers** (*some/all/always/may*).
5. **`recap` — "Quick checklist":** keywords → find it in order → compare only to what's written → contradicted = False, silent = Not Given.

### 5.3 The TFNG drill

One `practice_item` (`type='reading_set'`, `sub_skill='reading'`) of ~5 `tfng` questions over a short passage, each `practice_question` carrying a real `explanation` (`rationale` + `evidence`, optional `distractors`). Linked from the lesson via `skill_lessons.drill_item_id`.

Additionally, the existing demo mixed reading set gets `explanation` added to its questions, so the **exam** stage also teaches.

## 6. `reading-modules` registry

`lib/ielts/reading-modules.js` — config + pure helpers (unit-testable, no I/O). The **modules themselves are loaded from `skill_lessons` at request time** (ordered by `position`) and passed into the helpers; the registry holds only fixed config and the logic.

- `READING_EXAM_ITEM_ID` — the `practice_item` id used as the capstone exam. For this build this is the existing demo mixed reading set (`11111111-1111-4111-8111-111111111111`).
- `nextModule(modules, currentDrillItemId)` → the next module after the one whose `drill_item_id` matches, or null.
- `moduleForDrill(modules, drillItemId)` → the module a given practice item is the drill for, or null.
- `isExamUnlocked(modules, completedDrillIds)` → boolean (true when every module with a `drill_item_id` is in `completedDrillIds`).

The `/learn/reading` hub loads published `skill_lessons` (ordered) + the user's `graded` submissions for the drill ids, then uses these helpers to render status and gate the exam.

## 7. Routing & flow

| Route | New? | Behaviour |
|---|---|---|
| `/learn/reading` | NEW (server) | Path hub: lists modules (Lesson → Test) with ▢/✓ status from submissions; shows the gated Exam card. |
| `/learn/reading/[slug]` | NEW (server) | Lesson: loads published `skill_lessons` by slug, renders `slides_data` via `SlideViewer`; CTA "Now try it →" links to the Test (`/practice/reading/<drill_item_id>`). |
| `/practice/reading/[itemId]` | REUSED | Test (drill) and Exam (mixed set) — existing flow; `SetResult` now shows explanations. |

- **Results path nav:** when the graded item is a known drill (via `moduleForDrill`), `SetResult`/result page shows "← Back to Reading path" and "Next module →".
- **Gating:** a module is complete when its drill has a `graded` submission; the Exam card unlocks when `isExamUnlocked` is true, else shows "Complete all modules to unlock."
- **Entry point:** a "Learn Reading — step by step" link on `/practice`.
- **Error/edge handling** (consistent with existing pages): unauthenticated → redirect to login; lesson slug missing/unpublished → not-found UI; module with null `drill_item_id` → disabled "coming soon" card; locked exam → disabled with unlock hint.

## 8. Scope

### In scope (this build)
1. Migration 008: `skill_lessons` + `practice_questions.explanation` (+ RLS, indexes, column REVOKE). Delivered as manual SQL.
2. Grader explanation passthrough: `deterministic.js` selects `explanation`; `answer-grading.js` includes it in each `per_question`.
3. `SetResult` renders explanation (rationale, evidence, distractor notes).
4. `reading-modules` registry + pure helpers.
5. Lesson rendering via `SlideViewer` (+ optional `answer` callout block).
6. Routes `/learn/reading` and `/learn/reading/[slug]`.
7. Result-page path nav (back to path / next module) for known drills.
8. "Learn Reading" entry point on `/practice`.
9. Seeds: the TFNG lesson, the TFNG drill (with explanations), and explanations added to the existing demo reading set.
10. Tests (§9) + clean build.

### Out of scope (follow-ups)
- Bulk lessons for the other 10 types + cross-cutting skills (Kripa authors against the TFNG template).
- Real progress tracking (lesson-viewed persistence, per-type mastery, resume) + richer unlock UX.
- Track-aware lesson variants + reconciling legacy track names (`guided/balanced/exam_ready` ↔ `foundation/practice/mock`).
- Full-length, timed, **banded** exam (overlaps the Wave-4 mock assembler).
- Admin authoring UI for lessons (Wave-3 content pipeline).

## 9. Testing strategy

- **Unit (Vitest):** explanation passthrough in `answer-grading` (per_question carries `explanation`); `reading-modules` helpers (`nextModule`, `moduleForDrill`, `isExamUnlocked` — pure). Existing 73 tests stay green.
- **Build:** `npm run build` clean.
- **Manual QA** (after migration + seeds applied): `/practice` → `/learn/reading` → TFNG lesson → "try it" → drill → results **show explanations** → exam **unlocks** → exam set. Plus verify `explanation` is **absent** from the browser payload before submitting.
- **Honest limitation:** gating and DB-backed flows can't be fully unit-tested without the database; those rely on manual QA, not automated coverage.

## 10. Content ownership

The TFNG lesson + drill explanations are authored in this build as the **format template**. Kripa (CAO) reviews them and authors the remaining question-type lessons + cross-cutting skills against the same `slides_data` / `explanation` shapes.
