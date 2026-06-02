-- ============================================================
-- Seed: one published Academic Reading set for the demo, with 6
-- questions spanning the single_select, multi_select-free, and
-- text_fill primitives (tfng, mcq_single, matching_headings, plus
-- two text_fill completions and a short-answer).
--
-- Idempotent: a fixed item UUID lets the questions FK it directly, and
-- the DELETE on that id (ON DELETE CASCADE) clears prior questions
-- before re-inserting.
--
-- Column conventions (migration 007):
--   options : single/multi-select → { "choices": [{ value, label }, ... ] }
--             text_fill           → { "word_limit": N }  (UI guidance only)
--   answer_key (server-only, migration 006):
--             single_select → { "value": "B" }
--             text_fill     → { "accepted": [...], "word_limit": N }
-- ============================================================

DELETE FROM practice_items
WHERE id = '11111111-1111-4111-8111-111111111111';

INSERT INTO practice_items (
  id, type, sub_skill, variant, difficulty_band, criterion_tags, payload, status,
  generator_version, published_at
) VALUES (
  '11111111-1111-4111-8111-111111111111',
  'reading_set',
  'reading',
  'academic',
  6.5,
  '["reading"]'::jsonb,
  jsonb_build_object(
    'demo_key', 'demo-reading-urban-bees',
    'title', 'Bees in the city',
    'passage',
      'A. For most people, bees belong to the countryside, drifting between wildflowers in open meadows. ' ||
      'Yet over the past two decades, researchers have recorded a surprising trend: many bee species are thriving in cities. ' ||
      E'\n\n' ||
      'B. Urban gardens, parks and even rooftops offer bees an unusually varied diet. ' ||
      'Unlike farmland, where a single crop may dominate for kilometres, a city block can contain hundreds of different flowering plants, ' ||
      'each blooming at a slightly different time. This diversity means that urban bees rarely run short of food. ' ||
      E'\n\n' ||
      'C. Temperature also plays a part. Cities tend to be several degrees warmer than the surrounding land, a phenomenon known as the urban heat island. ' ||
      'Warmer conditions allow bees to begin foraging earlier in the year and to remain active later into the autumn. ' ||
      E'\n\n' ||
      'D. There are dangers, however. Pesticides used in private gardens can harm bees, and busy roads fragment the green spaces they depend on. ' ||
      'Conservationists argue that planting connected corridors of flowers would help urban bee populations remain stable. ' ||
      'Researchers counted more than 50 wild bee species in a single survey of one large European capital.',
    'minimum_reading_minutes', 20
  ),
  'published',
  'seed-v1',
  now()
);

-- Q1 — matching_headings (single_select with options.choices)
INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key) VALUES
('11111111-1111-4111-8111-111111111111', 1, 'matching_headings',
 'Choose the correct heading for paragraph B.',
 jsonb_build_object('choices', jsonb_build_array(
   jsonb_build_object('value', 'i',   'label', 'i. A wider choice of food'),
   jsonb_build_object('value', 'ii',  'label', 'ii. The dangers of traffic'),
   jsonb_build_object('value', 'iii', 'label', 'iii. Warmer city temperatures')
 )),
 '{"value": "i"}'::jsonb);

-- Q2 — tfng (single_select, fixedOptions from the registry → options stays null)
INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key) VALUES
('11111111-1111-4111-8111-111111111111', 2, 'tfng',
 'City bees usually have less food available to them than bees on farmland.',
 NULL,
 '{"value": "FALSE"}'::jsonb);

-- Q3 — tfng (Not Given)
INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key) VALUES
('11111111-1111-4111-8111-111111111111', 3, 'tfng',
 'More bee species live in cities than in the countryside.',
 NULL,
 '{"value": "NOT GIVEN"}'::jsonb);

-- Q4 — mcq_single (single_select with options.choices)
INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key) VALUES
('11111111-1111-4111-8111-111111111111', 4, 'mcq_single',
 'According to the passage, the urban heat island effect allows bees to',
 jsonb_build_object('choices', jsonb_build_array(
   jsonb_build_object('value', 'A', 'label', 'A. produce more honey.'),
   jsonb_build_object('value', 'B', 'label', 'B. forage over a longer season.'),
   jsonb_build_object('value', 'C', 'label', 'C. avoid the use of pesticides.'),
   jsonb_build_object('value', 'D', 'label', 'D. travel between cities more easily.')
 )),
 '{"value": "B"}'::jsonb);

-- Q5 — sentence_completion (text_fill)
INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key) VALUES
('11111111-1111-4111-8111-111111111111', 5, 'sentence_completion',
 'Conservationists suggest planting connected ____ of flowers to keep bee numbers stable.',
 jsonb_build_object('word_limit', 1),
 '{"accepted": ["corridors", "corridor"], "word_limit": 1}'::jsonb);

-- Q6 — short_answer (text_fill, numeric)
INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key) VALUES
('11111111-1111-4111-8111-111111111111', 6, 'short_answer',
 'How many wild bee species were counted in the survey of one European capital?',
 jsonb_build_object('word_limit', 2),
 '{"accepted": ["50", "more than 50", "fifty"], "word_limit": 2}'::jsonb);
