# Phase 2 — Reading Question-Type Coverage (Design Spec)

**Date:** 2026-06-20
**Phase:** 2 of the [Reading Module Completion Roadmap](../plans/2026-06-20-reading-module-completion-roadmap.md)
**Status:** Approved design; implementation plan to follow.

## 1. Overview

Produce one verified, end-to-end example of every remaining IELTS Reading
question type — proving the engine renders, grades, and explains each — plus a
precise authoring template the Chief Academic Officer (CAO) can replicate for
bulk content. Academic only. **No new engine code:** every remaining type already
maps to an existing interaction primitive in `lib/ielts/question-types.js`.

## 2. Goals / Non-goals

**Goals**
- A working golden drill for each of the 11 remaining question types, with
  answer keys and per-question explanations.
- First real exercise of the `multi_select` primitive (`MultiSelect` +
  `gradeMultiSelect`), via `mcq_multi`.
- A single authoring-reference doc giving the exact `options` / `answer_key` /
  `explanation` JSON for every type, plus content conventions.

**Non-goals (this phase)**
- Faithful rendering of table / flow-chart / diagram completion (a static
  stimulus renderer) — its own later phase. This phase uses **MVP-flat**
  rendering (layout described in preformatted text; gaps are numbered inputs).
- Lessons + path wiring (`skill_lessons` rows, `/learn/reading` placement) —
  owned by the CAO as a parallel content track.
- Bulk content (multiple passages per type), difficulty levels, General Training.
- A seed/shape validator (belongs to the Phase 5 content pipeline).

## 3. Engine confirmation (why no code is needed)

`lib/ielts/question-types.js` already maps all 16 types to 3 primitives; the
renderer (`QuestionSetRunner` → `SingleSelect` / `MultiSelect` / `TextFill`) and
the grader (`lib/ielts/answer-grading.js`) already support all three. This phase
only adds **data** (seed SQL) plus a **doc**. The 5 existing module seeds (tfng,
ynng, sentence_completion, mcq_single, matching_headings) are the precedent.

## 4. Data shapes per type

Column conventions (migrations 006/007): `options` is client-readable;
`answer_key` and `explanation` are server-only. Shapes:

| Type | Primitive | `options` | `answer_key` |
|---|---|---|---|
| `mcq_multi` | multi_select | `{ "choices": [{value,label}…], "max": N }` | `{ "values": ["A","C"], "required": N }` |
| `matching_information` | single_select | `{ "choices": [{value:"A",label:"A"}… paragraphs] }` | `{ "value": "C" }` |
| `matching_features` | single_select | `{ "choices": [{value,label}… feature bank] }` | `{ "value": "B" }` |
| `matching_sentence_endings` | single_select | `{ "choices": [{value,label}… endings] }` | `{ "value": "D" }` |
| `summary_completion_wordlist` | single_select | `{ "choices": [{value,label}… word list] }` | `{ "value": "F" }` |
| `summary_completion` | text_fill | `{ "word_limit": N }` | `{ "accepted": […], "word_limit": N }` |
| `note_completion` | text_fill | `{ "word_limit": N }` | `{ "accepted": […], "word_limit": N }` |
| `short_answer` | text_fill | `{ "word_limit": N }` | `{ "accepted": […], "word_limit": N }` |
| `table_completion` | text_fill (flat) | `{ "word_limit": N }` | `{ "accepted": […], "word_limit": N }` |
| `flowchart_completion` | text_fill (flat) | `{ "word_limit": N }` | `{ "accepted": […], "word_limit": N }` |
| `diagram_label` | text_fill (flat) | `{ "word_limit": N }` | `{ "accepted": […], "word_limit": N }` |

`explanation` (all types) follows the existing shape:
`{ "rationale": "…", "evidence": "…", "distractors": { "A": "…" } }` (distractors
optional, used mainly for select types).

Notes:
- **`mcq_multi` grading** (`gradeMultiSelect`): one mark per correct selection up
  to `required`; selections beyond `required` earn nothing. `options.max` should
  equal `required` so the UI caps selection at the same number.
- **Shared option banks** (matching_features / sentence_endings / wordlist): the
  same `choices` list is repeated in each question's `options` for now (the
  renderer shows choices per question). A render-once shared bank is a future
  nicety, not in scope.
- **Paragraph labels:** passages use `A.`, `B.`, `C.`… paragraph markers (as the
  existing demo set does) so matching_information/headings can reference them.

