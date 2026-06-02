-- ============================================================
-- Seed: three published Speaking practice items for the demo —
-- one each for Part 1, Part 2 (cue card), and Part 3.
-- Speaking has no practice_questions rows (the prompt lives in payload).
-- Idempotent: deletes any previous demo item with the same demo_key
-- before re-inserting.
-- ============================================================

DELETE FROM practice_items
WHERE type = 'speaking_task'
  AND payload->>'demo_key' IN (
    'demo-speaking-part1-hometown',
    'demo-speaking-part2-book',
    'demo-speaking-part3-technology'
  );

-- Part 1 — short interview-style questions.
INSERT INTO practice_items (
  type, sub_skill, variant, difficulty_band, criterion_tags, payload, status,
  generator_version, published_at
) VALUES (
  'speaking_task',
  'speaking-part-1',
  'both',
  6.0,
  '["fluency","lexical","grammar","pronunciation"]'::jsonb,
  jsonb_build_object(
    'demo_key', 'demo-speaking-part1-hometown',
    'title', 'Your hometown',
    'prompt',
      E'Let''s talk about your hometown.\n\n' ||
      E'• Where is your hometown?\n' ||
      E'• What do you like most about it?\n' ||
      E'• Has it changed much in recent years?\n' ||
      E'• Would you recommend it to a tourist? Why or why not?',
    'prep_seconds', 0,
    'speak_seconds', 90
  ),
  'published',
  'seed-v1',
  now()
);

-- Part 2 — cue card with prep time.
INSERT INTO practice_items (
  type, sub_skill, variant, difficulty_band, criterion_tags, payload, status,
  generator_version, published_at
) VALUES (
  'speaking_task',
  'speaking-part-2',
  'both',
  6.5,
  '["fluency","lexical","grammar","pronunciation"]'::jsonb,
  jsonb_build_object(
    'demo_key', 'demo-speaking-part2-book',
    'title', 'Describe a book you enjoyed reading',
    'prompt',
      E'Describe a book you enjoyed reading.\n\n' ||
      E'You should say:\n' ||
      E'• what the book was\n' ||
      E'• when and why you read it\n' ||
      E'• what it was about\n' ||
      E'and explain why you enjoyed it.\n\n' ||
      E'You have one minute to prepare, then speak for one to two minutes.',
    'prep_seconds', 60,
    'speak_seconds', 120
  ),
  'published',
  'seed-v1',
  now()
);

-- Part 3 — discussion questions.
INSERT INTO practice_items (
  type, sub_skill, variant, difficulty_band, criterion_tags, payload, status,
  generator_version, published_at
) VALUES (
  'speaking_task',
  'speaking-part-3',
  'both',
  7.0,
  '["fluency","lexical","grammar","pronunciation"]'::jsonb,
  jsonb_build_object(
    'demo_key', 'demo-speaking-part3-technology',
    'title', 'Technology and reading',
    'prompt',
      E'Let''s discuss reading and technology more generally.\n\n' ||
      E'• How has technology changed the way people read?\n' ||
      E'• Do you think printed books will disappear in the future?\n' ||
      E'• What are the advantages and disadvantages of e-books?\n' ||
      E'• Should children be encouraged to read more? How?',
    'prep_seconds', 0,
    'speak_seconds', 150
  ),
  'published',
  'seed-v1',
  now()
);
