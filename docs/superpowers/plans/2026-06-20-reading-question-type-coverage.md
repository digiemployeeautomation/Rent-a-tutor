# Reading Question-Type Coverage — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four family-grouped golden reading drills (seed SQL) covering the 11 remaining IELTS question types, plus one authoring-template doc — proving the engine handles every type and giving the CAO a copy-paste reference.

**Architecture:** Pure content. No engine code: every type already maps to an existing primitive (`SingleSelect` / `MultiSelect` / `TextFill`) and grader. Each drill is a published `practice_item` (type `reading_set`) over one Academic passage with `practice_questions` carrying `answer_key` + `explanation`, following the exact style of `supabase/seed/seed_ielts_reading_demo.sql`. Drills are standalone (fixed UUIDs, not `skill_lessons`) so the capstone unlock is untouched.

**Tech Stack:** PostgreSQL seed SQL (Supabase), Markdown. Seeds are applied to the DB by the user (Supabase not MCP-connected). Vitest suite must stay green (no code changes).

**Spec:** `docs/superpowers/specs/2026-06-20-reading-question-type-coverage-design.md`

**Commit convention:** end every commit message with
`Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>` (omitted below for brevity).

**Verification note:** these are SQL content files, not unit-tested code. Each task's "test" is a structural sanity check (the embedded `jsonb_build_object(...)` argument lists have even key/value counts and the file parses as one statement set). Functional correctness is verified manually in Task 6 after the user applies the seeds.

---

### Task 1: `mcq_multi` golden drill

**Files:**
- Create: `supabase/seed/seed_ielts_reading_mcq_multi_drill.sql`

- [ ] **Step 1: Create the seed file with this exact content**

```sql
-- ============================================================
-- Golden drill: mcq_multi (multiple choice, choose several).
-- First real exercise of the multi_select primitive + gradeMultiSelect.
-- options: { choices:[{value,label}], max:N }; answer_key: { values:[...], required:N }.
-- Idempotent via fixed item UUID + leading DELETE (ON DELETE CASCADE).
-- ============================================================

DELETE FROM practice_items
WHERE id = '88888888-8888-4888-8888-888888888888';

INSERT INTO practice_items (
  id, type, sub_skill, variant, difficulty_band, criterion_tags, payload, status,
  generator_version, published_at
) VALUES (
  '88888888-8888-4888-8888-888888888888',
  'reading_set',
  'reading',
  'academic',
  6.5,
  '["reading"]'::jsonb,
  jsonb_build_object(
    'title', 'Vertical farming',
    'passage',
      'A. Vertical farms grow crops in stacked layers inside controlled buildings, often in the middle of cities. ' ||
      'Because the plants are kept indoors under LED lighting, they can be grown all year round, whatever the weather outside. ' ||
      E'\n\n' ||
      'B. Supporters point to several benefits. The farms use up to 95 per cent less water than ordinary fields, because the water is recycled rather than lost to the soil. ' ||
      'They also need no pesticides, since pests are kept out of the sealed buildings, and crops can be harvested close to where people live, cutting transport costs. ' ||
      E'\n\n' ||
      'C. There are obstacles, however. The LED lights and climate controls consume large amounts of electricity, making running costs high. ' ||
      'The buildings are also expensive to construct, and only a limited range of crops — mainly leafy greens and herbs — currently grow well in these conditions.'
  ),
  'published',
  'seed-v1',
  now()
);

-- Q1 — mcq_multi (choose TWO)
INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key, explanation) VALUES
('88888888-8888-4888-8888-888888888888', 1, 'mcq_multi',
 'Which TWO benefits of vertical farming does the writer mention?',
 jsonb_build_object('max', 2, 'choices', jsonb_build_array(
   jsonb_build_object('value', 'A', 'label', 'A. reduced water use'),
   jsonb_build_object('value', 'B', 'label', 'B. lower electricity bills'),
   jsonb_build_object('value', 'C', 'label', 'C. a wider variety of crops'),
   jsonb_build_object('value', 'D', 'label', 'D. less need for pesticides'),
   jsonb_build_object('value', 'E', 'label', 'E. faster plant growth')
 )),
 '{"values": ["A", "D"], "required": 2}'::jsonb,
 jsonb_build_object(
   'rationale', 'Paragraph B lists using far less water and needing no pesticides as benefits.',
   'evidence', 'Paragraph B: "use up to 95 per cent less water" and "need no pesticides".',
   'distractors', jsonb_build_object(
     'B', 'Electricity costs are high, not low (paragraph C).',
     'C', 'Only a limited range of crops grows well (paragraph C).',
     'E', 'Faster growth is never mentioned.'
   )
 ));

-- Q2 — mcq_multi (choose TWO)
INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key, explanation) VALUES
('88888888-8888-4888-8888-888888888888', 2, 'mcq_multi',
 'Which TWO problems with vertical farming does the writer mention?',
 jsonb_build_object('max', 2, 'choices', jsonb_build_array(
   jsonb_build_object('value', 'A', 'label', 'A. high energy consumption'),
   jsonb_build_object('value', 'B', 'label', 'B. poor crop quality'),
   jsonb_build_object('value', 'C', 'label', 'C. expensive buildings'),
   jsonb_build_object('value', 'D', 'label', 'D. frequent pest damage'),
   jsonb_build_object('value', 'E', 'label', 'E. long transport distances')
 )),
 '{"values": ["A", "C"], "required": 2}'::jsonb,
 jsonb_build_object(
   'rationale', 'Paragraph C names high electricity use and expensive construction as obstacles.',
   'evidence', 'Paragraph C: "consume large amounts of electricity" and "expensive to construct".',
   'distractors', jsonb_build_object(
     'B', 'Crop quality is not discussed.',
     'D', 'Pests are kept out of the sealed buildings (paragraph B).',
     'E', 'Crops are harvested close to where people live (paragraph B).'
   )
 ));
```

