# Reading Module — CAO Test Script

For the Chief Academic Officer to review the Reading module end-to-end. Assumes
the DB is seeded per `docs/reading-readiness-runbook.md` and you are signed in as
a student with a completed onboarding profile. Log issues in the table at the end.

## What's in scope right now
- Teach-then-test path: **5 modules** (TFNG → YNNG → Sentence completion →
  Multiple choice → Matching headings) → **gated capstone exam** (timed + banded).
- **All 16 question types** demonstrated (5 in the path + 11 via 4 golden drills).
- Per-question **explanations** on every results page.
- Authoring reference: `docs/reading-question-type-authoring.md`.

## Known caveats (by design — don't log as bugs)
- **Authoring is SQL-only** (no admin UI yet — Phase 5). Use the SQL editor + the
  authoring guide.
- **Table / flow-chart / diagram render flat** (preformatted text + numbered
  gaps), not as visual grids/images — MVP; faithful rendering is a later phase.
- **Academic only** (no General Training content yet).
- **No progress/mastery/resume yet** (that's Phase 4, not built) — lesson views
  aren't saved, lessons don't resume, and the dashboard has no mastery card.

## A. The learning path (`/learn/reading`)
1. Open `/learn/reading` → expect 5 modules in order, each "Start", and a
   **locked** "Final exam" card.
2. Open **Module 1 (TFNG)** → read the lesson slides (Prev/Next) → click
   **"Now try it →"**.
3. In the drill, answer the questions → **Submit** → on results, confirm:
   - a score out of total,
   - each question shows your answer, the correct answer, and an **explanation**
     (Why + In the text),
   - links back to the path / next module.
4. Repeat for **Modules 2–5**. Check each type reads well and the answer key +
   explanation are correct:
   - YNNG (Yes/No/Not Given), Sentence completion (typed, word limit),
     Multiple choice (single), Matching headings.

## B. The capstone exam (timed + banded)
5. After all 5 drills are graded, the **Final exam** card unlocks. Open it.
6. Confirm a **countdown** (≈09:00) ticking in the header.
7. Let it run out (or just submit) → at zero, expect a **"Time's up"** banner,
   inputs lock, **Submit still works**.
8. Submit → results show an **Estimated IELTS band** card (Academic) +
   "Completed in mm:ss", above the raw score, plus per-question explanations.

## C. Golden drills — every remaining question type
Open each URL and confirm each question renders with the right control, grades
correctly, and shows an explanation:
9. `/practice/reading/88888888-8888-4888-8888-888888888888` — **mcq_multi**
   ("choose TWO"): selecting a 3rd option is blocked; marks per correct pick.
10. `/practice/reading/99999999-9999-4999-8999-999999999999` — **matching**
    (information / features / sentence-endings): single-choice each.
11. `/practice/reading/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa` — **completion
    (text)**: summary, word-list (single-choice), note, short-answer; word limits
    enforced; British/American spelling accepted where relevant.
12. `/practice/reading/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb` — **completion
    (structured, flat)**: the table/flow-chart/diagram show as preformatted text
    with `[ N ]` gaps; each numbered gap grades against the passage word.

## D. Authoring review
13. Skim `docs/reading-question-type-authoring.md` — confirm the `options` /
    `answer_key` / `explanation` shapes are clear enough to author from.
14. (Optional) author one new question of any type via SQL against a golden drill
    and confirm it renders + grades.

## E. Academic content review (the CAO's core pass)
For every passage/question across the path + golden drills, check:
- passage difficulty/length is appropriate for the target band,
- the question is unambiguous and the **keyed answer is the only correct one**,
- accepted spellings for gap-fills are complete (incl. variants),
- explanations are accurate and genuinely teach the strategy.

## Issue log
| # | Where (URL / file) | What's wrong | Severity | Notes |
|---|---|---|---|---|
|   |   |   |   |   |
