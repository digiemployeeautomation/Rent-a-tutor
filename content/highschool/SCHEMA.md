# High-school lesson file format

One lesson = one JSON file at `content/highschool/<subject>/<order>-<slug>.json`.
Validate with `node scripts/validate-lessons.mjs` (must print OK for every file).

```jsonc
{
  "id": "mathematics-fractions-1",        // unique: <subject>-<topicSlug>-<order>
  "subject": "mathematics",               // folder name
  "form": 1,                              // 1-4
  "term": 1,                              // 1-3
  "topic": "Fractions",
  "topicSlug": "fractions",
  "order": 1,                             // position inside the topic (1,2,3)
  "title": "What is a fraction?",
  "summary": "One plain sentence saying what the learner will be able to do.",
  "minutes": 15,                          // honest estimate, 10-25
  "objectives": ["Identify the numerator and denominator", "..."],   // 3-4, each starts with a verb
  "sections": [ /* 9-14 items, see below, in teaching order */ ],
  "quiz": [ /* exactly 8 questions */ ],
  "glossary": [ { "term": "Numerator", "definition": "..." } ]       // 4-8 terms
}
```

## Section types (the `sections` array)

- `{"type":"explain","title":"...","body":"1-3 short paragraphs separated by \n\n","bullets":["optional"],"svg":"optional inline <svg>"}`
- `{"type":"example","title":"Worked example: ...","problem":"...","steps":["Step ...","..."],"answer":"..."}`
- `{"type":"check","question":"...","options":["a","b","c","d"],"answer":2,"explanation":"why the right answer is right AND why a tempting wrong one is wrong"}`  (answer = 0-based index; 3 or 4 options)
- `{"type":"mistake","title":"Common mistake: ...","body":"what students do wrong and how to avoid it"}`
- `{"type":"summary","title":"Key points","bullets":["4-6 bullets"]}`  (always the LAST section)

Rules: start with an `explain` that hooks the topic with an everyday Zambian
context (kwacha, nshima, minibus, Lusaka/Copperbelt/Kafue, maize, mobile money...).
Include at least 2 `example`, at least 2 `check` (spread through the lesson, never
two in a row), at least 1 `mistake`, and exactly 1 `summary` at the end.

## Quiz

`{"question":"...","options":["...","...","...","..."],"answer":0,"explanation":"..."}`
Exactly 4 options, 0-based `answer`. Vary the position of the right answer. Mix
recall (about 3), application (about 3) and exam-style reasoning (about 2). Every
explanation teaches — never just "B is correct". Do NOT prefix options with "A)", "B)".

## SVG diagrams

2-3 per lesson where a picture genuinely helps. Requirements:
`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 260" role="img" aria-label="...">`
(height may differ), no scripts, no external images/fonts, no `width`/`height`
attributes on the root, text `font-family="system-ui, sans-serif"` (the page swaps in the app font) at
font-size >= 13, labels must not overlap shapes or each other and must stay
inside the viewBox. Palette only: ink `#0F1713`, grey `#58635D`, light `#D8DEDA`,
green `#1A6B48`, pale green `#DFF3E7`, copper `#B05C1F`, yellow `#E5B30B`, red
`#CC2E2C`, white `#FFFFFF`. Keep them simple and correct — a clean labelled
diagram beats an ambitious messy one.

## Writing style

Audience: Zambian secondary students (age 13-18), many reading in a second
language on a phone. Short sentences. British spelling. Define every technical
word the first time. Plain text only — no Markdown, no LaTeX; write fractions
as 3/4, powers as cm³ or 10², multiplication as ×, division as ÷. Facts must be
correct and consistent with the Zambian O-Level (ECZ) syllabus.