- [ ] **Step 2: Structural sanity check**

Run: `git diff --stat --cached 2>/dev/null; ls -l supabase/seed/seed_ielts_reading_mcq_multi_drill.sql`
Confirm the file exists and that each `jsonb_build_object(...)` has an even number of comma-separated arguments (key, value pairs) and `jsonb_build_array(...)` closes cleanly. Expected: file present, ~70 lines.

- [ ] **Step 3: Commit**

```bash
git add supabase/seed/seed_ielts_reading_mcq_multi_drill.sql
git commit -m "feat(reading): golden drill — mcq_multi (first multi_select)"
```

---

### Task 2: Matching-family golden drill

**Files:**
- Create: `supabase/seed/seed_ielts_reading_matching_family_drill.sql`

Covers `matching_information`, `matching_features`, `matching_sentence_endings` over one passage.

- [ ] **Step 1: Create the seed file with this exact content**

```sql
-- ============================================================
-- Golden drill: matching family over one passage —
--   matching_information (which paragraph?), matching_features
--   (match claims to researchers), matching_sentence_endings.
-- All single_select: options { choices:[{value,label}] }, answer_key { value }.
-- The shared option bank is repeated per question (no render-once bank yet).
-- ============================================================

DELETE FROM practice_items
WHERE id = '99999999-9999-4999-8999-999999999999';

INSERT INTO practice_items (
  id, type, sub_skill, variant, difficulty_band, criterion_tags, payload, status,
  generator_version, published_at
) VALUES (
  '99999999-9999-4999-8999-999999999999',
  'reading_set',
  'reading',
  'academic',
  7.0,
  '["reading"]'::jsonb,
  jsonb_build_object(
    'title', 'Tracking animal migration',
    'passage',
      'A. Tracking how animals move across the planet was once almost impossible. Early naturalists relied on chance sightings and the reports of travellers, which gave only a rough picture. ' ||
      E'\n\n' ||
      'B. The first big advance came with metal leg rings. By placing a numbered ring on a bird''s leg and waiting for it to be found elsewhere, scientists could finally prove that individual birds travelled vast distances. ' ||
      E'\n\n' ||
      'C. Satellite tags transformed the field again. Small transmitters now send an animal''s position to orbiting satellites several times a day, revealing entire journeys in detail. ' ||
      E'\n\n' ||
      'D. Different researchers favour different methods. Dr Alvarez argues that lightweight rings remain the cheapest way to study large numbers of birds. Professor Chen insists that only satellite tags can capture the full route of a single animal. Dr Okafor focuses on chemical signatures in feathers, which show where a bird has fed. ' ||
      E'\n\n' ||
      'E. Whatever the method, the goal is the same: to map the hidden highways wildlife follows, so that these routes can be protected.'
  ),
  'published',
  'seed-v1',
  now()
);

-- Q1 — matching_information (choices = paragraphs A–E)
INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key, explanation) VALUES
('99999999-9999-4999-8999-999999999999', 1, 'matching_information',
 'Which paragraph describes how animals were studied before modern technology?',
 jsonb_build_object('choices', jsonb_build_array(
   jsonb_build_object('value', 'A', 'label', 'A'),
   jsonb_build_object('value', 'B', 'label', 'B'),
   jsonb_build_object('value', 'C', 'label', 'C'),
   jsonb_build_object('value', 'D', 'label', 'D'),
   jsonb_build_object('value', 'E', 'label', 'E')
 )),
 '{"value": "A"}'::jsonb,
 jsonb_build_object(
   'rationale', 'Paragraph A describes the pre-technology era of chance sightings and travellers'' reports.',
   'evidence', 'Paragraph A: "Early naturalists relied on chance sightings and the reports of travellers".'
 ));

-- Q2 — matching_information
INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key, explanation) VALUES
('99999999-9999-4999-8999-999999999999', 2, 'matching_information',
 'Which paragraph describes technology that reports an animal''s location automatically?',
 jsonb_build_object('choices', jsonb_build_array(
   jsonb_build_object('value', 'A', 'label', 'A'),
   jsonb_build_object('value', 'B', 'label', 'B'),
   jsonb_build_object('value', 'C', 'label', 'C'),
   jsonb_build_object('value', 'D', 'label', 'D'),
   jsonb_build_object('value', 'E', 'label', 'E')
 )),
 '{"value": "C"}'::jsonb,
 jsonb_build_object(
   'rationale', 'Paragraph C describes satellite tags that send positions to satellites several times a day.',
   'evidence', 'Paragraph C: "transmitters now send an animal''s position to orbiting satellites several times a day".'
 ));

-- Q3 — matching_features (choices = researchers)
INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key, explanation) VALUES
('99999999-9999-4999-8999-999999999999', 3, 'matching_features',
 'Who argues that rings are the cheapest way to study large numbers of birds?',
 jsonb_build_object('choices', jsonb_build_array(
   jsonb_build_object('value', 'A', 'label', 'A. Dr Alvarez'),
   jsonb_build_object('value', 'B', 'label', 'B. Professor Chen'),
   jsonb_build_object('value', 'C', 'label', 'C. Dr Okafor')
 )),
 '{"value": "A"}'::jsonb,
 jsonb_build_object(
   'rationale', 'Dr Alvarez is the researcher who champions lightweight rings for studying many birds cheaply.',
   'evidence', 'Paragraph D: "Dr Alvarez argues that lightweight rings remain the cheapest way".'
 ));

-- Q4 — matching_features
INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key, explanation) VALUES
('99999999-9999-4999-8999-999999999999', 4, 'matching_features',
 'Who says that only satellite tags can capture an animal''s full route?',
 jsonb_build_object('choices', jsonb_build_array(
   jsonb_build_object('value', 'A', 'label', 'A. Dr Alvarez'),
   jsonb_build_object('value', 'B', 'label', 'B. Professor Chen'),
   jsonb_build_object('value', 'C', 'label', 'C. Dr Okafor')
 )),
 '{"value": "B"}'::jsonb,
 jsonb_build_object(
   'rationale', 'Professor Chen is the one who insists satellite tags are needed for a full route.',
   'evidence', 'Paragraph D: "Professor Chen insists that only satellite tags can capture the full route".'
 ));

-- Q5 — matching_sentence_endings (choices = endings)
INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key, explanation) VALUES
('99999999-9999-4999-8999-999999999999', 5, 'matching_sentence_endings',
 'Complete the sentence: Metal leg rings made it possible to …',
 jsonb_build_object('choices', jsonb_build_array(
   jsonb_build_object('value', 'A', 'label', 'A. send positions to satellites every day.'),
   jsonb_build_object('value', 'B', 'label', 'B. prove that birds travel long distances.'),
   jsonb_build_object('value', 'C', 'label', 'C. analyse chemical signatures in feathers.'),
   jsonb_build_object('value', 'D', 'label', 'D. watch entire journeys unfold in detail.')
 )),
 '{"value": "B"}'::jsonb,
 jsonb_build_object(
   'rationale', 'Rings let scientists prove individual birds travelled vast distances.',
   'evidence', 'Paragraph B: "could finally prove that individual birds travelled vast distances".'
 ));

-- Q6 — matching_sentence_endings
INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key, explanation) VALUES
('99999999-9999-4999-8999-999999999999', 6, 'matching_sentence_endings',
 'Complete the sentence: Satellite transmitters allow scientists to …',
 jsonb_build_object('choices', jsonb_build_array(
   jsonb_build_object('value', 'A', 'label', 'A. send positions to satellites every day.'),
   jsonb_build_object('value', 'B', 'label', 'B. prove that birds travel long distances.'),
   jsonb_build_object('value', 'C', 'label', 'C. analyse chemical signatures in feathers.'),
   jsonb_build_object('value', 'D', 'label', 'D. watch entire journeys unfold in detail.')
 )),
 '{"value": "D"}'::jsonb,
 jsonb_build_object(
   'rationale', 'Satellite tags reveal entire journeys in detail.',
   'evidence', 'Paragraph C: "revealing entire journeys in detail".'
 ));
```

