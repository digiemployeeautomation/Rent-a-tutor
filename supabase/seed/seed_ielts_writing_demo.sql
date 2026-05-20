-- ============================================================
-- Seed: one published Writing Task 2 practice item for the demo.
-- Idempotent: deletes any previous demo item with the same payload
-- key before re-inserting.
-- ============================================================

DELETE FROM practice_items
WHERE type = 'writing_task'
  AND sub_skill = 'writing-task-2'
  AND payload->>'demo_key' = 'demo-task2-technology-society';

INSERT INTO practice_items (
  type, sub_skill, variant, difficulty_band, criterion_tags, payload, status,
  generator_version, published_at
) VALUES (
  'writing_task',
  'writing-task-2',
  'both',
  6.5,
  '["task_response","coherence","lexical","grammar"]'::jsonb,
  jsonb_build_object(
    'demo_key', 'demo-task2-technology-society',
    'title', 'Technology and society',
    'prompt',
      'Some people believe that technology has made our lives easier and more comfortable. ' ||
      'Others argue that it has made people lazy and disconnected from real life. ' ||
      E'\n\nDiscuss both views and give your own opinion.\n\n' ||
      'Write at least 250 words.',
    'minimum_words', 250,
    'time_limit_minutes', 40
  ),
  'published',
  'seed-v1',
  now()
);
