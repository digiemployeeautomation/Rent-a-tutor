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