- [ ] **Step 2: Structural sanity check**

Run: `ls -l supabase/seed/seed_ielts_reading_matching_family_drill.sql`
Confirm the file exists (~95 lines) and every apostrophe inside a string is doubled (`''`) — note `bird''s`, `animal''s`, `travellers''`. Mis-escaped apostrophes are the only realistic break here.

- [ ] **Step 3: Commit**

```bash
git add supabase/seed/seed_ielts_reading_matching_family_drill.sql
git commit -m "feat(reading): golden drill — matching information/features/endings"
```

---

### Task 3: Completion-text golden drill

**Files:**
- Create: `supabase/seed/seed_ielts_reading_completion_text_drill.sql`

Covers `summary_completion`, `summary_completion_wordlist`, `note_completion`, `short_answer`.

- [ ] **Step 1: Create the seed file with this exact content**

```sql
-- ============================================================
-- Golden drill: completion (text) over one passage —
--   summary_completion (text_fill), summary_completion_wordlist
--   (single_select from a word list), note_completion (text_fill),
--   short_answer (text_fill).
-- text_fill: options { word_limit }, answer_key { accepted:[...], word_limit }.
-- ============================================================

DELETE FROM practice_items
WHERE id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

INSERT INTO practice_items (
  id, type, sub_skill, variant, difficulty_band, criterion_tags, payload, status,
  generator_version, published_at
) VALUES (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'reading_set',
  'reading',
  'academic',
  6.0,
  '["reading"]'::jsonb,
  jsonb_build_object(
    'title', 'Sleep and memory',
    'passage',
      'A. While we sleep, the brain is far from idle. During the deepest stage of sleep it replays the events of the day, strengthening the connections between the brain cells that store new memories. ' ||
      E'\n\n' ||
      'B. Researchers tested this by teaching volunteers a list of words and then either letting them sleep or keeping them awake. Those who slept remembered far more words the next morning. A short afternoon nap of around twenty minutes produced a smaller but still measurable benefit. ' ||
      E'\n\n' ||
      'C. Sleep also clears waste. A network of channels in the brain opens during sleep and flushes out proteins that build up while we are awake, which may help protect against later disease.'
  ),
  'published',
  'seed-v1',
  now()
);

-- Q1 — summary_completion (text_fill)
INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key, explanation) VALUES
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 1, 'summary_completion',
 'Complete the summary: During the deepest stage of sleep, the brain ____ the events of the day. (ONE WORD)',
 jsonb_build_object('word_limit', 1),
 '{"accepted": ["replays"], "word_limit": 1}'::jsonb,
 jsonb_build_object(
   'rationale', 'The passage uses the exact verb "replays".',
   'evidence', 'Paragraph A: "it replays the events of the day".'
 ));

-- Q2 — summary_completion (text_fill)
INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key, explanation) VALUES
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 2, 'summary_completion',
 'Complete the summary: Sleep strengthens the ____ between brain cells. (ONE WORD)',
 jsonb_build_object('word_limit', 1),
 '{"accepted": ["connections", "connection"], "word_limit": 1}'::jsonb,
 jsonb_build_object(
   'rationale', 'The passage says sleep strengthens the connections between brain cells.',
   'evidence', 'Paragraph A: "strengthening the connections between the brain cells".'
 ));

-- Q3 — summary_completion_wordlist (single_select from a word list)
INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key, explanation) VALUES
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 3, 'summary_completion_wordlist',
 'Complete the summary using the list of words: During sleep, a network of ____ opens and removes harmful proteins.',
 jsonb_build_object('choices', jsonb_build_array(
   jsonb_build_object('value', 'A', 'label', 'A. waste'),
   jsonb_build_object('value', 'B', 'label', 'B. words'),
   jsonb_build_object('value', 'C', 'label', 'C. proteins'),
   jsonb_build_object('value', 'D', 'label', 'D. disease'),
   jsonb_build_object('value', 'E', 'label', 'E. channels')
 )),
 '{"value": "E"}'::jsonb,
 jsonb_build_object(
   'rationale', 'A network of channels opens during sleep to flush out proteins.',
   'evidence', 'Paragraph C: "A network of channels in the brain opens during sleep".'
 ));

-- Q4 — note_completion (text_fill)
INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key, explanation) VALUES
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 4, 'note_completion',
 'Complete the note: Length of a helpful afternoon nap: about ____ minutes. (ONE WORD OR A NUMBER)',
 jsonb_build_object('word_limit', 1),
 '{"accepted": ["twenty", "20"], "word_limit": 1}'::jsonb,
 jsonb_build_object(
   'rationale', 'The passage gives around twenty minutes for a measurable nap benefit.',
   'evidence', 'Paragraph B: "a short afternoon nap of around twenty minutes".'
 ));

-- Q5 — short_answer (text_fill)
INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key, explanation) VALUES
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 5, 'short_answer',
 'What does the brain flush out during sleep? (NO MORE THAN TWO WORDS)',
 jsonb_build_object('word_limit', 2),
 '{"accepted": ["proteins", "waste proteins"], "word_limit": 2}'::jsonb,
 jsonb_build_object(
   'rationale', 'During sleep the brain flushes out proteins that build up while awake.',
   'evidence', 'Paragraph C: "flushes out proteins that build up while we are awake".'
 ));
```

