-- ============================================================
-- Seed: two published Writing Task 1 practice items for the demo —
-- one Academic (describe a chart) and one General Training (a letter).
-- The existing Writing flow (/practice/writing/[itemId]) and the
-- writing-grader-v1 prompt already handle Task 1 via {{TASK_TYPE}} and
-- the 150-word rule, so these only need to exist as content.
--
-- Idempotent: deletes any previous demo item with the same demo_key
-- before re-inserting.
-- ============================================================

DELETE FROM practice_items
WHERE type = 'writing_task'
  AND sub_skill = 'writing-task-1-academic'
  AND payload->>'demo_key' = 'demo-task1-academic-coffee-chart';

INSERT INTO practice_items (
  type, sub_skill, variant, difficulty_band, criterion_tags, payload, status,
  generator_version, published_at
) VALUES (
  'writing_task',
  'writing-task-1-academic',
  'academic',
  6.5,
  '["task_response","coherence","lexical","grammar"]'::jsonb,
  jsonb_build_object(
    'demo_key', 'demo-task1-academic-coffee-chart',
    'title', 'Coffee consumption by age group',
    'prompt',
      'The chart below shows the average number of cups of coffee consumed per day ' ||
      'by four different age groups in a European country in 2010 and 2020.' ||
      E'\n\n' ||
      'Summarise the information by selecting and reporting the main features, ' ||
      'and make comparisons where relevant.' ||
      E'\n\n' ||
      'Approximate figures (cups per day):' ||
      E'\n  18-30:  2010 = 1.8,  2020 = 2.6' ||
      E'\n  31-45:  2010 = 2.5,  2020 = 2.9' ||
      E'\n  46-60:  2010 = 2.1,  2020 = 1.7' ||
      E'\n  60+:    2010 = 1.2,  2020 = 0.9' ||
      E'\n\n' ||
      'Write at least 150 words.',
    'minimum_words', 150,
    'time_limit_minutes', 20
  ),
  'published',
  'seed-v1',
  now()
);

DELETE FROM practice_items
WHERE type = 'writing_task'
  AND sub_skill = 'writing-task-1-general'
  AND payload->>'demo_key' = 'demo-task1-general-neighbour-letter';

INSERT INTO practice_items (
  type, sub_skill, variant, difficulty_band, criterion_tags, payload, status,
  generator_version, published_at
) VALUES (
  'writing_task',
  'writing-task-1-general',
  'general',
  6.5,
  '["task_response","coherence","lexical","grammar"]'::jsonb,
  jsonb_build_object(
    'demo_key', 'demo-task1-general-neighbour-letter',
    'title', 'A letter to your neighbour',
    'prompt',
      'You are going to be away from home for two weeks, and a neighbour has ' ||
      'agreed to look after your house while you are gone.' ||
      E'\n\nWrite a letter to your neighbour. In your letter:\n' ||
      E'  - thank them for agreeing to help\n' ||
      E'  - explain what needs to be done while you are away\n' ||
      E'  - say how they can contact you if there is a problem\n\n' ||
      'You do NOT need to write any addresses.' ||
      E'\n\nBegin your letter "Dear ...".\n\n' ||
      'Write at least 150 words.',
    'minimum_words', 150,
    'time_limit_minutes', 20
  ),
  'published',
  'seed-v1',
  now()
);
