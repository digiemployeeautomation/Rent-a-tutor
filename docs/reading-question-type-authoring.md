# Reading Question-Type Authoring Guide

How to author IELTS Reading content for this platform. Every question type maps
to one of three interaction **primitives** (`lib/ielts/question-types.js`); you
only ever write three answer-key shapes. Live examples: the golden drills at
`/practice/reading/<uuid>` (see the table at the end).

## Columns (per `practice_questions`)

- `question_type` — one of the types below (drives the UI label + instruction).
- `options` — client-readable. Select types: `{ "choices": [{ "value", "label" }] }`
  (+ `"max"` for `mcq_multi`). Text types: `{ "word_limit": N }`.
- `answer_key` — **server-only**. Shapes below.
- `explanation` — server-only: `{ "rationale", "evidence", "distractors"? }`.

## The three primitives

### single_select — pick exactly one
`answer_key`: `{ "value": "B" }`
Types: `mcq_single`, `tfng`*, `ynng`*, `matching_headings`, `matching_information`,
`matching_features`, `matching_sentence_endings`, `summary_completion_wordlist`.
(*`tfng`/`ynng` need no `options` — the UI supplies TRUE/FALSE/NOT GIVEN etc.)

```jsonc
// options
{ "choices": [
  { "value": "A", "label": "A. reduced water use" },
  { "value": "B", "label": "B. lower electricity bills" }
] }
// answer_key
{ "value": "A" }
```

### multi_select — pick N (e.g. "choose TWO")
Type: `mcq_multi`. Set `options.max` = the number to choose, and
`answer_key.required` to the same number. One mark per correct selection; picks
beyond `required` earn nothing.

```jsonc
// options
{ "max": 2, "choices": [ { "value": "A", "label": "A. …" } ] }
// answer_key
{ "values": ["A", "D"], "required": 2 }
```

### text_fill — type a word/number/phrase
Types: `sentence_completion`, `summary_completion`, `note_completion`,
`table_completion`, `flowchart_completion`, `diagram_label`, `short_answer`.
Spelling matters (IELTS penalises misspellings) — list every accepted spelling,
including British/American variants. `word_limit` is enforced by the grader.

```jsonc
// options
{ "word_limit": 2 }
// answer_key
{ "accepted": ["flavour", "flavor"], "word_limit": 2 }
```

## Conventions

- **Paragraph labels:** start each passage paragraph with `A.`, `B.`, `C.`… so
  `matching_information` / `matching_headings` can reference them.
- **Shared option banks** (matching_features / sentence_endings / wordlist):
  repeat the full `choices` list in every question that uses the bank — the UI
  renders choices per question (a render-once bank is a future enhancement).
- **Table / flow-chart / diagram completion (MVP-flat):** there is no visual
  grid/image renderer yet. Put the structure as **preformatted text** in
  `payload.passage` with `[ 1 ]`, `[ 2 ]` gap markers, and make each gap a
  numbered `text_fill` question whose prompt names the gap. Ensure every answer
  is derivable from the passage prose. A faithful stimulus renderer is a later
  roadmap phase.
- **Explanations:** always give `rationale` + `evidence` (a short quote/locator
  from the passage). Add `distractors` for select types to explain wrong options.

## Promoting a drill into a learning-path module (CAO)

A golden drill is a standalone `practice_item`. To make it a step in
`/learn/reading`, add a `skill_lessons` row: `slug`, `title`, `summary`,
`section = 'reading'`, `slides_data` (the lesson), `drill_item_id` = the drill's
id, `position`, `status = 'published'`. The hub orders by `position` and the
capstone exam unlocks once every module's drill is graded.

## Live examples (golden drills)

| Drill | UUID | Types |
|---|---|---|
| MCQ (multi) | `88888888-8888-4888-8888-888888888888` | `mcq_multi` |
| Matching | `99999999-9999-4999-8999-999999999999` | `matching_information`, `matching_features`, `matching_sentence_endings` |
| Completion (text) | `aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa` | `summary_completion`, `summary_completion_wordlist`, `note_completion`, `short_answer` |
| Completion (structured) | `bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb` | `table_completion`, `flowchart_completion`, `diagram_label` |