- [ ] **Step 2: Structural sanity check**

Run: `ls -l supabase/seed/seed_ielts_reading_completion_text_drill.sql`
Confirm the file exists (~80 lines); confirm each text_fill `answer_key` has both `accepted` (array) and `word_limit`.

- [ ] **Step 3: Commit**

```bash
git add supabase/seed/seed_ielts_reading_completion_text_drill.sql
git commit -m "feat(reading): golden drill — summary/wordlist/note/short-answer"
```

---

### Task 4: Completion-structured golden drill (MVP-flat)

**Files:**
- Create: `supabase/seed/seed_ielts_reading_completion_structured_drill.sql`

Covers `table_completion`, `flowchart_completion`, `diagram_label`. The grid/flow/diagram is preformatted text inside `payload.passage` with `[ N ]` gap markers (spec §5); each gap is a numbered `text_fill` question. Every answer is derivable from the prose paragraph so the drill is fair without a visual renderer.

- [ ] **Step 1: Create the seed file with this exact content**

```sql
-- ============================================================
-- Golden drill: completion (structured) — MVP-flat rendering.
-- table_completion + flowchart_completion + diagram_label, all text_fill.
-- The table/flow-chart/diagram are preformatted text in payload.passage with
-- [ N ] gap markers; each gap is a numbered text_fill question. A faithful
-- visual stimulus renderer is a later phase (see roadmap).
-- ============================================================

DELETE FROM practice_items
WHERE id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

INSERT INTO practice_items (
  id, type, sub_skill, variant, difficulty_band, criterion_tags, payload, status,
  generator_version, published_at
) VALUES (
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  'reading_set',
  'reading',
  'academic',
  6.0,
  '["reading"]'::jsonb,
  jsonb_build_object(
    'title', 'How chocolate is made',
    'passage',
      'Chocolate begins as the seeds of the cacao tree and passes through several stages before it reaches the shops. ' ||
      'After harvesting, workers remove the beans and let them ferment for several days, which develops the chocolate''s flavour. ' ||
      'The beans are then dried in the sun to reduce their moisture, roasted, and ground into a smooth paste. ' ||
      'Each pod has a tough outer shell that protects the beans inside.' ||
      E'\n\n' ||
      '--- FLOW-CHART (complete the gaps) ---' || E'\n' ||
      'Harvest pods  ->  Remove the [ 1 ]  ->  Ferment for several days  ->  Dry in the sun  ->  Roast  ->  Grind into a [ 2 ]' ||
      E'\n\n' ||
      '--- TABLE (complete the gap) ---' || E'\n' ||
      'Stage         | Purpose' || E'\n' ||
      'Fermentation  | develops the [ 3 ]' || E'\n' ||
      'Drying        | reduces the moisture in the beans' ||
      E'\n\n' ||
      '--- DIAGRAM (label the part) ---' || E'\n' ||
      'A cacao pod cut open: the beans inside are protected by a thick outer [ 4 ].'
  ),
  'published',
  'seed-v1',
  now()
);

-- Q1 — flowchart_completion (gap 1)
INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key, explanation) VALUES
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 1, 'flowchart_completion',
 'Flow-chart gap [ 1 ]: After harvesting, workers remove the ____. (ONE WORD)',
 jsonb_build_object('word_limit', 1),
 '{"accepted": ["beans", "seeds"], "word_limit": 1}'::jsonb,
 jsonb_build_object(
   'rationale', 'The prose says workers remove the beans after harvesting.',
   'evidence', '"After harvesting, workers remove the beans".'
 ));

-- Q2 — flowchart_completion (gap 2)
INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key, explanation) VALUES
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 2, 'flowchart_completion',
 'Flow-chart gap [ 2 ]: The beans are roasted and ground into a ____. (ONE WORD)',
 jsonb_build_object('word_limit', 1),
 '{"accepted": ["paste", "liquor"], "word_limit": 1}'::jsonb,
 jsonb_build_object(
   'rationale', 'The prose says the beans are ground into a smooth paste.',
   'evidence', '"ground into a smooth paste".'
 ));

-- Q3 — table_completion (gap 3)
INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key, explanation) VALUES
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 3, 'table_completion',
 'Table gap [ 3 ]: Fermentation develops the ____. (ONE WORD)',
 jsonb_build_object('word_limit', 1),
 '{"accepted": ["flavour", "flavor"], "word_limit": 1}'::jsonb,
 jsonb_build_object(
   'rationale', 'Fermentation is described as developing the chocolate''s flavour.',
   'evidence', '"let them ferment ... which develops the chocolate''s flavour".'
 ));

-- Q4 — diagram_label (gap 4)
INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key, explanation) VALUES
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 4, 'diagram_label',
 'Diagram gap [ 4 ]: The beans are protected by a thick outer ____. (ONE WORD)',
 jsonb_build_object('word_limit', 1),
 '{"accepted": ["shell", "husk"], "word_limit": 1}'::jsonb,
 jsonb_build_object(
   'rationale', 'The prose states each pod has a tough outer shell protecting the beans.',
   'evidence', '"Each pod has a tough outer shell that protects the beans inside".'
 ));
```