## 5. MVP-flat convention for structured completion

`table_completion`, `flowchart_completion`, `diagram_label` use `text_fill`. Since
there is no grid/flow-chart/image renderer yet:
- The visual structure is provided as **preformatted text** in `payload.passage`
  (or a `payload.stimulus` string), e.g. an ASCII/markdown table or a
  `Step 1 → Step 2 → …` flow, with each gap marked like `[ 1 ]`, `[ 2 ]`.
- Each gap is a numbered `text_fill` question whose `prompt` references the gap
  (e.g. "Gap 1 (see the table above)") so the student knows which blank to fill.
- This grades correctly and is honest about the gap; faithful rendering is a
  documented later phase.

## 6. Golden drills (4 seeds)

Each is a published `practice_item` of type `reading_set` over one Academic
passage, with `practice_questions` carrying `answer_key` + `explanation`. Fixed
UUIDs make them idempotent (DELETE-then-INSERT) and reachable for verification at
`/practice/reading/<uuid>`. They are **standalone** — not `skill_lessons`, not in
`/learn/reading`, and they do not affect the capstone exam unlock.

| Seed file | UUID | Types covered |
|---|---|---|
| `seed_ielts_reading_mcq_multi_drill.sql` | `88888888-8888-4888-8888-888888888888` | `mcq_multi` |
| `seed_ielts_reading_matching_family_drill.sql` | `99999999-9999-4999-8999-999999999999` | `matching_information`, `matching_features`, `matching_sentence_endings` |
| `seed_ielts_reading_completion_text_drill.sql` | `aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa` | `summary_completion`, `summary_completion_wordlist`, `note_completion`, `short_answer` |
| `seed_ielts_reading_completion_structured_drill.sql` | `bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb` | `table_completion`, `flowchart_completion`, `diagram_label` |

Each drill: `variant = 'academic'`, `status = 'published'`, `sub_skill = 'reading'`,
a `payload.title` + `payload.passage` (with paragraph labels; the structured drill
also carries a preformatted stimulus per §5), and 3–5 questions of the listed
type(s), each with a rationale + evidence explanation. The seeds follow the exact
style of `supabase/seed/seed_ielts_reading_*_lesson.sql` (jsonb_build_object,
leading DELETE on the fixed id).

## 7. Authoring template doc

`docs/reading-question-type-authoring.md` — the single source of truth for content
authors. Contains, for each of the 16 types (5 existing + 11 new):
- the `question_type` string and which primitive it uses,
- a copy-paste `options` example, `answer_key` example, and `explanation` example,
- the conventions from §4–§5 (paragraph labels; shared option banks; MVP-flat
  table/flow-chart/diagram; word-limit handling),
- a pointer to the 4 golden drills as live examples,
- a short "how to promote a drill into a path module" note (add a `skill_lessons`
  row with a `slug`, `position`, `slides_data`, and `drill_item_id`) for the CAO.

## 8. Verification

No engine code changes, so no new unit tests. The existing suite must stay green
(`npm test`). Functional verification is **manual** (seeds applied to the DB by
the user, since Supabase is not MCP-connected):

1. Apply the 4 seed files in the Supabase SQL editor.
2. Open each drill at `/practice/reading/<uuid>` and confirm:
   - every question renders with the correct primitive and type label,
   - `mcq_multi` caps selection at `max` and grades per-correct-selection,
   - select types grade exactly; text_fill enforces the word limit,
   - the structured drill shows its preformatted stimulus and numbered gaps,
   - results show the per-question explanation (rationale + evidence).
3. Confirm the capstone exam unlock is unaffected (these drills are not modules).

The plan will include this as an explicit checklist.

## 9. File list

| File | Change |
|---|---|
| `supabase/seed/seed_ielts_reading_mcq_multi_drill.sql` | **new** golden drill |
| `supabase/seed/seed_ielts_reading_matching_family_drill.sql` | **new** golden drill |
| `supabase/seed/seed_ielts_reading_completion_text_drill.sql` | **new** golden drill |
| `supabase/seed/seed_ielts_reading_completion_structured_drill.sql` | **new** golden drill (MVP-flat) |
| `docs/reading-question-type-authoring.md` | **new** authoring template |

## 10. Out of scope

Faithful table/flow-chart/diagram stimulus rendering; lessons + path wiring;
bulk content; difficulty levels; General Training; a seed-shape validator.