- [ ] **Step 2: Structural sanity check**

Run: `ls -l supabase/seed/seed_ielts_reading_completion_structured_drill.sql`
Confirm the file exists (~80 lines); confirm the four gap markers `[ 1 ]`–`[ 4 ]` in the passage each have a matching numbered question, and `chocolate''s` is doubled-escaped.

- [ ] **Step 3: Commit**

```bash
git add supabase/seed/seed_ielts_reading_completion_structured_drill.sql
git commit -m "feat(reading): golden drill — table/flow-chart/diagram (MVP-flat)"
```

---

### Task 5: Authoring template doc

**Files:**
- Create: `docs/reading-question-type-authoring.md`

- [ ] **Step 1: Create the doc with this exact content**

````markdown
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
{ "max": 2, "choices": [ { "value": "A", "label": "A. …" }, … ] }
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
````

- [ ] **Step 2: Sanity check**

Run: `ls -l docs/reading-question-type-authoring.md`
Confirm the file exists and the four golden-drill UUIDs match Tasks 1–4 exactly.

- [ ] **Step 3: Commit**

```bash
git add docs/reading-question-type-authoring.md
git commit -m "docs(reading): question-type authoring guide for content authors"
```

---

### Task 6: Verification

**Files:** none (verification only).

- [ ] **Step 1: Confirm no engine regressions**

Run: `npm test`
Expected: PASS — 114/114 (unchanged; this phase added no code).

- [ ] **Step 2: Confirm the four seeds parse as a batch (optional local DB)**

If a local Postgres/Supabase is available, run the four files through `psql`/the
SQL editor and confirm no syntax errors. If not, skip — the user applies them.

- [ ] **Step 3: Manual functional checklist (after the user applies the seeds)**

Apply the four seed files in the Supabase SQL editor, then signed in, open each
drill and confirm:
1. `…/88888888-…` — both `mcq_multi` questions render as checkboxes; selecting a
   third option is blocked (cap at 2); submitting gives a mark per correct pick.
2. `…/99999999-…` — matching questions render as single-choice; paragraph and
   researcher/ending banks show; grading is exact.
3. `…/aaaaaaaa-…` — summary/note/short-answer accept typed text and enforce the
   word limit; the wordlist question is single-choice; spelling variants
   (e.g. "flavor") are accepted.
4. `…/bbbbbbbb-…` — the flow-chart/table/diagram text and `[ N ]` gaps show in the
   passage; each numbered gap grades against its accepted answers.
5. All four show per-question explanations on the results page.
6. `/learn/reading` is unchanged and the capstone exam still unlocks only after
   the five real modules' drills are graded (these drills are not modules).

- [ ] **Step 4: Final commit (only if verification required content fixes)**

```bash
git add -A
git commit -m "fix(reading): golden-drill content corrections from verification"
```

---

## Self-Review

**Spec coverage:**
- 11 types (spec §4) → Tasks 1–4 (mcq_multi T1; matching ×3 T2; summary/wordlist/note/short-answer T3; table/flow/diagram T4). ✔
- MVP-flat convention (spec §5) → Task 4 passage stimulus + numbered gaps. ✔
- 4 golden drills with the spec's exact UUIDs (spec §6) → Tasks 1–4. ✔
- Authoring template doc (spec §7) → Task 5. ✔
- Verification: suite green + manual checklist (spec §8) → Task 6. ✔
- File list (spec §9) → all five files created across Tasks 1–5. ✔

**Placeholder scan:** none — every seed/doc step contains complete content.

**Consistency:** the four UUIDs (`8888…`, `9999…`, `aaaa…`, `bbbb…`) are identical in the spec, every seed task, the authoring doc, and the verification checklist. `mcq_multi` uses `max` (options) = `required` (answer_key) = 2. text_fill answer_keys all carry `accepted` + `word_limit`. Gap markers `[ 1 ]`–`[ 4 ]` in Task 4's passage each have a matching question.
